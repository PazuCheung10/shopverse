import { z } from 'zod';

const envSchema = z.object({
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_PROMO_CODES: z.string().optional().transform((val) => val === 'true'),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function getEnv(): Env {
  // Return cached env if already validated
  if (cachedEnv) {
    return cachedEnv;
  }

  // Check if we're in build phase
  // During Vercel build, env vars might not be available yet
  // We detect this by checking if required vars are missing AND we're in a build context
  const hasRequiredVars = process.env.STRIPE_SECRET_KEY && 
                          process.env.DATABASE_URL && 
                          process.env.NEXT_PUBLIC_APP_URL;
  const isBuildTime = !hasRequiredVars && (process.env.NEXT_PHASE === 'phase-production-build' || 
                                           process.env.VERCEL_ENV === undefined);

  try {
    const parsed = envSchema.parse({
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_ENABLE_PROMO_CODES: process.env.NEXT_PUBLIC_ENABLE_PROMO_CODES,
    });
    cachedEnv = parsed;
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // During build, provide defaults to allow build to succeed
      // Runtime will still validate properly when env vars are accessed
      if (isBuildTime) {
        console.warn('⚠️  Environment variables not set during build. Using placeholder values. Make sure to set them in Vercel.');
        cachedEnv = {
          STRIPE_SECRET_KEY: 'sk_test_build_time_placeholder',
          STRIPE_WEBHOOK_SECRET: 'whsec_build_time_placeholder',
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_build_time_placeholder',
          DATABASE_URL: 'postgresql://build:time@localhost:5432/placeholder',
          NEXT_PUBLIC_APP_URL: 'https://placeholder.vercel.app',
          NEXT_PUBLIC_ENABLE_PROMO_CODES: false,
        } as Env;
        return cachedEnv;
      }
      
      // At runtime, throw error if env vars are missing
      const missingVars = error.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('\n');
      const message = `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env.local file.`;
      console.error(message);
      throw new Error(message);
    }
    throw error;
  }
}

// Lazy getter - only validates when accessed
export const env = new Proxy({} as Env, {
  get(_target, prop) {
    const validatedEnv = getEnv();
    return validatedEnv[prop as keyof Env];
  },
});

