import { formatPrice } from '@/lib/currency';

interface PriceProps {
  unitAmount: number;
  currency?: string;
  className?: string;
}

export default function Price({ unitAmount, currency = 'usd', className = '' }: PriceProps) {
  return (
    <span className={`font-semibold ${className}`}>
      {formatPrice(unitAmount, currency)}
    </span>
  );
}
