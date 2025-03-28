import { useState, useEffect } from 'react';
import { JournalData } from '@/services/api';

// Cache configuration
const CACHE_KEY = 'editor_journals_cache';
const CACHE_EXPIRY_TIME = 2 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: JournalData[];
  timestamp: number;
  userId: string;
}

export function useJournalCache() {
  const [cachedJournals, setCachedJournals] = useState<JournalData[] | null>(null);

  // Load data from cache when the hook is initialized
  useEffect(() => {
    loadFromCache();
  }, []);

  // Load data from cache
  const loadFromCache = (): JournalData[] | null => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (!cacheStr) return null;

      const cache: CachedData = JSON.parse(cacheStr);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cache.timestamp > CACHE_EXPIRY_TIME) {
        clearCache();
        return null;
      }
      
      // Check if the cached data belongs to the current user
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      if (user.id !== cache.userId) {
        clearCache();
        return null;
      }
      
      setCachedJournals(cache.data);
      return cache.data;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  };

  // Save data to cache
  const saveToCache = (data: JournalData[]) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
        userId: user.id
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedJournals(data);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Clear the cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setCachedJournals(null);
  };

  return {
    cachedJournals,
    saveToCache,
    clearCache,
  };
}
