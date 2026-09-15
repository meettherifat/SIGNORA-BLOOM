import React from 'react';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  activeSection?: string;
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection = 'home',
  onOpenContact,
  onNavigateSection,
}) => {
  return (
    <header className="w-full sticky top-0 z-40 bg-white/65 backdrop-blur-md backdrop-saturate-150 border-b border-[#F0EBE5]/60 shadow-[0_4px_24px_rgba(51,43,43,0.04)] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col items-center">
        
        {/* Centered Brand Wordmark (matching reference 'mojuri' style) */}
        <div className="mb-2.5 sm:mb-3">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('home');
            }}
            className="text-center inline-block group"
          >
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.22em] text-[#2A2323] font-light group-hover:text-[#B89B82] transition-colors">
              SIGNORA BLOOM
            </span>
          </a>
        </div>

        {/* Centered Sub-Navigation Links */}
        <nav 
          aria-label="Main Navigation" 
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-9 text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-[#736767]"
        >
          {/* HOME (Active with coral/red accent) */}
          <button
            onClick={() => onNavigateSection('home')}
            className={`transition-colors py-1 flex items-center gap-1 cursor-pointer relative ${
              activeSection === 'home'
                ? 'text-[#C97A63] font-medium'
                : 'hover:text-[#2A2323]'
            }`}
          >
            <span>HOME</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            {activeSection === 'home' && (
              <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-[#C97A63]" />
            )}
          </button>

          {/* COLLECTIONS */}
          <button
            onClick={() => onNavigateSection('collections')}
            className={`transition-colors py-1 flex items-center gap-1 cursor-pointer ${
              activeSection === 'collections'
                ? 'text-[#C97A63] font-medium'
                : 'hover:text-[#2A2323]'
            }`}
          >
            <span>COLLECTIONS</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* EVERYDAY ELEGANCE */}
          <button
            onClick={() => onNavigateSection('everyday-elegance')}
            className="hover:text-[#2A2323] transition-colors py-1 flex items-center gap-1 cursor-pointer"
          >
            <span>ELEGANCE</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* ABOUT */}
          <button
            onClick={() => onNavigateSection('about')}
            className="hover:text-[#2A2323] transition-colors py-1 flex items-center gap-1 cursor-pointer"
          >
            <span>ABOUT</span>
          </button>

          {/* CONTACT */}
          <button
            onClick={onOpenContact}
            className="hover:text-[#2A2323] transition-colors py-1 cursor-pointer font-medium"
          >
            <span>CONTACT</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
