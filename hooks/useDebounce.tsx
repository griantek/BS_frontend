import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): [T, (value: T) => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes within the delay period
    // This helps ensure we only capture the final value
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, setDebouncedValue];
}
