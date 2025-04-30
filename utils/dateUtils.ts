/**
 * Format a date string to a human-readable format
 * @param dateString The date string to format
 * @param format Optional format (default: 'standard')
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string, 
  format: 'standard' | 'short' | 'long' | 'time' | 'datetime' = 'standard'
): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case 'short':
        options.day = 'numeric';
        options.month = 'short';
        break;
        
      case 'long':
        options.day = 'numeric';
        options.month = 'long';
        options.year = 'numeric';
        options.weekday = 'long';
        break;
        
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
        
      case 'datetime':
        options.day = 'numeric';
        options.month = 'short';
        options.year = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
        
      case 'standard':
      default:
        options.day = 'numeric';
        options.month = 'short';
        options.year = 'numeric';
    }
    
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error formatting date';
  }
};

/**
 * Get a relative time string (e.g., "2 days ago", "in 3 hours")
 * @param dateString The date string to get relative time for
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    
    // Convert to appropriate unit
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) {
      return rtf.format(diffInDays, 'day');
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) {
      return rtf.format(diffInMonths, 'month');
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return rtf.format(diffInYears, 'year');
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Error getting relative time';
  }
};

/**
 * Check if a date is today
 * @param dateString The date string to check
 * @returns Boolean indicating if the date is today
 */
export const isToday = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Format a date range (e.g., "May 1 - May 5, 2023")
 * @param startDateString Start date string
 * @param endDateString End date string
 * @returns Formatted date range string
 */
export const formatDateRange = (startDateString: string, endDateString: string): string => {
  if (!startDateString || !endDateString) return '';
  
  try {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid date range';
    }
    
    // Same year
    if (startDate.getFullYear() === endDate.getFullYear()) {
      // Same month
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()}`;
      }
      // Different month, same year
      return `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    
    // Different years
    return `${formatDate(startDateString)} - ${formatDate(endDateString)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Error formatting date range';
  }
};
