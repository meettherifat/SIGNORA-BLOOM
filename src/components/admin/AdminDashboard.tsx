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
import { SiteContent } from '../../siteContent';
import { useSiteContent } from '../../context/SiteContentContext';
import { safeParseResponseJson } from '../../utils/security';
import { compressImageFile } from '../../utils/storageDb';

// Import public components for the real-time live preview
import { Header } from '../Header';
import { Hero } from '../Hero';
import { FeaturedCollections } from '../FeaturedCollections';
import { EverydayElegance } from '../EverydayElegance';
import { EditorialStoryTabs } from '../EditorialStoryTabs';
import { GiftPackagingSection } from '../GiftPackagingSection';
import { Footer } from '../Footer';

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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  onLogout,
  onSessionExpired,
  onViewPublicSite,
}) => {
  const { content, updateContent, saveContentToServer, resetContentOnServer } = useSiteContent();

  // Local draft state for editing before publishing
  const [draft, setDraft] = useState<SiteContent>(JSON.parse(JSON.stringify(content)));
  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with incoming saved content if user hasn't made unsaved modifications
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setDraft(JSON.parse(JSON.stringify(content)));
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

  // Save changes to backend
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    const result = await saveContentToServer(draft, token);
    setIsSaving(false);
    setSaveStatus(result);
    if (result.success) {
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus(null), 4000);
    } else if (result.message && (result.message.includes('Unauthorized') || result.message.includes('expired'))) {
      onSessionExpired?.();
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
              <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
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

        {/* Save Status Notification Banner */}
        {saveStatus && (
          <div
            className={`mt-2.5 p-2.5 rounded-xs flex items-center justify-between text-xs transition-all ${
              saveStatus.success
                ? 'bg-[#EBF7EE] border border-[#BDE3C4] text-[#246633]'
                : 'bg-[#FCEDED] border border-[#F7C6C6] text-[#A82E2E]'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
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
                  <div className="flex items-center justify-between pb-2 border-b border-[#EADFD5]">
                    <div>
                      <h2 className="font-serif text-xl text-[#2A2323]">Hero Banner Slider</h2>
                      <p className="text-xs text-[#7A6C6C]">
                        Configure the 16:9 full-width slides, background images, and alt text.
                      </p>
                    </div>
                  </div>

                  {draft.hero.slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="bg-white border border-[#E5DAD0] p-4 sm:p-5 rounded-xs space-y-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE3]">
                        <span className="text-xs uppercase tracking-widest font-semibold text-[#2A2323]">
                          Slide #{idx + 1}
                        </span>
                      </div>

                      {/* Image Preview & URL Input */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-4 aspect-[16/9] bg-[#FAF5F0] border border-[#E2D5C8] rounded-xs overflow-hidden relative">
                          <img
                            src={slide.image}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="sm:col-span-8 space-y-2">
                          <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium">
                            Image Source URL or Local Upload
                          </label>
                          <input
                            type="text"
                            value={slide.image}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.hero.slides[idx].image = newUrl;
                                return next;
                              });
                            }}
                            placeholder="https://... or /assets/..."
                            className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                          />

                          {/* Upload from file */}
                          <div className="flex items-center gap-2 pt-1">
                            <label className="px-3 py-1.5 bg-[#F0EBE5] hover:bg-[#E5DFD7] text-[#3A3232] text-[10px] uppercase tracking-wider rounded-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                              {uploadingImageKey === `hero-${idx}` ? (
                                <div className="w-3 h-3 border-2 border-[#3A3232] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              <span>{uploadingImageKey === `hero-${idx}` ? 'Optimizing...' : 'Upload Image File'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(
                                      file,
                                      (url) => {
                                        updateDraft((prev) => {
                                          const next = { ...prev };
                                          next.hero.slides[idx].image = url;
                                          return next;
                                        });
                                      },
                                      `hero-${idx}`,
                                      1920,
                                      1080
                                    );
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[10px] text-[#8E8080]">Auto-optimized for web (16:9)</span>
                          </div>
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
                            updateDraft((prev) => {
                              const next = { ...prev };
                              next.hero.slides[idx].alt = val;
                              return next;
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E0D5CA] rounded-xs text-[#2A2323] focus:border-[#2A2323] outline-none"
                        />
                      </div>
                    </div>
                  ))}
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

                      {/* Main 3:4 Image & Inset 1:1 Image */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        
                        {/* 3:4 Main Image */}
                        <div className="p-3 bg-[#FAF8F5] border border-[#E8DFD5] rounded-xs space-y-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#4A3F3F]">
                            Main Portrait Image (3:4 Ratio)
                          </span>
                          <div className="aspect-[3/4] w-24 bg-[#EFE8DF] overflow-hidden rounded-xs mx-auto border border-[#D8CEBF]">
                            <img
                              src={tab.mainImage}
                              alt="Main Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <input
                            type="text"
                            value={tab.mainImage}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.editorial.tabs[idx].mainImage = val;
                                return next;
                              });
                            }}
                            placeholder="Image URL"
                            className="w-full px-2 py-1 text-[11px] bg-white border border-[#D8CEBF] rounded-xs outline-none"
                          />
                          <label className="block text-center py-1 bg-white hover:bg-[#F3ECE5] border border-[#D8CEBF] text-[10px] uppercase tracking-wider text-[#4A3F3F] rounded-xs cursor-pointer">
                            {uploadingImageKey === `editorial-main-${idx}` ? 'Optimizing...' : 'Upload 3:4 File'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
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
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* 1:1 Inset Detail Image */}
                        <div className="p-3 bg-[#FAF8F5] border border-[#E8DFD5] rounded-xs space-y-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#4A3F3F]">
                            Small Inset Detail Image (1:1 Ratio)
                          </span>
                          <div className="aspect-square w-20 bg-[#EFE8DF] overflow-hidden rounded-xs mx-auto border border-[#D8CEBF]">
                            <img
                              src={tab.insetDetailImage}
                              alt="Detail Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <input
                            type="text"
                            value={tab.insetDetailImage}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.editorial.tabs[idx].insetDetailImage = val;
                                return next;
                              });
                            }}
                            placeholder="Image URL"
                            className="w-full px-2 py-1 text-[11px] bg-white border border-[#D8CEBF] rounded-xs outline-none"
                          />
                          <label className="block text-center py-1 bg-white hover:bg-[#F3ECE5] border border-[#D8CEBF] text-[10px] uppercase tracking-wider text-[#4A3F3F] rounded-xs cursor-pointer">
                            {uploadingImageKey === `editorial-inset-${idx}` ? 'Optimizing...' : 'Upload 1:1 Square File'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
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
                                }
                              }}
                            />
                          </label>
                        </div>

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
              {activeTab === 'collections' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-[#EADFD5]">
                    <h2 className="font-serif text-xl text-[#2A2323]">Featured Category Mosaic</h2>
                    <p className="text-xs text-[#7A6C6C]">
                      Modify the 4 collections: Fine Rings, Sculptural Bracelets, Drop & Hoop Earrings, and Medallion Necklaces.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {draft.collections.map((col, idx) => (
                      <div
                        key={col.id}
                        className="bg-white border border-[#E5DAD0] p-4 rounded-xs space-y-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-[#FAF5F0] border border-[#E2D5C8] rounded-xs overflow-hidden shrink-0">
                            <img
                              src={col.image}
                              alt={col.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={col.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  next.collections[idx].title = val;
                                  return next;
                                });
                              }}
                              className="w-full px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs mb-1"
                            />
                            <input
                              type="text"
                              value={col.itemCount}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  next.collections[idx].itemCount = val;
                                  return next;
                                });
                              }}
                              placeholder="Item Count (e.g. 24 Designs)"
                              className="w-full px-2 py-1 text-[11px] text-[#7A6C6C] bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={col.subtitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.collections[idx].subtitle = val;
                                return next;
                              });
                            }}
                            className="w-full px-2 py-1 text-xs bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-[#665959] font-medium mb-1">
                            Image URL
                          </label>
                          <input
                            type="text"
                            value={col.image}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => {
                                const next = { ...prev };
                                next.collections[idx].image = val;
                                return next;
                              });
                            }}
                            className="w-full px-2 py-1 text-xs bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs mb-1.5"
                          />
                          <label className="block text-center py-1 bg-[#FAF6F1] hover:bg-[#EFE7DE] border border-[#E2D5C8] text-[10px] uppercase tracking-wider text-[#4A3F3F] rounded-xs cursor-pointer">
                            {uploadingImageKey === `collection-${idx}` ? 'Optimizing...' : 'Upload Card Image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(
                                    file,
                                    (url) => {
                                      updateDraft((prev) => {
                                        const next = { ...prev };
                                        next.collections[idx].image = url;
                                        return next;
                                      });
                                    },
                                    `collection-${idx}`,
                                    1000,
                                    1000
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        className="bg-white border border-[#E5DAD0] p-4 rounded-xs shadow-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                          
                          {/* Image Thumbnail */}
                          <div className="sm:col-span-2 aspect-square bg-[#FAF5F0] border border-[#E2D5C8] rounded-xs overflow-hidden">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="sm:col-span-6 space-y-2">
                            <div className="flex gap-2">
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
                                className="w-2/3 px-2 py-1 text-xs font-serif font-medium bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
                              />
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
                                placeholder="Price"
                                className="w-1/3 px-2 py-1 text-xs font-semibold bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs text-[#2A2323]"
                              />
                            </div>

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
                              placeholder="Material / Craft Tagline"
                              className="w-full px-2 py-1 text-[11px] bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs text-[#665959]"
                            />
                          </div>

                          {/* Badge & Image URL */}
                          <div className="sm:col-span-4 space-y-2">
                            <div className="flex gap-2">
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
                                placeholder="Badge (e.g. -14%, NEW)"
                                className="w-1/2 px-2 py-1 text-[11px] bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs uppercase tracking-wider"
                              />
                              <label className="w-1/2 text-center py-1 bg-[#FAF6F1] hover:bg-[#EFE7DE] border border-[#E2D5C8] text-[10px] uppercase tracking-wider text-[#4A3F3F] rounded-xs cursor-pointer">
                                {uploadingImageKey === `product-${idx}` ? 'Optimizing...' : 'Upload Photo'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
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
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            <input
                              type="text"
                              value={prod.image}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDraft((prev) => {
                                  const next = { ...prev };
                                  next.products[idx].image = val;
                                  return next;
                                });
                              }}
                              placeholder="Image URL"
                              className="w-full px-2 py-1 text-[10px] bg-[#FAF8F5] border border-[#E2D5C8] rounded-xs"
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
                  <Hero />
                  <FeaturedCollections onSelectCategory={() => {}} />
                  <EverydayElegance onSelectPiece={() => {}} />
                  <EditorialStoryTabs onExplore={() => {}} />
                  <GiftPackagingSection onOpenGiftInquiry={() => {}} />
                  <Footer onOpenContact={() => {}} onNavigateSection={() => {}} />
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
