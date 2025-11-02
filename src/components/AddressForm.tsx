'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSchema, type Address } from '@/lib/validation';

interface AddressFormProps {
  defaultEmail?: string;
  onSubmit: (data: Address) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export default function AddressForm({
  defaultEmail = '',
  onSubmit,
  onValidityChange,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Address>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      email: defaultEmail,
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    mode: 'onChange',
  });

  // Notify parent of validity changes
  useEffect(() => {
    onValidityChange?.(isValid);
  }, [isValid, onValidityChange]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="addressLine1" className="block text-sm font-medium text-slate-300 mb-2">
          Address Line 1 <span className="text-red-400">*</span>
        </label>
        <input
          id="addressLine1"
          type="text"
          {...register('addressLine1')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="123 Main St"
        />
        {errors.addressLine1 && (
          <p className="mt-1 text-sm text-red-400">{errors.addressLine1.message}</p>
        )}
      </div>

      {/* Address Line 2 (Optional) */}
      <div>
        <label htmlFor="addressLine2" className="block text-sm font-medium text-slate-300 mb-2">
          Address Line 2 <span className="text-slate-500 text-xs">(Optional)</span>
        </label>
        <input
          id="addressLine2"
          type="text"
          {...register('addressLine2')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="Apt, Suite, etc."
        />
        {errors.addressLine2 && (
          <p className="mt-1 text-sm text-red-400">{errors.addressLine2.message}</p>
        )}
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
          City <span className="text-red-400">*</span>
        </label>
        <input
          id="city"
          type="text"
          {...register('city')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="New York"
        />
        {errors.city && (
          <p className="mt-1 text-sm text-red-400">{errors.city.message}</p>
        )}
      </div>

      {/* State (Optional) */}
      <div>
        <label htmlFor="state" className="block text-sm font-medium text-slate-300 mb-2">
          State/Province <span className="text-slate-500 text-xs">(Optional)</span>
        </label>
        <input
          id="state"
          type="text"
          {...register('state')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="NY"
        />
        {errors.state && (
          <p className="mt-1 text-sm text-red-400">{errors.state.message}</p>
        )}
      </div>

      {/* Postal Code */}
      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium text-slate-300 mb-2">
          Postal Code <span className="text-red-400">*</span>
        </label>
        <input
          id="postalCode"
          type="text"
          {...register('postalCode')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          placeholder="10001"
        />
        {errors.postalCode && (
          <p className="mt-1 text-sm text-red-400">{errors.postalCode.message}</p>
        )}
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-slate-300 mb-2">
          Country <span className="text-red-400">*</span>
        </label>
        <select
          id="country"
          {...register('country')}
          className="w-full px-4 py-2 bg-white/10 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="HK">Hong Kong</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="JP">Japan</option>
        </select>
        {errors.country && (
          <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>
        )}
      </div>

      {/* Hidden submit button - validation exposed via isValid */}
      <button type="submit" className="hidden" aria-hidden="true" />
      <input type="hidden" value={isValid ? 'valid' : 'invalid'} data-form-valid={isValid} />
    </form>
  );
}
