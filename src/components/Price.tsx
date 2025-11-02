export default function Price({ amount, currency = 'usd' }: { amount: number; currency?: string }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  return <span>{formatted}</span>;
}
