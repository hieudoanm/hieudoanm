export const formatNumber = (x: number = 0) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatCurrency = (number: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    number
  );
};
