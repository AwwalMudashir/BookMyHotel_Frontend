// Purpose: Formats prices with the correct currency symbol.
export const formatCurrency = (amount) => `£${amount ?? 0}`;
export default formatCurrency;
