import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function TestComponent() {
  return (
    <div className="bg-slate-900 text-white p-4">
      <h1 className="text-2xl font-bold text-cyan-300">ShopVerse</h1>
      <p className="text-slate-300">Test component</p>
    </div>
  );
}

describe('Smoke Test', () => {
  it('renders a component with Tailwind classes', () => {
    render(<TestComponent />);
    
    const heading = screen.getByText('ShopVerse');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-cyan-300');
    
    const paragraph = screen.getByText('Test component');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveClass('text-slate-300');
  });

  it('verifies test environment is working', () => {
    expect(true).toBe(true);
  });
});

