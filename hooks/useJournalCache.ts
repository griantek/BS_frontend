import { useState, useEffect } from 'react';
import { JournalData } from '@/services/api';

// Cache configuration - Make the cache last longer
const CACHE_KEY = 'editor_journals_cache';
const CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
const BACKGROUND_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes for background refresh

interface CachedData {
  data: JournalData[];
  timestamp: number;
  userId: string;
  lastFetchTime: number;
}

export function useJournalCache() {
  const [cachedJournals, setCachedJournals] = useState<JournalData[] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Load data from cache when the hook is initialized
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Attempt to load cache
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (cacheStr) {
        const cache: CachedData = JSON.parse(cacheStr);
        const now = Date.now();
        
        // Check if cache is expired
        if (now - cache.timestamp <= CACHE_EXPIRY_TIME) {
          // Check if the cached data belongs to the current user
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.id === cache.userId) {
              // Valid cache - set the data
              setCachedJournals(cache.data);
              setLastFetchTime(cache.lastFetchTime || 0);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      // In case of error, clear the cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save data to cache
  const saveToCache = (data: JournalData[]) => {
    if (typeof window === 'undefined') return;

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const now = Date.now();
      
      const cacheData: CachedData = {
        data,
        timestamp: now,
        userId: user.id,
        lastFetchTime: now
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedJournals(data);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Check if we need to refresh based on time
  const shouldRefreshInBackground = () => {
    const now = Date.now();
    return now - lastFetchTime > BACKGROUND_REFRESH_INTERVAL;
  };

  // Clear the cache
  const clearCache = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEY);
    setCachedJournals(null);
    setLastFetchTime(0);
  };

  return {
    cachedJournals,
    saveToCache,
    clearCache,
    isLoaded,
    shouldRefreshInBackground
  };
}
