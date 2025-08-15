
export const currencyFormatter = (value: number | null | undefined, currency: string = 'EUR'): string => {
  if (value === null || value === undefined) return '€0';
  
  const formatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(value);
};
