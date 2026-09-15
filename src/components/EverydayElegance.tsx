import React from 'react';
import { Accessory } from '../types';
import { useSiteContent } from '../context/SiteContentContext';

interface EverydayEleganceProps {
  onSelectPiece: (piece: Accessory) => void;
}

export const EverydayElegance: React.FC<EverydayEleganceProps> = ({ onSelectPiece }) => {
  const { content } = useSiteContent();
  const products = content?.products || [];

  return (
    <section
      id="everyday-elegance"
      aria-label="Everyday Elegance Collection"
      className="w-full bg-[#FFFFFF] py-12 sm:py-16 md:py-20"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Centered Serif Heading */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-[38px] font-normal text-[#2A2323] tracking-wide">
            Everyday Elegance
          </h2>
        </div>

        {/* 4 Square Items Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {products.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                onSelectPiece({
                  id: item.id,
                  refCode: `SB-${item.id.slice(-3).toUpperCase()}`,
                  name: item.name,
                  tagline: item.tagline,
                  description: item.description,
                  category: 'jewelry',
                  categoryLabel: 'Everyday Elegance',
                  image: item.image,
                  badge: item.badge,
                  materials: item.materials,
                  dimensions: item.dimensions,
                  craftsmanship: item.craftsmanship,
                  stylingNote: 'Curated for daily wear, pairing seamlessly with tailoring and knitwear.',
                })
              }
              className="group cursor-pointer relative aspect-square bg-[#F7F4F0] overflow-hidden"
            >
              {/* Product Image */}
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
                referrerPolicy="no-referrer"
              />

              {/* Top-Left Small Orange/Coral Badge */}
              {item.badge && (
                <div className="absolute top-2.5 left-2.5 bg-[#EE6B4D] text-[#FFFFFF] text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 shadow-xs">
                  {item.badge}
                </div>
              )}


              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-[#332B2B]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#332B2B] bg-[#FFFFFF]/90 px-3 py-1 font-medium shadow-xs">
                  Discover Piece
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
