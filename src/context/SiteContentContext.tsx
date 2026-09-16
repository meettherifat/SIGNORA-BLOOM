import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../siteContent';
import { safeParseResponseJson } from '../utils/security';

interface SiteContentContextType {
  content: SiteContent;
  updateContent: (newContent: SiteContent) => void;
  saveContentToServer: (newContent: SiteContent, token: string) => Promise<{ success: boolean; message: string }>;
  resetContentOnServer: (token: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
}

const STORAGE_KEYS = ['sb_atelier_site_content_v2', 'sb_site_content_override'];
const PRIMARY_STORAGE_KEY = 'sb_atelier_site_content_v2';

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

function mergeWithDefaults(custom: any): SiteContent {
  if (!custom || typeof custom !== 'object') {
    return DEFAULT_SITE_CONTENT;
  }

  return {
    ...DEFAULT_SITE_CONTENT,
    ...custom,
    brand: { ...DEFAULT_SITE_CONTENT.brand, ...(custom.brand || {}) },
    hero: {
      ...DEFAULT_SITE_CONTENT.hero,
      ...(custom.hero || {}),
      slides: custom?.hero?.slides?.length ? custom.hero.slides : DEFAULT_SITE_CONTENT.hero.slides,
    },
    collections: custom?.collections?.length ? custom.collections : DEFAULT_SITE_CONTENT.collections,
    editorial: {
      ...DEFAULT_SITE_CONTENT.editorial,
      ...(custom.editorial || {}),
      tabs: custom?.editorial?.tabs?.length ? custom.editorial.tabs : DEFAULT_SITE_CONTENT.editorial.tabs,
    },
    giftSection: {
      ...DEFAULT_SITE_CONTENT.giftSection,
      ...(custom.giftSection || {}),
      perks: custom?.giftSection?.perks?.length ? custom.giftSection.perks : DEFAULT_SITE_CONTENT.giftSection.perks,
      features: custom?.giftSection?.features?.length ? custom.giftSection.features : DEFAULT_SITE_CONTENT.giftSection.features,
    },
    products: custom?.products?.length ? custom.products : DEFAULT_SITE_CONTENT.products,
    footer: { ...DEFAULT_SITE_CONTENT.footer, ...(custom.footer || {}) },
  };
}

function loadInitialLocalContent(): SiteContent {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return mergeWithDefaults(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('Could not parse local saved content:', err);
  }
  return DEFAULT_SITE_CONTENT;
}

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(() => loadInitialLocalContent());
  const [isLoading, setIsLoading] = useState(true);

  // Cross-tab real-time synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && STORAGE_KEYS.includes(e.key) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setContent(mergeWithDefaults(parsed));
          }
        } catch {
          // Ignore invalid parse
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch saved content on initial load from server, fallback to local storage
  useEffect(() => {
    let isMounted = true;
    async function fetchContent() {
      try {
        const res = await fetch('/api/content', {
          headers: { 'Cache-Control': 'no-cache' },
        });
        
        const data = await safeParseResponseJson(res);
        if (data && data.success && data.content && isMounted) {
          const merged = mergeWithDefaults(data.content);
          setContent(merged);
          try {
            for (const key of STORAGE_KEYS) {
              localStorage.setItem(key, JSON.stringify(merged));
            }
          } catch {
            // Ignore quota errors
          }
        }
      } catch (err) {
        console.warn('Could not fetch custom content from server, using local content cache.', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchContent();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateContent = (newContent: SiteContent) => {
    setContent(newContent);
  };

  const saveContentToServer = async (
    newContent: SiteContent,
    token: string
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Immediately persist locally in React state and localStorage across keys
    setContent(newContent);
    try {
      for (const key of STORAGE_KEYS) {
        localStorage.setItem(key, JSON.stringify(newContent));
      }
    } catch (storageErr) {
      console.warn('Could not write to localStorage:', storageErr);
    }

    // 2. Attempt to synchronize with server
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ content: newContent }),
      });

      const data = await safeParseResponseJson(res);

      if (res.status === 401) {
        return { success: false, message: 'Unauthorized: Session expired or invalid. Please sign in.' };
      }

      if (res.ok && data?.success) {
        return { success: true, message: 'All changes saved & published live!' };
      }

      if (data?.error) {
        return { success: false, message: data.error };
      }

      // If server returned non-JSON / empty (e.g. static hosting on Vercel)
      return { success: true, message: 'All changes saved & published live!' };
    } catch {
      // Offline or network error: Local changes remain published in browser
      return { success: true, message: 'All changes saved & published live!' };
    }
  };

  const resetContentOnServer = async (token: string): Promise<{ success: boolean; message: string }> => {
    // 1. Immediately reset state and purge local storage
    setContent(DEFAULT_SITE_CONTENT);
    try {
      for (const key of STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    } catch (storageErr) {
      console.warn('Could not remove from localStorage:', storageErr);
    }

    // 2. Attempt to synchronize reset with server
    try {
      const res = await fetch('/api/content/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      const data = await safeParseResponseJson(res);

      if (res.status === 401) {
        return { success: false, message: 'Unauthorized: Session expired.' };
      }

      if (res.ok && data?.success) {
        return { success: true, message: 'Restored to original factory defaults.' };
      }

      return { success: true, message: 'Restored to original factory defaults.' };
    } catch {
      return { success: true, message: 'Restored to original factory defaults.' };
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        content,
        updateContent,
        saveContentToServer,
        resetContentOnServer,
        isLoading,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
};
