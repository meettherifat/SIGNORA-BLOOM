import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteContent, DEFAULT_SITE_CONTENT } from '../siteContent';

interface SiteContentContextType {
  content: SiteContent;
  updateContent: (newContent: SiteContent) => void;
  saveContentToServer: (newContent: SiteContent, token: string) => Promise<{ success: boolean; message: string }>;
  resetContentOnServer: (token: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch saved content on initial load
  useEffect(() => {
    let isMounted = true;
    async function fetchContent() {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.content && isMounted) {
            setContent({
              ...DEFAULT_SITE_CONTENT,
              ...data.content,
              brand: { ...DEFAULT_SITE_CONTENT.brand, ...(data.content.brand || {}) },
              hero: {
                ...DEFAULT_SITE_CONTENT.hero,
                ...(data.content.hero || {}),
                slides: data.content?.hero?.slides?.length ? data.content.hero.slides : DEFAULT_SITE_CONTENT.hero.slides,
              },
              collections: data.content?.collections?.length ? data.content.collections : DEFAULT_SITE_CONTENT.collections,
              editorial: {
                ...DEFAULT_SITE_CONTENT.editorial,
                ...(data.content.editorial || {}),
                tabs: data.content?.editorial?.tabs?.length ? data.content.editorial.tabs : DEFAULT_SITE_CONTENT.editorial.tabs,
              },
              giftSection: {
                ...DEFAULT_SITE_CONTENT.giftSection,
                ...(data.content.giftSection || {}),
                perks: data.content?.giftSection?.perks?.length ? data.content.giftSection.perks : DEFAULT_SITE_CONTENT.giftSection.perks,
                features: data.content?.giftSection?.features?.length ? data.content.giftSection.features : DEFAULT_SITE_CONTENT.giftSection.features,
              },
              products: data.content?.products?.length ? data.content.products : DEFAULT_SITE_CONTENT.products,
              footer: { ...DEFAULT_SITE_CONTENT.footer, ...(data.content.footer || {}) },
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch custom content from server, using defaults.', err);
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
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Failed to publish changes.' };
      }

      setContent(newContent);
      return { success: true, message: 'All changes saved & published live!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error while saving.' };
    }
  };

  const resetContentOnServer = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/content/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Failed to reset.' };
      }

      setContent(DEFAULT_SITE_CONTENT);
      return { success: true, message: 'Restored to original factory defaults.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error while resetting.' };
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
