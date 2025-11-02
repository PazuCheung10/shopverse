/**
 * Simple in-memory rate limiter using sliding window.
 * 
 * Note: On serverless (Vercel, etc.), memory resets between cold starts,
 * so rate limits reset. This is fine for demo/portfolio purposes.
 * For production, use a persistent store (Redis, database) or Vercel Edge Config.
 */

interface RateLimitEntry {
  timestamps: number[];
  windowStart: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.store = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if a key has exceeded the rate limit.
   * Returns { allowed: boolean, remaining?: number, resetAt?: number }
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First request for this key
      this.store.set(key, {
        timestamps: [now],
        windowStart: now,
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    // Remove timestamps outside the current window
    const windowStart = now - this.windowMs;
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
    entry.windowStart = windowStart;

    if (entry.timestamps.length >= this.maxRequests) {
      // Rate limit exceeded
      const oldestRequest = entry.timestamps[0];
      const resetAt = oldestRequest + this.windowMs;
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request
    entry.timestamps.push(now);
    const remaining = this.maxRequests - entry.timestamps.length;

    return {
      allowed: true,
      remaining,
      resetAt: now + this.windowMs,
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, entry] of this.store.entries()) {
      // Remove entries with no requests in the current window
      if (entry.timestamps.every((ts) => ts <= windowStart)) {
        this.store.delete(key);
      }
    }
  }
}

// Default: 10 requests per 1 minute window
export const checkoutRateLimiter = new RateLimiter(60 * 1000, 10);

/**
 * Get client identifier from request headers (IP address).
 * Falls back to a hashed session cookie if available.
 */
export function getClientId(req: Request): string {
  // Try to get IP from various headers (common in proxy/load balancer setups)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ip = forwardedFor.split(',')[0].trim();
    if (ip) return ip;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback: use a combination of user-agent and connection (for demo)
  // In production, you'd want better IP extraction
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const acceptLanguage = req.headers.get('accept-language') || '';
  
  // Simple hash-like identifier (not cryptographic)
  const combined = `${userAgent}:${acceptLanguage}`;
  return `fallback:${Buffer.from(combined).toString('base64').slice(0, 16)}`;
}

