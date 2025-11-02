export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Convert from cents
}

export function formatPrice(unitAmount: number, currency: string = 'usd'): string {
  return formatCurrency(unitAmount, currency);
}

