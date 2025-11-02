export const routes = {
  home: '/',
  product: (slug: string) => `/product/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  success: '/success',
  cancel: '/cancel',
  order: (id: string) => `/order/${id}`,
} as const;

