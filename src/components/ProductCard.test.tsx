import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

// Mock Next.js Image and Link
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} data-testid="product-image" {...props} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ProductCard', () => {
  const mockProduct = {
    id: 'clx123',
    slug: 'test-product',
    name: 'Test Product',
    description: 'This is a test product description',
    imageUrl: 'https://example.com/image.jpg',
    unitAmount: 1999,
    currency: 'usd',
  };

  it('renders product information correctly', () => {
    render(<ProductCard p={mockProduct} index={0} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByTestId('product-image')).toHaveAttribute('src', mockProduct.imageUrl);
    expect(screen.getByTestId('product-image')).toHaveAttribute('alt', mockProduct.name);
  });

  it('renders product link with correct href', () => {
    render(<ProductCard p={mockProduct} index={0} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/product/test-product');
  });

  it('displays price correctly', () => {
    render(<ProductCard p={mockProduct} index={0} />);

    // Price component should render $19.99
    expect(screen.getByText(/\$19\.99/)).toBeInTheDocument();
  });
});

