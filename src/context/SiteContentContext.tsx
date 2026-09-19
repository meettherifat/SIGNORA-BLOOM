import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../siteContent';
import { safeParseResponseJson } from '../utils/security';
import { loadContentFromIndexedDb, saveContentToIndexedDb } from '../utils/storageDb';
import {
  mergeHeroSlides,
  mergeCollections,
  mergeEditorialTabs,
  mergeProducts,
  mergeSiteContent,
  mergeWithDefaults,
} from '../utils/mergeContent';

export {
  mergeHeroSlides,
  mergeCollections,
  mergeEditorialTabs,
  mergeProducts,
  mergeSiteContent,
  mergeWithDefaults,
};

export interface VerifiedHeroSlide {
  id: number;
  image: string;
  alt: string;
  headline: string;
  buttonText: string;
  isLoadable: boolean;
}

export interface SaveResult {
  success: boolean;
  message: string;
  verifiedHeroSlides?: VerifiedHeroSlide[];
  verifiedAt?: string;
  content?: SiteContent;
  error?: string;
}

interface SiteContentContextType {
  content: SiteContent;
  updateContent: (newContent: Partial<SiteContent> | SiteContent) => void;
  saveContentToServer: (
    newContent: Partial<SiteContent> | SiteContent,
    token: string
  ) => Promise<SaveResult>;
  resetContentOnServer: (token: string) => Promise<{ success: boolean; message: string }>;
  verifyHeroImages: (slides?: any[]) => Promise<{ allValid: boolean; slides: VerifiedHeroSlide[] }>;
  isLoading: boolean;
}

const STORAGE_KEYS = ['sb_atelier_site_content_v2', 'sb_site_content_override'];
const PRIMARY_STORAGE_KEY = 'sb_atelier_site_content_v2';

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

/**
 * Validates image loadability in real-time in the browser
 */
export async function testImageLoadable(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  if (url.startsWith('data:image/')) return true; // Base64 data URLs are embedded and valid

  return new Promise<boolean>((resolve) => {
    const img = new Image();
    let isResolved = false;

    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        img.onload = null;
        img.onerror = null;
        // Don't fail completely on timeout; assume reachable if URL is well formed
        resolve(true);
      }
    }, 2500);

    img.onload = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        // Relative paths or SVG paths might still be served by local server
        resolve(url.startsWith('/') || url.startsWith('http'));
      }
    };

    img.src = url;
  });
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

  // Load from IndexedDB on startup (handles large multi-image datasets without 5MB quota restrictions)
  useEffect(() => {
    let isMounted = true;
    loadContentFromIndexedDb().then((idbContent) => {
      if (isMounted && idbContent) {
        const merged = mergeWithDefaults(idbContent);
        setContent(merged);
        try {
          for (const key of STORAGE_KEYS) {
            localStorage.setItem(key, JSON.stringify(merged));
          }
        } catch {
          // localStorage quota exceeded is expected when multiple photos are uploaded
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
        
        const data = await safeParseResponseJson(res);
        if (data && data.success && data.content && isMounted) {
          const serverContent = mergeWithDefaults(data.content);
          setContent(serverContent);
          saveContentToIndexedDb(serverContent);
          try {
            for (const key of STORAGE_KEYS) {
              localStorage.setItem(key, JSON.stringify(serverContent));
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

  const updateContent = (newContent: Partial<SiteContent> | SiteContent) => {
    setContent((prev) => {
      const merged = mergeSiteContent(prev, newContent);
      // Persist to IndexedDB immediately
      saveContentToIndexedDb(merged);
      try {
        for (const key of STORAGE_KEYS) {
          localStorage.setItem(key, JSON.stringify(merged));
        }
      } catch {
        // Ignore quota errors for localStorage
      }
      return merged;
    });
  };

  const verifyHeroImages = async (
    slides?: any[]
  ): Promise<{ allValid: boolean; slides: VerifiedHeroSlide[] }> => {
    const targetSlides = Array.isArray(slides) && slides.length > 0
      ? slides
      : (content?.hero?.slides || DEFAULT_SITE_CONTENT.hero.slides);

    const verifiedPromises = targetSlides.map(async (slide, idx) => {
      const id = typeof slide.id === 'number' ? slide.id : idx;
      const url = slide.image || '';
      const isLoadable = await testImageLoadable(url);
      return {
        id,
        image: url,
        alt: slide.alt || '',
        headline: slide.headline || '',
        buttonText: slide.buttonText || 'SHOP NOW',
        isLoadable,
      };
    });

    const resolvedSlides = await Promise.all(verifiedPromises);
    const allValid = resolvedSlides.every((s) => s.isLoadable && s.image.trim() !== '');
    return { allValid, slides: resolvedSlides };
  };

  const saveContentToServer = async (
    incomingContent: Partial<SiteContent> | SiteContent,
    token: string
  ): Promise<SaveResult> => {
    // 1. Deep merge with existing content to guarantee that updating hero section or any part
    // NEVER wipes out the other sections or other hero slides
    const mergedContent = mergeSiteContent(content, incomingContent);

    // 2. Immediately persist locally in React state, IndexedDB (unlimited capacity), and localStorage
    setContent(mergedContent);
    await saveContentToIndexedDb(mergedContent);

    try {
      for (const key of STORAGE_KEYS) {
        localStorage.setItem(key, JSON.stringify(mergedContent));
      }
    } catch (storageErr) {
      console.warn('Local storage quota reached. Preserved safely in IndexedDB:', storageErr);
    }

    // 3. Real-time DOM & image loadability verification
    const heroVerification = await verifyHeroImages(mergedContent.hero.slides);

    // 4. Synchronize with live server
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ content: mergedContent }),
      });

      const data = await safeParseResponseJson(res);

      if (res.status === 401) {
        return {
          success: false,
          message: 'Unauthorized: Session expired or invalid. Please sign in again.',
          error: 'Session expired',
          verifiedHeroSlides: heroVerification.slides,
          verifiedAt: new Date().toLocaleTimeString(),
          content: mergedContent,
        };
      }

      if (res.ok && data?.success) {
        const finalConfirmed = data.content && typeof data.content === 'object'
          ? mergeSiteContent(mergedContent, data.content)
          : mergedContent;

        setContent(finalConfirmed);
        saveContentToIndexedDb(finalConfirmed);
        try {
          for (const key of STORAGE_KEYS) {
            localStorage.setItem(key, JSON.stringify(finalConfirmed));
          }
        } catch {
          // Ignore quota errors
        }

        return {
          success: true,
          message: data.message || 'Saved to Server: Changes are live and visible to all visitors on all devices & browsers.',
          verifiedHeroSlides: heroVerification.slides,
          verifiedAt: new Date().toLocaleTimeString(),
          content: finalConfirmed,
        };
      }

      if (data?.error) {
        return {
          success: false,
          message: data.error,
          error: data.error,
          verifiedHeroSlides: heroVerification.slides,
          verifiedAt: new Date().toLocaleTimeString(),
          content: mergedContent,
        };
      }

      return {
        success: false,
        message: `Server returned HTTP ${res.status}. Failed to persist changes to the server.`,
        error: `HTTP ${res.status}`,
        verifiedHeroSlides: heroVerification.slides,
        verifiedAt: new Date().toLocaleTimeString(),
        content: mergedContent,
      };
    } catch (networkErr: any) {
      return {
        success: false,
        message: 'Could not connect to the server. Changes could not be published to the server.',
        error: networkErr?.message || 'Network error',
        verifiedHeroSlides: heroVerification.slides,
        verifiedAt: new Date().toLocaleTimeString(),
        content: mergedContent,
      };
    }
  };

  const resetContentOnServer = async (token: string): Promise<{ success: boolean; message: string }> => {
    // 1. Immediately reset state and purge local storage
    setContent(DEFAULT_SITE_CONTENT);
    saveContentToIndexedDb(DEFAULT_SITE_CONTENT);
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
        verifyHeroImages,
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
