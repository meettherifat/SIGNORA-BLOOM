import React from 'react';
import { useSiteContent } from '../context/SiteContentContext';

interface EverydayEleganceProps {
  onSelectPiece?: (piece: any) => void;
}

export const EverydayElegance: React.FC<EverydayEleganceProps> = () => {
  const { content } = useSiteContent();
  const products = (content?.products || []).slice(0, 4);

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

        {/* 4 Square Items Row: Completely clean images without any badges, discount text, boxes, or links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {products.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square bg-[#F7F4F0] overflow-hidden select-none cursor-default"
            >
              {/* Product Image - Pure, clean, uninterrupted luxury imagery */}
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-102"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=85';
                }}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
