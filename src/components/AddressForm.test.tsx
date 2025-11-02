import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressForm from './AddressForm';

describe('AddressForm', () => {
  const validAddress = {
    email: 'test@example.com',
    name: 'John Doe',
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  };

  const mockOnSubmit = vi.fn();
  const mockOnValidityChange = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnValidityChange.mockClear();
  });

  it('renders all form fields', () => {
    render(
      <AddressForm onSubmit={mockOnSubmit} onValidityChange={mockOnValidityChange} />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address line 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it('pre-fills email from defaultEmail prop', () => {
    render(
      <AddressForm
        defaultEmail="prefilled@example.com"
        onSubmit={mockOnSubmit}
        onValidityChange={mockOnValidityChange}
      />
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('prefilled@example.com');
  });

  it('shows validation errors for invalid fields', async () => {
    const user = userEvent.setup();
    render(<AddressForm onSubmit={mockOnSubmit} onValidityChange={mockOnValidityChange} />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Blur to trigger validation

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();
    render(<AddressForm onSubmit={mockOnSubmit} onValidityChange={mockOnValidityChange} />);

    await user.type(screen.getByLabelText(/email/i), validAddress.email);
    await user.type(screen.getByLabelText(/full name/i), validAddress.name);
    await user.type(screen.getByLabelText(/address line 1/i), validAddress.addressLine1);
    await user.type(screen.getByLabelText(/city/i), validAddress.city);
    await user.type(screen.getByLabelText(/postal code/i), validAddress.postalCode);
    await user.selectOptions(screen.getByLabelText(/country/i), validAddress.country);

    // Wait for form to become valid, then submit via hidden submit button
    await waitFor(() => {
      const validityInput = screen.getByTestId('form-validity');
      expect(validityInput).toHaveAttribute('data-form-valid', 'true');
    });

    const form = document.querySelector('form') as HTMLFormElement;
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validAddress.email,
          name: validAddress.name,
          addressLine1: validAddress.addressLine1,
          city: validAddress.city,
          postalCode: validAddress.postalCode,
          country: validAddress.country,
        }),
        expect.anything()
      );
    });
  });

  it('notifies parent of validity changes', async () => {
    const user = userEvent.setup();
    render(<AddressForm onSubmit={mockOnSubmit} onValidityChange={mockOnValidityChange} />);

    // Initially invalid (empty form)
    await waitFor(() => {
      expect(mockOnValidityChange).toHaveBeenCalledWith(false);
    });

    // Fill required fields to make valid
    await user.type(screen.getByLabelText(/email/i), validAddress.email);
    await user.type(screen.getByLabelText(/full name/i), validAddress.name);
    await user.type(screen.getByLabelText(/address line 1/i), validAddress.addressLine1);
    await user.type(screen.getByLabelText(/city/i), validAddress.city);
    await user.type(screen.getByLabelText(/postal code/i), validAddress.postalCode);

    await waitFor(() => {
      expect(mockOnValidityChange).toHaveBeenCalledWith(true);
    }, { timeout: 2000 });
  });

  it('prevents submission when form is invalid', async () => {
    const user = userEvent.setup();
    render(<AddressForm onSubmit={mockOnSubmit} onValidityChange={mockOnValidityChange} />);

    // Try to submit empty form via form element
    const form = document.querySelector('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form?.dispatchEvent(submitEvent);

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});

