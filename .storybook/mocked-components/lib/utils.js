// Basic mock of the cn function
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Add any other utility functions that are commonly imported from @/lib/utils
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export default {
  cn,
  formatDate,
  formatCurrency,
}; 