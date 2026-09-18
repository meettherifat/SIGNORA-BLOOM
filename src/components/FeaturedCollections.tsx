import React from 'react';
import braceletsSquareImg from '../assets/images/shop_bracelets_square_1789491269438.jpg';
import { useSiteContent } from '../context/SiteContentContext';
import { ImageWithSkeleton } from './ui/ImageWithSkeleton';
import { FeaturedCollectionsSkeleton } from './skeletons/FeaturedCollectionsSkeleton';

interface FeaturedCollectionsProps {
  onSelectCategory?: (category: string) => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ onSelectCategory }) => {
  const { content, isLoading } = useSiteContent();
  const collections = content?.collections || [];

  if (isLoading) {
    return <FeaturedCollectionsSkeleton />;
  }

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
            role={onSelectCategory ? 'button' : undefined}
            tabIndex={onSelectCategory ? 0 : undefined}
            onClick={() => onSelectCategory?.('fine-rings')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onSelectCategory) {
                e.preventDefault();
                onSelectCategory('fine-rings');
              }
            }}
            data-cursor="image"
            data-cursor-text="EXPLORE"
            className="md:col-span-4 relative flex flex-col overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full cursor-pointer focus:outline-hidden"
          >
            {/* Aspect Ratio 9:16 with skeleton loader */}
            <ImageWithSkeleton
              id="mosaic-img-rings"
              src={colRings.image}
              alt={colRings.title || 'Fine Rings'}
              aspectRatio="9/16"
              skeletonLabel="FINE RINGS"
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
              containerClassName="w-full h-full aspect-[9/16]"
              fallbackSrc="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=85"
            />
          </div>

          {/* ========================================================== */}
          {/* 2. MIDDLE COLUMN: Image 2 (1:1 RATIO) + Images 3 & 4       */}
          {/* Aligned flush at the bottom with Image 1 & Image 5        */}
          {/* ========================================================== */}
          <div className="md:col-span-4 flex flex-col justify-between gap-3 sm:gap-4 h-full">
            
            {/* TOP: Image 2 -> 1:1 RATIO (SQUARE) */}
            <div 
              id="mosaic-bracelets"
              role={onSelectCategory ? 'button' : undefined}
              tabIndex={onSelectCategory ? 0 : undefined}
              onClick={() => onSelectCategory?.('sculptural-bracelets')}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelectCategory) {
                  e.preventDefault();
                  onSelectCategory('sculptural-bracelets');
                }
              }}
              data-cursor="image"
              data-cursor-text="EXPLORE"
              className="relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs w-full aspect-square shrink-0 cursor-pointer focus:outline-hidden"
            >
              <ImageWithSkeleton
                id="mosaic-img-bracelets"
                src={colBracelets.image}
                alt={colBracelets.title || 'Sculptural Bracelets'}
                aspectRatio="1/1"
                skeletonLabel="SCULPTURAL BRACELETS"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                containerClassName="w-full h-full aspect-square"
                fallbackSrc="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=85"
              />
            </div>

            {/* BOTTOM: Images 3 & 4 side by side -> Fills remaining height to align bottom perfectly */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0">
              
              {/* Image 3 */}
              <div
                id="mosaic-necklaces"
                role={onSelectCategory ? 'button' : undefined}
                tabIndex={onSelectCategory ? 0 : undefined}
                onClick={() => onSelectCategory?.('medallion-necklaces')}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onSelectCategory) {
                    e.preventDefault();
                    onSelectCategory('medallion-necklaces');
                  }
                }}
                data-cursor="image"
                data-cursor-text="EXPLORE"
                className="relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full flex flex-col cursor-pointer focus:outline-hidden"
              >
                <ImageWithSkeleton
                  id="mosaic-img-necklaces"
                  src={colNecklaces.image}
                  alt={colNecklaces.title || 'Medallion Necklaces'}
                  skeletonLabel="NECKLACES"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                  containerClassName="w-full h-full min-h-[140px] sm:min-h-[180px]"
                  fallbackSrc="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85"
                />
              </div>

              {/* Image 4 */}
              <div
                id="mosaic-earrings"
                role={onSelectCategory ? 'button' : undefined}
                tabIndex={onSelectCategory ? 0 : undefined}
                onClick={() => onSelectCategory?.('drop-hoop-earrings')}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onSelectCategory) {
                    e.preventDefault();
                    onSelectCategory('drop-hoop-earrings');
                  }
                }}
                data-cursor="image"
                data-cursor-text="EXPLORE"
                className="relative overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full flex flex-col cursor-pointer focus:outline-hidden"
              >
                <ImageWithSkeleton
                  id="mosaic-img-earrings"
                  src={colEarrings.image}
                  alt={colEarrings.title || 'Drop and Hoop Earrings'}
                  skeletonLabel="EARRINGS"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                  containerClassName="w-full h-full min-h-[140px] sm:min-h-[180px]"
                  fallbackSrc="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85"
                />
              </div>

            </div>

          </div>

          {/* ========================================================== */}
          {/* 3. RIGHT COLUMN: Image 5 -> 9:16 RATIO                     */}
          {/* ========================================================== */}
          <div 
            id="mosaic-charms"
            role={onSelectCategory ? 'button' : undefined}
            tabIndex={onSelectCategory ? 0 : undefined}
            onClick={() => onSelectCategory?.('shop-charms')}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onSelectCategory) {
                e.preventDefault();
                onSelectCategory('shop-charms');
              }
            }}
            data-cursor="image"
            data-cursor-text="EXPLORE"
            className="md:col-span-4 relative flex flex-col overflow-hidden bg-[#F7F4F0] rounded-xs shadow-xs h-full cursor-pointer focus:outline-hidden"
          >
            {/* Aspect Ratio 9:16 with skeleton loader */}
            <ImageWithSkeleton
              id="mosaic-img-charms"
              src={colCharms.image}
              alt={colCharms.title || 'Shop Charms'}
              aspectRatio="9/16"
              skeletonLabel="SHOP CHARMS"
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-102"
              containerClassName="w-full h-full aspect-[9/16]"
              fallbackSrc="https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=85"
            />
          </div>

        </div>

      </div>
    </section>
  );
};
