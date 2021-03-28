export const { format: formatPrice } = new Intl.NumberFormat('eu-AU', {
  style: 'currency',
  currency: 'AUD',
});
