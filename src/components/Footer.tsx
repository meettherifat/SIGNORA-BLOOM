import React from 'react';
import { Lock } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';

interface FooterProps {
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact, onNavigateSection, onNavigateAdmin }) => {
  const { content } = useSiteContent();

  const facebookUrl = content?.brand?.facebookUrl || 'https://www.facebook.com/signorabloom/';
  const instagramUrl = content?.brand?.instagramUrl || 'https://instagram.com/tuhinajahantopa';

  const normalizedFacebookUrl = facebookUrl.startsWith('http') ? facebookUrl : `https://${facebookUrl}`;
  const normalizedInstagramUrl = instagramUrl.startsWith('http') ? instagramUrl : `https://${instagramUrl}`;

  return (
    <footer id="footer-section" className="bg-[#FFFFFF] text-[#332B2B] border-t border-[#F0EBE5] py-14 sm:py-18">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Brand Name */}
        <h3 className="font-serif text-2xl sm:text-3xl tracking-[0.24em] font-light text-[#332B2B] mb-2">
          SIGNORA BLOOM
        </h3>

        {/* Tagline */}
        <p className="font-serif text-xs sm:text-sm italic text-[#8E8080] mb-7">
          {content?.brand?.tagline || 'A Curated Collection of Everyday Elegance.'}
        </p>

        {/* Navigation */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-6 sm:gap-9 text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-[#736767] mb-7">
          <button 
            onClick={() => onNavigateSection('home')} 
            className="hover:text-[#332B2B] transition-colors cursor-pointer"
          >
            HOME
          </button>
          <button 
            onClick={() => onNavigateSection('collections')} 
            className="hover:text-[#332B2B] transition-colors cursor-pointer"
          >
            COLLECTIONS
          </button>
          <button 
            onClick={() => onNavigateSection('everyday-elegance')} 
            className="hover:text-[#332B2B] transition-colors cursor-pointer"
          >
            ELEGANCE
          </button>
          <button 
            onClick={() => onNavigateSection('about')} 
            className="hover:text-[#332B2B] transition-colors cursor-pointer"
          >
            ABOUT
          </button>
          <button 
            onClick={onOpenContact} 
            className="hover:text-[#332B2B] transition-colors cursor-pointer"
          >
            CONTACT
          </button>
        </nav>

        {/* Social */}
        <div className="flex items-center justify-center space-x-6 text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#736767] mb-8">
          <a
            id="footer-instagram-link"
            href={normalizedInstagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#332B2B] transition-colors"
          >
            Instagram
          </a>
          <span className="text-[#D8C8B8]">·</span>
          <a
            id="footer-facebook-link"
            href={normalizedFacebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#332B2B] transition-colors"
          >
            Facebook
          </a>
        </div>

        {/* Divider */}
        <div className="w-10 h-[1px] bg-[#E8DFD5] mx-auto mb-6" />

        {/* Copyright & Admin Portal Link */}
        <div className="flex items-center justify-center gap-4 text-[10px] tracking-[0.16em] text-[#8E8080]">
          <span>© 2026 SIGNORA BLOOM. All rights reserved.</span>
          {onNavigateAdmin && (
            <>
              <span className="text-[#D8C8B8]">·</span>
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="inline-flex items-center gap-1 text-[#A09393] hover:text-[#2A2323] transition-colors cursor-pointer"
                title="Admin Panel (/rifat)"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Atelier Admin</span>
              </button>
            </>
          )}
        </div>

      </div>
    </footer>
  );
};
