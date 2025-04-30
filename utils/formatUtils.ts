/**
 * Format a number as Indian currency (₹)
 * @param amount The number to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  // Handle null, undefined, or NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  // Format with Indian numbering system (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * Format a number with thousands separators
 * @param value The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-IN').format(value);
};

/**
 * Format a percentage
 * @param value The decimal value (e.g., 0.25 for 25%)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis if it exceeds maxLength
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};
