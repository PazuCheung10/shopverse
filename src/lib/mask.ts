/**
 * Masks sensitive address information for display
 */
export function maskAddress(line1: string | null | undefined): string {
  if (!line1) return 'N/A';
  // Show only last 4 characters
  if (line1.length <= 4) return line1;
  return '****' + line1.slice(-4);
}

export function maskEmail(email: string): string {
  if (!email) return 'N/A';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return email;
  return local.slice(0, 2) + '***@' + domain;
}

