import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Accessory } from '../types';

interface ProductDetailModalProps {
  accessory: Accessory | null;
  onClose: () => void;
  onInquire: (accessory: Accessory) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  accessory,
  onClose,
  onInquire,
}) => {
  if (!accessory) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#332B2B]/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#F8F2EC] max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E8DFD5] shadow-2xl relative flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-detail-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#736767] hover:text-[#332B2B] transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Large Pure Image */}
        <div className="md:w-1/2 bg-[#FAF6F1] p-6 sm:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#E8DFD5]">
          <div className="relative w-full aspect-square overflow-hidden bg-[#FAF6F1] border border-[#E8DFD5]">
            <img
              src={accessory.image}
              alt={accessory.name}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right: Editorial Information & Inquire Action */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] tracking-[0.24em] uppercase text-[#736767] block mb-2">
              SIGNORA BLOOM · EDITORIAL ARCHIVE
            </span>

            <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#332B2B] leading-tight mb-2">
              {accessory.name}
            </h3>

            <p className="font-serif text-sm italic text-[#8E8080] mb-4">
              {accessory.tagline}
            </p>

            <p className="text-xs sm:text-sm text-[#524747] leading-relaxed mb-6 font-sans">
              {accessory.description}
            </p>

            <div className="space-y-2 pt-4 border-t border-[#EDE4D9] text-xs text-[#736767]">
              <div>
                <span className="font-medium text-[#332B2B] uppercase tracking-wider text-[10px] block">
                  Materials
                </span>
                <span>{accessory.materials.join(', ')}</span>
              </div>
              <div className="pt-2">
                <span className="font-medium text-[#332B2B] uppercase tracking-wider text-[10px] block">
                  Atelier Craftsmanship
                </span>
                <span>{accessory.craftsmanship}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EDE4D9]">
            <button
              id="modal-inquire-btn"
              onClick={() => onInquire(accessory)}
              className="w-full py-3.5 border border-[#332B2B] text-[#332B2B] hover:bg-[#332B2B] hover:text-[#F8F2EC] text-[11px] tracking-[0.22em] uppercase transition-all duration-300 font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>INQUIRE ABOUT THIS PIECE</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
