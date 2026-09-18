import React from 'react';
import braceletsSquareImg from '../assets/images/shop_bracelets_square_1789491269438.jpg';
import { useSiteContent } from '../context/SiteContentContext';

interface FeaturedCollectionsProps {
  onSelectCategory?: (category: string) => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = () => {
  const { content } = useSiteContent();
  const collections = content?.collections || [];

  const colRings = collections.find((c) => c.id === 'fine-rings') || collections[0] || {
    id: 'fine-rings',
    title: 'FINE RINGS',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
  };
  const colBracelets = collections.find((c) => c.id === 'sculptural-bracelets') || collections[1] || {
    id: 'sculptural-bracelets',
    title: 'SCULPTURAL BRACELETS',
    image: braceletsSquareImg,
  };
  const colNecklaces = collections.find((c) => c.id === 'medallion-necklaces') || collections[3] || {
    id: 'medallion-necklaces',
    title: 'MEDALLION NECKLACES',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85',
  };
  const colEarrings = collections.find((c) => c.id === 'drop-hoop-earrings') || collections[2] || {
    id: 'drop-hoop-earrings',
    title: 'DROP & HOOP EARRINGS',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=85',
  };
  const colCharms = collections.find((c) => c.id === 'shop-charms') || collections[4] || {
    id: 'shop-charms',
    title: 'SHOP CHARMS',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
  };

  return (
    <section 
      id="collections" 
      aria-label="Category Collections Mosaic"
      className="w-full bg-[#FFFFFF] py-8 sm:py-12 md:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Exact 3-Column Mosaic Grid: All columns aligned flush at top and bottom */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch select-none">
          
          {/* ========================================================== */}
          {/* 1. LEFT COLUMN: Image 1 -> 9:16 RATIO                      */}
          {/* ========================================================== */}
          <div 
            id="mosaic-rings"
            className="md:col-span-4 relative flex flex-col overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full cursor-default"
          >
            {/* Aspect Ratio 9:16 */}
            <div className="relative w-full h-full aspect-[9/16] overflow-hidden">
              <img
                src={colRings.image}
                alt={colRings.title || 'Fine Rings'}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85';
                }}
              />
            </div>
          </div>

          {/* ========================================================== */}
          {/* 2. MIDDLE COLUMN: Image 2 (1:1 RATIO) + Images 3 & 4       */}
          {/* Aligned flush at the bottom with Image 1 & Image 5        */}
          {/* ========================================================== */}
          <div className="md:col-span-4 flex flex-col justify-between gap-3 sm:gap-4 h-full">
            
            {/* TOP: Image 2 -> 1:1 RATIO (SQUARE) */}
            <div 
              id="mosaic-bracelets"
              className="relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs w-full aspect-square shrink-0 cursor-default"
            >
              <img
                src={colBracelets.image}
                alt={colBracelets.title || 'Sculptural Bracelets'}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85';
                }}
              />
            </div>

            {/* BOTTOM: Images 3 & 4 side by side -> Fills remaining height to align bottom perfectly */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0">
              
              {/* Image 3 */}
              <div
                id="mosaic-necklaces"
                className="relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full flex flex-col cursor-default"
              >
                <div className="relative w-full h-full min-h-[140px] sm:min-h-[180px] overflow-hidden">
                  <img
                    src={colNecklaces.image}
                    alt={colNecklaces.title || 'Medallion Necklaces'}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85';
                    }}
                  />
                </div>
              </div>

              {/* Image 4 */}
              <div
                id="mosaic-earrings"
                className="relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full flex flex-col cursor-default"
              >
                <div className="relative w-full h-full min-h-[140px] sm:min-h-[180px] overflow-hidden">
                  <img
                    src={colEarrings.image}
                    alt={colEarrings.title || 'Drop and Hoop Earrings'}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85';
                    }}
                  />
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================== */}
          {/* 3. RIGHT COLUMN: Image 5 -> 9:16 RATIO                     */}
          {/* ========================================================== */}
          <div 
            id="mosaic-charms"
            className="md:col-span-4 relative flex flex-col overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full cursor-default"
          >
            {/* Aspect Ratio 9:16 */}
            <div className="relative w-full h-full aspect-[9/16] overflow-hidden">
              <img
                src={colCharms.image}
                alt={colCharms.title || 'Shop Charms'}
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-102"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=85';
                }}
              />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
