import React from 'react';
import braceletsSquareImg from '../assets/images/shop_bracelets_square_1789491269438.jpg';
import { useSiteContent } from '../context/SiteContentContext';

interface FeaturedCollectionsProps {
  onSelectCategory?: (category: string) => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ onSelectCategory }) => {
  const { content } = useSiteContent();
  const collections = content?.collections || [];

  const colRings = collections[0] || {
    title: 'FINE RINGS',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
  };
  const colBracelets = collections[1] || {
    title: 'SCULPTURAL BRACELETS',
    image: braceletsSquareImg,
  };
  const colNecklaces = collections[3] || {
    title: 'MEDALLION NECKLACES',
    image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=85',
  };
  const colEarrings = collections[2] || {
    title: 'DROP & HOOP EARRINGS',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85',
  };

  const handleClick = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  return (
    <section 
      id="collections" 
      aria-label="Category Collections Mosaic"
      className="w-full bg-[#FFFFFF] py-8 sm:py-12 md:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Exact 3-Column Mosaic Grid: All columns aligned flush at top and bottom */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          
          {/* ========================================================== */}
          {/* 1. LEFT COLUMN: Image 1 (SHOP RINGS) -> 9:16 RATIO        */}
          {/* ========================================================== */}
          <div 
            id="mosaic-rings"
            onClick={() => handleClick('rings')}
            className="group cursor-pointer md:col-span-4 relative flex flex-col overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full"
          >
            {/* Aspect Ratio 9:16 */}
            <div className="relative w-full h-full aspect-[9/16] overflow-hidden">
              <img
                src={colRings.image}
                alt={colRings.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85';
                }}
              />

              {/* Centered Bottom Label */}
              <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
                <span className="inline-block text-[11px] sm:text-[12px] tracking-[0.22em] uppercase text-[#332B2B] font-normal border-b border-[#332B2B]/40 pb-0.5 group-hover:border-[#332B2B] transition-colors bg-[#FFFFFF]/85 backdrop-blur-[3px] px-4 py-1 shadow-xs">
                  {colRings.title}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* 2. MIDDLE COLUMN: Image 5 (1:1 RATIO) + Images 3 & 4       */}
          {/* Aligned flush at the bottom with Image 1 & Image 2        */}
          {/* ========================================================== */}
          <div className="md:col-span-4 flex flex-col justify-between gap-3 sm:gap-4 h-full">
            
            {/* TOP: Image 5 (SHOP BRACELETS) -> 1:1 RATIO (SQUARE) */}
            <div 
              id="mosaic-bracelets"
              onClick={() => handleClick('bracelets')}
              className="group cursor-pointer relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs w-full aspect-square shrink-0"
            >
              <img
                src={colBracelets.image}
                alt={colBracelets.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85';
                }}
              />

              {/* Centered Label */}
              <div className="absolute bottom-5 left-0 right-0 text-center pointer-events-none z-10">
                <span className="inline-block text-[11px] sm:text-[12px] tracking-[0.22em] uppercase text-[#332B2B] font-normal border-b border-[#332B2B]/40 pb-0.5 group-hover:border-[#332B2B] transition-colors bg-[#FFFFFF]/85 backdrop-blur-[3px] px-4 py-1 shadow-xs">
                  {colBracelets.title}
                </span>
              </div>
            </div>

            {/* BOTTOM: Images 3 & 4 side by side -> Fills remaining height to align bottom perfectly */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0">
              
              {/* Image 3: SHOP NECKLACES */}
              <div
                id="mosaic-necklaces"
                onClick={() => handleClick('necklaces')}
                className="group cursor-pointer relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full flex flex-col"
              >
                <div className="relative w-full h-full min-h-[140px] sm:min-h-[180px] overflow-hidden">
                  <img
                    src={colNecklaces.image}
                    alt={colNecklaces.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85';
                    }}
                  />

                  {/* Centered Label */}
                  <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                    <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#332B2B] font-normal border-b border-[#332B2B]/40 pb-0.5 group-hover:border-[#332B2B] transition-colors bg-[#FFFFFF]/85 backdrop-blur-[3px] px-2 py-0.5 shadow-xs">
                      {colNecklaces.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image 4: SHOP EARRINGS */}
              <div
                id="mosaic-earrings"
                onClick={() => handleClick('earrings')}
                className="group cursor-pointer relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full flex flex-col"
              >
                <div className="relative w-full h-full min-h-[140px] sm:min-h-[180px] overflow-hidden">
                  <img
                    src={colEarrings.image}
                    alt={colEarrings.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-103"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85';
                    }}
                  />

                  {/* Centered Label */}
                  <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                    <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-[#332B2B] font-normal border-b border-[#332B2B]/40 pb-0.5 group-hover:border-[#332B2B] transition-colors bg-[#FFFFFF]/85 backdrop-blur-[3px] px-2 py-0.5 shadow-xs">
                      {colEarrings.title}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================== */}
          {/* 3. RIGHT COLUMN: Image 2 (SHOP CHARM) -> 9:16 RATIO       */}
          {/* ========================================================== */}
          <div 
            id="mosaic-charms"
            onClick={() => handleClick('charms')}
            className="group cursor-pointer md:col-span-4 relative flex flex-col overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full"
          >
            {/* Aspect Ratio 9:16 */}
            <div className="relative w-full h-full aspect-[9/16] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85"
                alt="Brunette model resting face on hand wearing gold hoop earrings"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-103"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=85';
                }}
              />

              {/* Centered Bottom Label: SHOP CHARM */}
              <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
                <span className="inline-block text-[11px] sm:text-[12px] tracking-[0.22em] uppercase text-[#332B2B] font-normal border-b border-[#332B2B]/40 pb-0.5 group-hover:border-[#332B2B] transition-colors bg-[#FFFFFF]/85 backdrop-blur-[3px] px-4 py-1 shadow-xs">
                  SHOP CHARMS
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

