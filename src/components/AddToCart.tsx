'use client';

interface AddToCartProps {
  productId: string;
  disabled?: boolean;
}

export default function AddToCart({ productId, disabled = false }: AddToCartProps) {
  const handleClick = () => {
    // TODO: Implement cart logic
    console.log('Add to cart:', productId);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="w-full px-6 py-3 bg-cyan-400 text-slate-900 font-semibold rounded-lg hover:bg-cyan-300 active:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label={`Add ${productId} to cart`}
    >
      Add to Cart
    </button>
  );
}
