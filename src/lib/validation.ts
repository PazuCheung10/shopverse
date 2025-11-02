import { z } from 'zod';

export const CartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
});

export const AddressSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(2).max(20),
  country: z.string().length(2), // ISO-3166-1 alpha-2
});

export const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  address: AddressSchema,
});

export type CheckoutPayload = z.infer<typeof CheckoutSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Address = z.infer<typeof AddressSchema>;

