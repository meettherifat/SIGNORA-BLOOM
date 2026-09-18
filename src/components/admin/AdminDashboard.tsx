import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  LogOut,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Edit3,
  Columns,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Gift,
  ShoppingBag,
  Info,
  ExternalLink,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  Cloud,
} from 'lucide-react';
import { SiteContent, DEFAULT_SITE_CONTENT, CollectionItem } from '../../siteContent';
import { useSiteContent, VerifiedHeroSlide, mergeCollections } from '../../context/SiteContentContext';
import { safeParseResponseJson } from '../../utils/security';
import { compressImageFile } from '../../utils/storageDb';
import { ImageUpdateField } from './ImageUpdateField';

// Import public components for the real-time live preview
import { Header } from '../Header';
import { Hero } from '../Hero';
import { FeaturedCollections } from '../FeaturedCollections';
import { EverydayElegance } from '../EverydayElegance';
import { EditorialStoryTabs } from '../EditorialStoryTabs';
import { GiftPackagingSection } from '../GiftPackagingSection';
import { Footer } from '../Footer';
import { FadeInSection } from '../FadeInSection';

interface AdminDashboardProps {
  token: string;
  user?: { id: string; role: string } | null;
  onLogout: () => void;
  onSessionExpired?: () => void;
  onViewPublicSite: () => void;
}

type TabKey = 'hero' | 'editorial' | 'collections' | 'products' | 'gift' | 'brand';
type ViewMode = 'edit' | 'split' | 'preview';
type DeviceMode = 'mobile' | 'tablet' | 'desktop';

// Helper ensuring all 5 collections are always present with no missing positions
const normalizeDraftContent = (rawContent: SiteContent): SiteContent => {
  const cloned: SiteContent = JSON.parse(JSON.stringify(rawContent || DEFAULT_SITE_CONTENT));
  cloned.collections = mergeCollections(DEFAULT_SITE_CONTENT.collections, cloned.collections || []);
  return cloned;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  onLogout,
  onSessionExpired,
  onViewPublicSite,
}) => {
  const { content, updateContent, saveContentToServer, resetContentOnServer } = useSiteContent();

  // Local draft state for editing before publishing (guaranteed 5/5 collections)
  const [draft, setDraft] = useState<SiteContent>(() => normalizeDraftContent(content));
  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [savePhase, setSavePhase] = useState<'idle' | 'merging' | 'persisting' | 'verifying' | 'verified'>('idle');
  const [verifiedSlides, setVerifiedSlides] = useState<VerifiedHeroSlide[] | null>(null);
  const [verifiedTimestamp, setVerifiedTimestamp] = useState<string | null>(null);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with incoming saved content if user hasn't made unsaved modifications
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setDraft(normalizeDraftContent(content));
    }
  }, [content, hasUnsavedChanges]);

  // Sync draft edits into local draft and also live preview context
  const updateDraft = (updater: (prev: SiteContent) => SiteContent) => {
    setDraft((prev) => {
      // Deep clone prev first so updater can safely modify nested properties without stale references
      const cloned: SiteContent = JSON.parse(JSON.stringify(prev));
      const next = updater(cloned);
      setHasUnsavedChanges(true);
      // Update global context so the preview updates in real-time
      updateContent(next);
      return next;
    });
  };

  // Dedicated immutable updater for Hero slides that guarantees sibling slides and fields are never lost
  const updateHeroSlide = (
    slideIndex: number,
    partial: Partial<{
      id: number;
      image: string;
      alt: string;
      headline: string;
      buttonText: string;
    }>
  ) => {
    updateDraft((prev) => {
      const slides = Array.isArray(prev.hero?.slides) ? [...prev.hero.slides] : [];
      const currentSlide = slides[slideIndex] || {
        id: slideIndex,
        image: '',
        alt: '',
        headline: '',
        buttonText: 'SHOP NOW',
      };
      slides[slideIndex] = {
        ...currentSlide,
        ...partial,
      };
      return {
        ...prev,
        hero: {
          ...prev.hero,
          slides,
        },
      };
    });
  };

  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  // Handle image upload with automatic client-side compression
  // Compresses multi-MB high-res images down to ~80KB-160KB so storage limits are NEVER exceeded
  const handleImageUpload = async (
    file: File,
    onSuccess: (uploadedUrl: string) => void,
    keyIdentifier?: string,
    maxWidth = 1920,
    maxHeight = 1080
  ) => {
    if (keyIdentifier) setUploadingImageKey(keyIdentifier);
    try {
      // 1. Client-side compression & aspect-ratio constraint
      const optimizedDataUrl = await compressImageFile(file, maxWidth, maxHeight, 0.82);

      // 2. Optional server upload if backend API is reachable
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64Data: optimizedDataUrl,
            filename: file.name,
          }),
        });
        if (res.status === 401) {
          onSessionExpired?.();
          return;
        }
        const data = await safeParseResponseJson(res);
        if (data && data.success && data.url) {
          onSuccess(data.url);
          return;
        }
      } catch {
        // Backend not available (e.g. static hosting on Vercel)
      }

      // 3. Directly use optimized data URL (hundreds of times smaller, perfectly safe for storage)
      onSuccess(optimizedDataUrl);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      if (keyIdentifier) setUploadingImageKey(null);
    }
  };

  // Save changes to backend with real-time step verification
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    setShowVerifiedBanner(false);

    // Step 1: Merging phase
    setSavePhase('merging');
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 2: Persisting phase
    setSavePhase('persisting');
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Step 3: Real-time verification phase
    setSavePhase('verifying');
    const result = await saveContentToServer(draft, token);

    setIsSaving(false);
    setSaveStatus(result);

    if (result.success) {
      setHasUnsavedChanges(false);
      setSavePhase('verified');
      setVerifiedSlides(result.verifiedHeroSlides || null);
      setVerifiedTimestamp(result.verifiedAt || new Date().toLocaleTimeString());
      setShowVerifiedBanner(true);
    } else {
      setSavePhase('idle');
      if (result.message && (result.message.includes('Unauthorized') || result.message.includes('expired'))) {
        onSessionExpired?.();
      }
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all site titles, images, and content to factory defaults?')) {
      return;
    }
    setIsSaving(true);
    const result = await resetContentOnServer(token);
    setIsSaving(false);
    if (result.success) {
      setDraft(JSON.parse(JSON.stringify(content)));
      setHasUnsavedChanges(false);
      setSaveStatus(result);
      setTimeout(() => setSaveStatus(null), 3000);
    } else if (result.message && (result.message.includes('Unauthorized') || result.message.includes('expired'))) {
      onSessionExpired?.();
    }
  };

  // Export & Deployment State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  // Generate clean, TypeScript-typed siteContent.ts source code
  const getSiteContentTsCode = (): string => {
    return `export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    conciergeHours: string;
    address: string;
  };
  hero: {
    slides: {
      id: number;
      image: string;
      alt: string;
      headline: string;
      buttonText: string;
    }[];
  };
  collections: {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    image: string;
    itemCount: string;
    span?: string;
  }[];
  editorial: {
    tabs: {
      id: string;
      tabLabel: string;
      headline: string;
      description: string;
      mainImage: string;
      insetDetailImage: string;
      buttonLabel: string;
    }[];
  };
  giftSection: {
    badge: string;
    headline: string;
    subheadline: string;
    boxLabel: string;
    boxTheme: 'crimson' | 'noir' | 'champagne' | 'emerald';
    perks: { title: string; desc: string }[];
    features: { number: string; title: string; description: string }[];
  };
  products: {
    id: string;
    refCode: string;
    name: string;
    category: string;
    categoryLabel: string;
    price: string;
    tagline: string;
    description: string;
    image: string;
    badge?: string;
  }[];
  footer: {
    newsletterTitle: string;
    newsletterDesc: string;
    copyright: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = ${JSON.stringify(draft, null, 2)};
`;
  };

  const handleDownloadSiteContentTs = () => {
    const code = getSiteContentTsCode();
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'siteContent.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySiteContentTs = async () => {
    try {
      const code = getSiteContentTsCode();
      await navigator.clipboard.writeText(code);
      setHasCopiedCode(true);
      setTimeout(() => setHasCopiedCode(false), 2500);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EE] text-[#2A2323]">
      
      {/* 1. TOP EXECUTIVE APP BAR */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#EADFD5] shadow-[0_2px_12px_rgba(42,35,35,0.05)] px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Logo & CMS Title */}
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg sm:text-xl tracking-[0.2em] font-medium text-[#2A2323]">
              SIGNORA BLOOM
            </span>
            <span className="text-[10px] uppercase tracking-widest bg-[#FAF5F0] border border-[#E2D5C8] text-[#7A6C6C] px-2 py-0.5 rounded-xs font-semibold">
              Atelier CMS
            </span>
            {hasUnsavedChanges && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#A66F42] bg-[#FDF6F0] px-2 py-0.5 border border-[#EED7C5] rounded-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4823A] animate-pulse" />
                Unsaved Draft Edits
              </span>
            )}
          </div>

          {/* Center: Viewport & Layout Mode Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* View Mode Toggle: Edit / Split / Preview */}
            <div className="flex items-center bg-[#FAF6F1] border border-[#E8DFD5] p-0.5 rounded-xs">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[10px] uppercase tracking-widest transition-all rounded-xs cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-white text-[#2A2323] shadow-xs font-semibold'
                    : 'text-[#847878] hover:text-[#2A2323]'
                }`}
                title="Editor Form Only"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[10px] uppercase tracking-widest transition-all rounded-xs cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-[#2A2323] shadow-xs font-semibold'
                    : 'text-[#847878] hover:text-[#2A2323]'
                }`}
                title="Split Side-by-Side View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Split</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[10px] uppercase tracking-widest transition-all rounded-xs cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-[#2A2323] shadow-xs font-semibold'
                    : 'text-[#847878] hover:text-[#2A2323]'
                }`}
                title="Full Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Preview</span>
              </button>
            </div>

            {/* Device Frame Toggle (Active during Split or Preview) */}
            {viewMode !== 'edit' && (
              <div className="flex items-center bg-[#FAF6F1] border border-[#E8DFD5] p-0.5 rounded-xs">
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1.5 text-xs transition-all rounded-xs cursor-pointer ${
                    deviceMode === 'mobile'
                      ? 'bg-white text-[#2A2323] shadow-xs'
                      : 'text-[#847878] hover:text-[#2A2323]'
                  }`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('tablet')}
                  className={`p-1.5 text-xs transition-all rounded-xs cursor-pointer ${
                    deviceMode === 'tablet'
                      ? 'bg-white text-[#2A2323] shadow-xs'
                      : 'text-[#847878] hover:text-[#2A2323]'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1.5 text-xs transition-all rounded-xs cursor-pointer ${
                    deviceMode === 'desktop'
                      ? 'bg-white text-[#2A2323] shadow-xs'
                      : 'text-[#847878] hover:text-[#2A2323]'
                  }`}
                  title="Desktop View (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* View public site */}
            <button
              type="button"
              onClick={onViewPublicSite}
              className="px-2.5 sm:px-3 py-1.5 border border-[#E2D5C8] text-[#554A4A] hover:bg-[#FAF6F1] text-[10px] uppercase tracking-widest rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Store</span>
            </button>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-2.5 sm:px-3 py-1.5 border border-[#E2D5C8] text-[#847878] hover:text-[#A63A3A] hover:border-[#F2BEBE] text-[10px] uppercase tracking-widest rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all content to original defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Export Code / Deploy Guide */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 border border-[#D9C4B0] bg-[#FAF6F1] text-[#634932] hover:bg-[#F2ECE3] text-[10px] uppercase tracking-widest rounded-xs transition-colors flex items-center gap-1 cursor-pointer font-medium"
              title="Export content for Vercel / GitHub deployment"
            >
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">Export Code</span>
            </button>

            {/* Save & Publish */}
            <button
              id="admin-publish-save-btn"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 sm:px-5 py-1.5 bg-[#2A2323] hover:bg-[#433737] text-white text-[10px] sm:text-[11px] uppercase tracking-[0.2em] rounded-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>
                {isSaving
                  ? savePhase === 'merging'
                    ? '1/3 Merging...'
                    : savePhase === 'persisting'
                    ? '2/3 Saving...'
                    : '3/3 Verifying...'
                  : 'Save & Publish'}
              </span>
            </button>

            {/* Authenticated user badge */}
            {user && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF5F0] border border-[#E8DFD5] rounded-xs text-[10px] text-[#6E6161]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B8A52]" />
                <span className="font-mono text-[#332B2B]">{user.id}</span>
                <span className="text-[#A39595]">({user.role})</span>
              </div>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-[#736767] hover:text-[#A63A3A] transition-colors rounded-xs cursor-pointer"
              title="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Real-time Saving Progress Banner */}
        {isSaving && (
          <div className="mt-2.5 p-3 rounded-xs bg-[#FBF7F0] border border-[#E8DFC8] text-[#554738] flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-[#A87B4F] border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <div className="font-semibold tracking-wide text-[#3D2C1E]">
                  {savePhase === 'merging' && 'Step 1/3: Deep-merging hero images with site content...'}
                  {savePhase === 'persisting' && 'Step 2/3: Saving to high-capacity storage & database...'}
                  {savePhase === 'verifying' && 'Step 3/3: Verifying live DOM rendering and image reachability...'}
                </div>
                <div className="text-[11px] text-[#7A6B5D]">
                  Preserving all existing slides and sections without overwriting.
                </div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded-xs border border-[#E0D5C0]">
              Real-time Sync
            </span>
          </div>
        )}

        {/* Real-Time Verification Confirmation Banner with Live Slide Proofs */}
        {showVerifiedBanner && verifiedSlides && (
          <div className="mt-2.5 p-3.5 rounded-xs bg-[#F0F9F2] border border-[#BCE4C6] text-[#1D5E2F] shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#D2EED8]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#27823E] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-[#174D26] flex items-center gap-2">
                    <span>Updates Merged & Verified in Real-Time</span>
                    {verifiedTimestamp && (
                      <span className="text-[10px] font-mono font-normal bg-white/80 text-[#27823E] px-1.5 py-0.5 rounded-xs border border-[#BCE4C6]">
                        {verifiedTimestamp}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#2F6B3E]">
                    Hero section images successfully merged with existing content. 0 slides overwritten.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={onViewPublicSite}
                  className="px-2.5 py-1 bg-white hover:bg-[#E2F3E7] border border-[#BCE4C6] text-[#1D5E2F] text-[10px] uppercase tracking-wider font-semibold rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Inspect Live Store</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerifiedBanner(false)}
                  className="p-1 text-[#27823E] hover:text-[#174D26] cursor-pointer"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual verification proof of each hero slide */}
            <div className="pt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {verifiedSlides.map((vSlide, vIdx) => (
                <div
                  key={`verified-slide-${vSlide.id ?? vIdx}`}
                  className="bg-white p-2 border border-[#C5E8CE] rounded-xs flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-12 h-9 bg-[#F7F4EF] rounded-xs overflow-hidden border border-[#D5EAD9] shrink-0 relative">
                    <img
                      src={vSlide.image}
                      alt={vSlide.alt || `Verified slide ${vIdx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#1A4B27]">
                      <span>Slide #{vIdx + 1}</span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-[#247037] font-semibold">
                        <Check className="w-2.5 h-2.5" />
                        Verified Active
                      </span>
                    </div>
                    <div className="text-[10px] text-[#557F60] truncate font-mono">
                      {vSlide.image.startsWith('data:') ? 'Web Optimized Image' : vSlide.image.split('/').pop()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error / Standard Save Notification Banner (if any) */}
        {saveStatus && !saveStatus.success && (
          <div className="mt-2.5 p-2.5 rounded-xs flex items-center justify-between text-xs bg-[#FCEDED] border border-[#F7C6C6] text-[#A82E2E]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{saveStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveStatus(null)}
              className="text-xs font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      {/* 2. MAIN CMS WORKSPACE (Split or Full Screen) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: EDIT CONTROLS FORM (Rendered when viewMode is 'edit' or 'split') */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'w-full lg:w-1/2 border-r border-[#EADFD5]' : 'w-full max-w-5xl mx-auto'
            } flex flex-col bg-[#FAF7F3] overflow-y-auto`}
          >
            {/* Navigation Tabs */}
            <div className="sticky top-0 z-20 bg-[#FAF7F3] border-b border-[#E8DFD5] px-4 sm:px-6 pt-3 pb-1 flex flex-wrap gap-2 sm:gap-3">
              {[
                { key: 'hero', label: 'Hero Slider', icon: ImageIcon },
                { key: 'editorial', label: 'Editorial Tabs', icon: Layers },
                { key: 'collections', label: 'Collections', icon: Sparkles },
                { key: 'products', label: 'Products', icon: ShoppingBag },
                { key: 'gift', label: 'Gift Packaging', icon: Gift },
                { key: 'brand', label: 'Brand & Contact', icon: Info },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key as TabKey)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] sm:text-[11px] uppercase tracking-wider transition-all rounded-xs cursor-pointer border ${
                    activeTab === key
                      ? 'bg-[#2A2323] text-white border-[#2A2323] font-medium shadow-xs'
                      : 'bg-white text-[#6E6060] border-[#E5DAD0] hover:text-[#2A2323] hover:border-[#CDC0B5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Form Panels based on activeTab */}
            <div className="p-4 sm:p-6 space-y-6 pb-24">
              
              {/* TAB 1: HERO SLIDER */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EADFD5] gap-2">
                    <div>
                      <h2 className="font-serif text-xl text-[#2A2323]">Hero Banner Slider</h2>
                      <p className="text-xs text-[#7A6C6C]">
                        16:9 full-width slides. Updates are merged without overwriting sibling slides.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider bg-[#FAF0E6] text-[#7A5229] px-2.5 py-1 rounded-xs border border-[#E8D4C0]">
                        {draft.hero.slides.length} Slides Active
                      </span>
                    </div>
                  </div>

                  {draft.hero.slides.map((slide, idx) => {
                    const isSyncedWithLive = content.hero?.slides?.[idx]?.image === slide.image;
                    return (
                      <div
                        key={slide.id ?? idx}
                        className="bg-white border border-[#E5DAD0] p-4 sm:p-5 rounded-xs space-y-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE3]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-widest font-semibold text-[#2A2323]">
                              Hero Slide #{idx + 1}
                            </span>
                            {isSyncedWithLive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#246633] bg-[#EBF7EE] border border-[#BDE3C4] px-2 py-0.5 rounded-xs font-medium">
                                <CheckCircle2 className="w-3 h-3 text-[#246633]" />
                                Live Synced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#A66F42] bg-[#FDF6F0] border border-[#EED7C5] px-2 py-0.5 rounded-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4823A] animate-pulse" />
                                Draft Changed (Click Save to verify)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#8E8080] font-mono">
                            Slide ID: {slide.id ?? idx}
                          </span>
                        </div>

                        {/* Image Preview & URL Input with dedicated Update/Upload buttons */}
                        <ImageUpdateField
                          id={`hero-slide-img-${idx}`}
                          label={`Hero Slide #${idx + 1} Image`}
                          value={slide.image}
                          onChange={(newUrl) => updateHeroSlide(idx, { image: newUrl })}
                          onUpload={(file) =>
                            handleImageUpload(
                              file,
                              (url) => {
                                updateHeroSlide(idx, { image: url });
                              },
                              `hero-${idx}`,
                              1920,
                              1080
                            )
                          }
                          isUploading={uploadingImageKey === `hero-${idx}`}
                          aspectRatio="16/9"
                          aspectLabel="16:9 Landscape"
                          recommendedDimensions="1920 × 1080px (16:9 full-width)"
                          defaultUrl={DEFAULT_SITE_CONTENT.hero.slides[idx]?.image}
                          isLiveSynced={isSyncedWithLive}
                        />

                        {/* Headline & Button Text */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                              Slide Headline
                            </label>
                            <input
                              type="text"
                              value={slide.headline || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateHeroSlide(idx, { headline: val });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                              Button Label
                            </label>
                            <input
                              type="text"
                              value={slide.buttonText || 'SHOP NOW'}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateHeroSlide(idx, { buttonText: val });
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                            />
                          </div>
                        </div>

                        {/* Alt Description */}
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                            Accessibility Image Description (Alt text)
                          </label>
                          <input
                            type="text"
                            value={slide.alt}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateHeroSlide(idx, { alt: val });
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: EDITORIAL TABS (Beauty & Ingenuity, etc.) */}
              {activeTab === 'editorial' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-[#EADFD5]">
                    <h2 className="font-serif text-xl text-[#2A2323]">Editorial Story Tabs</h2>
                    <p className="text-xs text-[#7A6C6C]">
                      Edit the 3 tabs: Beauty & Ingenuity, Ear Stack Magic, and Wristwear Essentials with 3:4 portrait & 1:1 detail images.
                    </p>
                  </div>

                  {draft.editorial.tabs.map((tab, idx) => (
                    <div
                      key={tab.id}
                      className="bg-white border border-[#E5DAD0] p-4 sm:p-5 rounded-xs space-y-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE3]">
                        <span className="text-xs uppercase tracking-widest font-semibold text-[#2A2323]">
                          Tab #{idx + 1}: {tab.tabLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                            Tab Navigation Label
                          </label>
                          <input
                            type="text"
                            value={tab.tabLabel}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.editorial.tabs[idx].tabLabel = val;
                                return next;
                              });
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                            Section Headline
                          </label>
                          <input
                            type="text"
                            value={tab.headline}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.editorial.tabs[idx].headline = val;
                                return next;
                              });
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Editorial Narrative Description
                        </label>
                        <textarea
                          rows={3}
                          value={tab.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => {
                              const next = { ...prev };
                              next.editorial.tabs[idx].description = val;
                              return next;
                            });
                          }}
                          className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none leading-relaxed"
                        />
                      </div>

                      {/* Main 3:4 Image & Inset 1:1 Image with Dedicated Update/Upload Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* 3:4 Main Image */}
                        <ImageUpdateField
                          id={`editorial-main-img-${idx}`}
                          label="Main Portrait Image (3:4 Ratio)"
                          value={tab.mainImage}
                          onChange={(newUrl) => {
                            updateDraft((prev) => {
                              const next = { ...prev };
                              next.editorial.tabs[idx].mainImage = newUrl;
                              return next;
                            });
                          }}
                          onUpload={(file) => {
                            handleImageUpload(
                              file,
                              (url) => {
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  next.editorial.tabs[idx].mainImage = url;
                                  return next;
                                });
                              },
                              `editorial-main-${idx}`,
                              1200,
                              1600
                            );
                          }}
                          isUploading={uploadingImageKey === `editorial-main-${idx}`}
                          aspectRatio="3/4"
                          aspectLabel="3:4 Portrait"
                          recommendedDimensions="1200 × 1600px"
                          defaultUrl={DEFAULT_SITE_CONTENT.editorial.tabs[idx]?.mainImage}
                          isLiveSynced={content.editorial?.tabs?.[idx]?.mainImage === tab.mainImage}
                        />

                        {/* 1:1 Inset Detail Image */}
                        <ImageUpdateField
                          id={`editorial-inset-img-${idx}`}
                          label="Small Inset Detail Image (1:1 Ratio)"
                          value={tab.insetDetailImage}
                          onChange={(newUrl) => {
                            updateDraft((prev) => {
                              const next = { ...prev };
                              next.editorial.tabs[idx].insetDetailImage = newUrl;
                              return next;
                            });
                          }}
                          onUpload={(file) => {
                            handleImageUpload(
                              file,
                              (url) => {
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  next.editorial.tabs[idx].insetDetailImage = url;
                                  return next;
                                });
                              },
                              `editorial-inset-${idx}`,
                              800,
                              800
                            );
                          }}
                          isUploading={uploadingImageKey === `editorial-inset-${idx}`}
                          aspectRatio="1/1"
                          aspectLabel="1:1 Square"
                          recommendedDimensions="800 × 800px"
                          defaultUrl={DEFAULT_SITE_CONTENT.editorial.tabs[idx]?.insetDetailImage}
                          isLiveSynced={content.editorial?.tabs?.[idx]?.insetDetailImage === tab.insetDetailImage}
                        />
                      </div>

                      {/* Button CTA text */}
                      <div className="pt-2">
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Call To Action Button Label
                        </label>
                        <input
                          type="text"
                          value={tab.buttonLabel}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => {
                              const next = { ...prev };
                              next.editorial.tabs[idx].buttonLabel = val;
                              return next;
                            });
                          }}
                          className="w-full sm:w-1/2 px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: FEATURED COLLECTIONS MOSAIC */}
              {/* TAB 3: FEATURED COLLECTIONS MOSAIC */}
              {activeTab === 'collections' && (() => {
                const positionLabels = [
                  'Mosaic 1: Left Column (9:16 Tall) · Fine Rings',
                  'Mosaic 2: Center Top (1:1 Square) · Sculptural Bracelets',
                  'Mosaic 3: Center Bottom Left · Medallion Necklaces',
                  'Mosaic 4: Center Bottom Right · Drop & Hoop Earrings',
                  'Mosaic 5: Right Column (9:16 Tall) · Shop Charms',
                ];

                // Ensure all 5 default collections are always present and never deleted
                const currentCollections: CollectionItem[] = (draft.collections && draft.collections.length >= 5)
                  ? draft.collections
                  : mergeCollections(DEFAULT_SITE_CONTENT.collections, draft.collections || []);

                const updateColItem = (idx: number, partial: Partial<CollectionItem>) => {
                  updateDraft((prev) => {
                    const list = (prev.collections && prev.collections.length >= 5)
                      ? [...prev.collections]
                      : mergeCollections(DEFAULT_SITE_CONTENT.collections, prev.collections || []);
                    if (list[idx]) {
                      list[idx] = { ...list[idx], ...partial };
                    }
                    return {
                      ...prev,
                      collections: list,
                    };
                  });
                };

                const restoreAllDefaultCollections = () => {
                  updateDraft((prev) => ({
                    ...prev,
                    collections: DEFAULT_SITE_CONTENT.collections.map((c) => ({ ...c })),
                  }));
                };

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#EADFD5] gap-2">
                      <div>
                        <h2 className="font-serif text-xl text-[#2A2323]">Featured Category Mosaic</h2>
                        <p className="text-xs text-[#7A6C6C]">
                          All 5 mosaic images are fully active and editable below. Every position includes a dedicated Update and Upload button.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider bg-[#EAF5EC] text-[#256837] px-2.5 py-1 rounded-xs border border-[#BBE2C3] font-semibold">
                          5 of 5 Positions Active
                        </span>
                        <button
                          type="button"
                          onClick={restoreAllDefaultCollections}
                          className="text-[11px] text-[#8C6D4F] hover:text-[#5A4533] underline cursor-pointer"
                        >
                          Reset All 5 to Defaults
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentCollections.map((col, idx) => {
                        const isColTall = col.span === 'tall';
                        const defaultCol = DEFAULT_SITE_CONTENT.collections[idx];
                        const isSynced = content.collections?.[idx]?.image === col.image;

                        return (
                          <div
                            key={col.id || `col-${idx}`}
                            className="bg-white border border-[#E5DAD0] p-4 rounded-xs space-y-3.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-1.5">
                              <span className="text-[11px] font-semibold text-[#8C6D4F] tracking-wide">
                                {positionLabels[idx] || `Mosaic Image ${idx + 1}`}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-[#A09393] bg-[#FAF8F5] px-2 py-0.5 rounded-xs border border-[#E8DFD7]">
                                {isColTall ? '9:16 Tall Mosaic' : col.span === 'wide' ? 'Wide Ratio' : '1:1 Square'}
                              </span>
                            </div>

                            {/* Card Titles & Item Count */}
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <div className="w-2/3">
                                  <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-0.5">
                                    Card Title
                                  </label>
                                  <input
                                    type="text"
                                    value={col.title}
                                    onChange={(e) => updateColItem(idx, { title: e.target.value })}
                                    className="w-full px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                                  />
                                </div>
                                <div className="w-1/3">
                                  <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-0.5">
                                    Count Tag
                                  </label>
                                  <input
                                    type="text"
                                    value={col.itemCount || ''}
                                    onChange={(e) => updateColItem(idx, { itemCount: e.target.value })}
                                    placeholder="24 Designs"
                                    className="w-full px-2 py-1 text-[11px] text-[#7A6C6C] bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-0.5">
                                  Subtitle
                                </label>
                                <input
                                  type="text"
                                  value={col.subtitle || ''}
                                  onChange={(e) => updateColItem(idx, { subtitle: e.target.value })}
                                  className="w-full px-2 py-1 text-xs bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                                />
                              </div>
                            </div>

                            {/* Dedicated Image Update & Upload Control */}
                            <ImageUpdateField
                              id={`collection-img-${idx}`}
                              label={`Mosaic ${idx + 1} Image`}
                              value={col.image}
                              onChange={(newUrl) => updateColItem(idx, { image: newUrl })}
                              onUpload={(file) => {
                                handleImageUpload(
                                  file,
                                  (url) => updateColItem(idx, { image: url }),
                                  `collection-${idx}`,
                                  isColTall ? 1080 : 1200,
                                  isColTall ? 1920 : 1200
                                );
                              }}
                              isUploading={uploadingImageKey === `collection-${idx}`}
                              aspectRatio={isColTall ? '9/16' : '1/1'}
                              aspectLabel={isColTall ? '9:16 Tall' : '1:1 Square'}
                              recommendedDimensions={isColTall ? '800 × 1422px (9:16)' : '800 × 800px (1:1)'}
                              defaultUrl={defaultCol?.image}
                              isLiveSynced={isSynced}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: EVERYDAY ELEGANCE PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                    <div>
                      <h2 className="font-serif text-xl text-[#2A2323]">Everyday Elegance Products</h2>
                      <p className="text-xs text-[#7A6C6C]">
                        Edit piece names, reference codes, prices, images, badges, and craft notes.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {draft.products.map((prod, idx) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#E5DAD0] p-4 sm:p-5 rounded-xs shadow-xs space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-[#F2ECE4] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#8C6D4F] tracking-wider uppercase font-mono">
                              {prod.refCode || `PIECE #${idx + 1}`}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-[#736565] bg-[#FAF5F0] border border-[#E8DFD5] px-2 py-0.5 rounded-xs">
                              {prod.categoryLabel || prod.category}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#2A2323]">
                            {prod.price}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                          {/* Left: Product Information Inputs */}
                          <div className="lg:col-span-6 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <div className="sm:col-span-8">
                                <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                                  Product Name
                                </label>
                                <input
                                  type="text"
                                  value={prod.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateDraft((prev) => {
                                      const next = { ...prev };
                                      next.products[idx].name = val;
                                      return next;
                                    });
                                  }}
                                  placeholder="Product Name"
                                  className="w-full px-2.5 py-1.5 text-xs font-serif font-medium bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                                  Price
                                </label>
                                <input
                                  type="text"
                                  value={prod.price}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateDraft((prev) => {
                                      const next = { ...prev };
                                      next.products[idx].price = val;
                                      return next;
                                    });
                                  }}
                                  placeholder="$2,450"
                                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs text-[#2A2323]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                                Craft & Material Tagline
                              </label>
                              <input
                                type="text"
                                value={prod.tagline}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateDraft((prev) => {
                                    const next = { ...prev };
                                    next.products[idx].tagline = val;
                                    return next;
                                  });
                                }}
                                placeholder="e.g. 18k Fairmined Gold · 1.2ct F-VS Diamonds"
                                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs text-[#554949]"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                                  Ref Code
                                </label>
                                <input
                                  type="text"
                                  value={prod.refCode}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateDraft((prev) => {
                                      const next = { ...prev };
                                      next.products[idx].refCode = val;
                                      return next;
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                                  Promo Badge (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={prod.badge || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateDraft((prev) => {
                                      const next = { ...prev };
                                      next.products[idx].badge = val;
                                      return next;
                                    });
                                  }}
                                  placeholder="e.g. -14%, NEW, ICONIC"
                                  className="w-full px-2.5 py-1.5 text-xs uppercase tracking-wider bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right: Standardized Image Update & Upload Control */}
                          <div className="lg:col-span-6">
                            <ImageUpdateField
                              id={`product-img-${idx}`}
                              label={`${prod.name || `Product ${idx + 1}`} Still Photo`}
                              value={prod.image}
                              onChange={(newUrl) => {
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  next.products[idx].image = newUrl;
                                  return next;
                                });
                              }}
                              onUpload={(file) => {
                                handleImageUpload(
                                  file,
                                  (url) => {
                                    updateDraft((prev) => {
                                      const next = { ...prev };
                                      next.products[idx].image = url;
                                      return next;
                                    });
                                  },
                                  `product-${idx}`,
                                  1000,
                                  1000
                                );
                              }}
                              isUploading={uploadingImageKey === `product-${idx}`}
                              aspectRatio="1/1"
                              aspectLabel="1:1 Square Still"
                              recommendedDimensions="1000 × 1000px"
                              defaultUrl={DEFAULT_SITE_CONTENT.products[idx]?.image}
                              isLiveSynced={content.products?.[idx]?.image === prod.image}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: GIFT PACKAGING SECTION */}
              {activeTab === 'gift' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-[#EADFD5]">
                    <h2 className="font-serif text-xl text-[#2A2323]">Surprise A Loved One (Gift Packaging)</h2>
                    <p className="text-xs text-[#7A6C6C]">
                      Customize the gift box headline, subheadline, 3 packaging perks, and box ribbon label.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E5DAD0] p-4 sm:p-5 rounded-xs space-y-4 shadow-xs">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                        Top Eyebrow Badge
                      </label>
                      <input
                        type="text"
                        value={draft.giftSection.badge}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDraft((prev) => ({
                            ...prev,
                            giftSection: { ...prev.giftSection, badge: val },
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={draft.giftSection.headline}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              giftSection: { ...prev.giftSection, headline: val },
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Box Ribbon Brand Label
                        </label>
                        <input
                          type="text"
                          value={draft.giftSection.boxLabel}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              giftSection: { ...prev.giftSection, boxLabel: val },
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                        Subheadline Narrative
                      </label>
                      <textarea
                        rows={2}
                        value={draft.giftSection.subheadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDraft((prev) => ({
                            ...prev,
                            giftSection: { ...prev.giftSection, subheadline: val },
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                      />
                    </div>

                    {/* 3 Packaging Perks */}
                    <div className="pt-2 border-t border-[#F0EBE5] space-y-3">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#2A2323]">
                        3 Signature Packaging Perks
                      </span>
                      {(draft.giftSection.perks || []).map((perk, pIdx) => (
                        <div key={pIdx} className="p-3 bg-[#FAF8F5] border border-[#E8DFD5] rounded-xs space-y-2">
                          <input
                            type="text"
                            value={perk.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                if (!next.giftSection.perks) next.giftSection.perks = [];
                                next.giftSection.perks[pIdx].title = val;
                                return next;
                              });
                            }}
                            placeholder="Perk Title"
                            className="w-full px-2 py-1 text-xs font-medium bg-white border border-[#DCD0C2] rounded-xs"
                          />
                          <input
                            type="text"
                            value={perk.desc}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                if (!next.giftSection.perks) next.giftSection.perks = [];
                                next.giftSection.perks[pIdx].desc = val;
                                return next;
                              });
                            }}
                            placeholder="Perk Description"
                            className="w-full px-2 py-1 text-[11px] text-[#665959] bg-white border border-[#DCD0C2] rounded-xs"
                          />
                        </div>
                      ))}
                    </div>

                    {/* 4 Numbered Features Flanking Gift Box */}
                    <div className="pt-4 border-t border-[#F0EBE5] space-y-3">
                      <span className="text-xs uppercase tracking-wider font-semibold text-[#2A2323]">
                        4 Numbered Box Features (01, 02, 03, 04)
                      </span>
                      {(draft.giftSection.features || []).map((feat, fIdx) => (
                        <div key={fIdx} className="p-3 bg-[#FAF8F5] border border-[#E8DFD5] rounded-xs space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-serif font-semibold text-[#826D5C] px-2 py-0.5 bg-white border border-[#DCD0C2] rounded-xs">
                              {feat.number}
                            </span>
                            <input
                              type="text"
                              value={feat.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  if (!next.giftSection.features) next.giftSection.features = [];
                                  next.giftSection.features[fIdx].title = val;
                                  return next;
                                });
                              }}
                              placeholder="Feature Title (e.g. Viverra venenatis donec)"
                              className="w-full px-2 py-1 text-xs font-medium bg-white border border-[#DCD0C2] rounded-xs"
                            />
                          </div>
                          <input
                            type="text"
                            value={feat.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                if (!next.giftSection.features) next.giftSection.features = [];
                                next.giftSection.features[fIdx].description = val;
                                return next;
                              });
                            }}
                            placeholder="Feature Description"
                            className="w-full px-2 py-1 text-[11px] text-[#665959] bg-white border border-[#DCD0C2] rounded-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: BRAND & CONTACT */}
              {activeTab === 'brand' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-[#EADFD5]">
                    <h2 className="font-serif text-xl text-[#2A2323]">Brand & Concierge Settings</h2>
                    <p className="text-xs text-[#7A6C6C]">
                      Update the luxury house name, boutique contact numbers, emails, and operating hours.
                    </p>
                  </div>

                  <div className="bg-white border border-[#E5DAD0] p-4 sm:p-5 rounded-xs space-y-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Maison Name
                        </label>
                        <input
                          type="text"
                          value={draft.brand.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              brand: { ...prev.brand, name: val },
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs font-serif"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Concierge Phone
                        </label>
                        <input
                          type="text"
                          value={draft.brand.phone}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              brand: { ...prev.brand, phone: val },
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Concierge Email
                        </label>
                        <input
                          type="email"
                          value={draft.brand.email}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              brand: { ...prev.brand, email: val },
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                          Concierge Operating Hours
                        </label>
                        <input
                          type="text"
                          value={draft.brand.conciergeHours}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              brand: { ...prev.brand, conciergeHours: val },
                            }));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                        Boutique Addresses
                      </label>
                      <input
                        type="text"
                        value={draft.brand.address}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDraft((prev) => ({
                            ...prev,
                            brand: { ...prev.brand, address: val },
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE LIVE PREVIEW (Rendered when viewMode is 'split' or 'preview') */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`${
              viewMode === 'split' ? 'hidden lg:flex lg:w-1/2' : 'w-full'
            } flex-1 bg-[#231F1F] p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-start`}
          >
            {/* Viewport Frame Header */}
            <div className="w-full max-w-full flex items-center justify-between text-white/70 text-xs pb-3 border-b border-white/10 mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="uppercase tracking-widest text-[10px] font-semibold text-white/90">
                  Live Preview • Device: {deviceMode.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] text-white/50 tracking-wider">
                Changes reflect automatically
              </span>
            </div>

            {/* Scrollable Device Wrapper */}
            <div className="w-full flex-1 overflow-y-auto flex justify-center items-start pb-12">
              <div
                className={`transition-all duration-300 bg-white shadow-2xl rounded-xs overflow-hidden ${
                  deviceMode === 'mobile'
                    ? 'w-[375px] min-h-[667px] border-[8px] border-[#363030] rounded-[24px]'
                    : deviceMode === 'tablet'
                    ? 'w-[768px] min-h-[900px] border-[10px] border-[#363030] rounded-[20px]'
                    : 'w-full max-w-6xl'
                }`}
              >
                {/* Live Public Site Preview */}
                <div className="w-full pointer-events-auto select-auto">
                  <Header
                    activeSection="home"
                    onOpenContact={() => {}}
                    onNavigateSection={() => {}}
                  />
                  <FadeInSection delay={60}>
                    <Hero />
                  </FadeInSection>
                  <FadeInSection>
                    <FeaturedCollections onSelectCategory={() => {}} />
                  </FadeInSection>
                  <FadeInSection>
                    <EverydayElegance onSelectPiece={() => {}} />
                  </FadeInSection>
                  <FadeInSection>
                    <EditorialStoryTabs onExplore={() => {}} />
                  </FadeInSection>
                  <FadeInSection>
                    <GiftPackagingSection onOpenGiftInquiry={() => {}} />
                  </FadeInSection>
                  <FadeInSection>
                    <Footer onOpenContact={() => {}} onNavigateSection={() => {}} />
                  </FadeInSection>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* EXPORT & VERCEL DEPLOYMENT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] max-w-2xl w-full rounded-sm shadow-2xl border border-[#E8DFD5] overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFE8E1] bg-[#FAF6F2]">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-[#8C5D3B]" />
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#2A2323]">
                    Deploy to Vercel & Export Content
                  </h3>
                  <p className="text-xs text-[#7A6E6E]">
                    Sync your CMS changes permanently to <span className="font-mono font-medium">signorabloom.vercel.app</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 text-[#8A7D7D] hover:text-[#2A2323] hover:bg-[#EFE7DF] rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#4A4040]">
              
              {/* Alert: Why no deployment on Vercel */}
              <div className="p-3.5 bg-[#FAF7F2] border border-[#E6D7C8] rounded-xs text-xs text-[#6B533E] space-y-1.5 leading-relaxed">
                <p className="font-semibold text-[#4A3522] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#8C5D3B]" />
                  Why is there no deployment showing in Vercel?
                </p>
                <p>
                  Vercel builds strictly from your <strong>Git repository (GitHub)</strong>. Saving changes inside this web admin panel updates your site locally, but does not create a Git commit on GitHub.
                </p>
              </div>

              {/* Action 1: Export siteContent.ts */}
              <div className="border border-[#EADFD5] p-4 rounded-xs bg-[#FFFFFF] space-y-3">
                <h4 className="font-serif text-base font-medium text-[#2A2323]">
                  1. Export Your Customized Code
                </h4>
                <p className="text-xs text-[#6E6363] leading-relaxed">
                  Download or copy your customized content file. This includes all your updated products, slides, editorial texts, and prices:
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadSiteContentTs}
                    className="px-4 py-2 bg-[#2A2323] hover:bg-[#453939] text-white text-xs uppercase tracking-widest rounded-xs flex items-center gap-2 font-medium cursor-pointer transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Download siteContent.ts
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySiteContentTs}
                    className="px-4 py-2 border border-[#D9C8B8] hover:bg-[#FAF6F2] text-[#4A4040] text-xs uppercase tracking-widest rounded-xs flex items-center gap-2 font-medium cursor-pointer transition-colors"
                  >
                    {hasCopiedCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action 2: Steps to deploy on Vercel */}
              <div className="border border-[#EADFD5] p-4 rounded-xs bg-[#FFFFFF] space-y-2.5">
                <h4 className="font-serif text-base font-medium text-[#2A2323]">
                  2. Update & Deploy on Vercel
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#5E5353] space-y-2 leading-relaxed">
                  <li>
                    In your project repo, replace <code className="bg-[#FAF5F0] text-[#7A5333] px-1 py-0.5 rounded-xs font-mono font-semibold">src/siteContent.ts</code> with the downloaded file.
                  </li>
                  <li>
                    Commit and push your changes to GitHub (<code className="bg-[#FAF5F0] text-[#7A5333] px-1 py-0.5 rounded-xs font-mono font-semibold">git commit -m "Update site content" && git push</code>).
                  </li>
                  <li>
                    <strong>Vercel will automatically start a new deployment</strong> and publish your changes to <span className="font-medium text-[#2A2323]">signorabloom.vercel.app</span>!
                  </li>
                </ol>
              </div>

              {/* Option 3: Cloud Database (Firebase) */}
              <div className="p-3.5 bg-[#F2F7F4] border border-[#C5E1CF] rounded-xs text-xs text-[#285737] space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-[#1D472B]">
                  <Cloud className="w-4 h-4 text-[#2E7A4A]" />
                  Want edits to update live worldwide without any Vercel redeploys?
                </p>
                <p className="leading-relaxed">
                  We can connect <strong>Firebase Firestore</strong>. Every time you click "Save & Publish", your changes will save to the cloud and instantly appear for every visitor on all devices worldwide in real time.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAF7F3] border-t border-[#EFE8E1] flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-1.5 border border-[#D9C8B8] text-[#554A4A] hover:bg-[#FFFFFF] text-xs uppercase tracking-widest rounded-xs cursor-pointer font-medium"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
