import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeaturedCollections } from './components/FeaturedCollections';
import { EverydayElegance } from './components/EverydayElegance';
import { EditorialStoryTabs } from './components/EditorialStoryTabs';
import { GiftPackagingSection } from './components/GiftPackagingSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ContactConciergeModal } from './components/ContactConciergeModal';
import { Accessory } from './types';
import { SiteContentProvider } from './context/SiteContentContext';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  const getRouteFromUrl = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (
      path === '/rifat' ||
      path.startsWith('/rifat/') ||
      path === '/admin' ||
      path.startsWith('/admin/') ||
      hash === '#rifat' ||
      hash.startsWith('#/rifat') ||
      hash === '#admin' ||
      hash.startsWith('#/admin')
    ) {
      return '/rifat';
    }
    return path;
  };

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return getRouteFromUrl();
  });

  const [selectedPiece, setSelectedPiece] = useState<Accessory | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [inquiryAccessory, setInquiryAccessory] = useState<Accessory | null>(null);
  const [activeNavSection, setActiveNavSection] = useState<string>('home');

  // Handle popstate and hashchange for browser back/forward buttons & direct links
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getRouteFromUrl());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenContact = (accessory?: Accessory | null) => {
    setInquiryAccessory(accessory || null);
    setIsContactOpen(true);
  };

  const handleNavigateSection = (sectionId: string) => {
    if (currentPath !== '/') {
      navigateTo('/');
      // Allow DOM to settle before scrolling
      setTimeout(() => {
        const elem = document.getElementById(sectionId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    setActiveNavSection(sectionId);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExploreCollections = () => {
    handleNavigateSection('collections');
  };

  const isAdminRoute =
    currentPath === '/rifat' ||
    currentPath.startsWith('/rifat/') ||
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/');

  return (
    <SiteContentProvider>
      {isAdminRoute ? (
        <AdminPage onNavigateHome={() => navigateTo('/')} />
      ) : (
        <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#2A2323] selection:bg-[#D8A7A7]/30 selection:text-[#332B2B]">
          {/* 1. HEADER (Glassy navbar effect) */}
          <Header
            activeSection={activeNavSection}
            onOpenContact={() => handleOpenContact()}
            onNavigateSection={handleNavigateSection}
          />

          {/* MAIN HOMEPAGE SECTIONS */}
          <main className="flex-1">
            {/* 2. HERO: Interactive Slider with 16:9 scenes and controls */}
            <Hero onExploreClick={handleExploreCollections} />

            {/* 3. CATEGORY MOSAIC: 3-column mosaic with aligned 9:16 and 1:1 ratios */}
            <FeaturedCollections
              onSelectCategory={() => handleNavigateSection('everyday-elegance')}
            />

            {/* 4. EVERYDAY ELEGANCE: 4-square product row with -14% and -20% badges */}
            <EverydayElegance
              onSelectPiece={(piece) => setSelectedPiece(piece)}
            />

            {/* 5. TABBED EDITORIAL: Beauty & Ingenuity (3:4 main image & 1:1 detail) */}
            <EditorialStoryTabs onExplore={handleExploreCollections} />

            {/* 6. SURPRISE A LOVED ONE: Luxury Striped Gift Box Section */}
            <GiftPackagingSection onOpenGiftInquiry={() => handleOpenContact()} />
          </main>

          {/* 7. CLEAN FOOTER */}
          <Footer
            onOpenContact={() => handleOpenContact()}
            onNavigateSection={handleNavigateSection}
            onNavigateAdmin={() => navigateTo('/rifat')}
          />

          {/* Editorial Piece Detail Modal */}
          <ProductDetailModal
            accessory={selectedPiece}
            onClose={() => setSelectedPiece(null)}
            onInquire={(piece) => {
              setSelectedPiece(null);
              handleOpenContact(piece);
            }}
          />

          {/* Contact & Atelier Consultation Modal */}
          <ContactConciergeModal
            isOpen={isContactOpen}
            onClose={() => {
              setIsContactOpen(false);
              setInquiryAccessory(null);
            }}
            preselectedAccessory={inquiryAccessory}
          />
        </div>
      )}
    </SiteContentProvider>
  );
}
