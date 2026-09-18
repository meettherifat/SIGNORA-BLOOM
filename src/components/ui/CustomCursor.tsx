import React, { useEffect, useState, useRef } from 'react';

export type CursorVariant = 'default' | 'button' | 'image' | 'link' | 'hidden';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [cursorText, setCursorText] = useState<string>('');

  // Target coordinates for smooth lag effect
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Only initialize custom cursor on devices supporting fine pointer (mouse/trackpad), not touch screens
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const updateFinePointer = () => setIsFinePointer(mediaQuery.matches);
    updateFinePointer();
    mediaQuery.addEventListener('change', updateFinePointer);

    return () => {
      mediaQuery.removeEventListener('change', updateFinePointer);
    };
  }, []);

  useEffect(() => {
    if (!isFinePointer) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check current target under cursor
      const target = e.target as HTMLElement | null;
      if (!target) {
        setVariant('default');
        setCursorText('');
        return;
      }

      // Check for custom cursor attributes or closest interactive containers
      const customCursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      if (customCursorEl) {
        const type = customCursorEl.getAttribute('data-cursor') as CursorVariant;
        setVariant(type || 'button');
        setCursorText(customCursorEl.getAttribute('data-cursor-text') || '');
        return;
      }

      // Interactive buttons, tabs, links
      const isInteractiveButton = !!target.closest('button, [role="button"], input[type="submit"], input[type="button"]');
      const isInteractiveLink = !!target.closest('a');
      const isInput = !!target.closest('input, textarea, select, [contenteditable="true"]');

      // Gallery / editorial image surfaces
      const isImageOrMedia = !!target.closest(
        'img, picture, [data-cursor-image], [aria-label*="Collection"], [id^="mosaic-"], [id^="product-elegance-"], [aria-label*="Gift Box"]'
      );

      if (isInput) {
        setVariant('hidden');
        setCursorText('');
      } else if (isInteractiveButton) {
        setVariant('button');
        setCursorText('');
      } else if (isInteractiveLink) {
        setVariant('link');
        setCursorText('');
      } else if (isImageOrMedia) {
        setVariant('image');
        setCursorText('VIEW');
      } else {
        setVariant('default');
        setCursorText('');
      }
    };

    const handleMouseDown = () => setIsPointerDown(true);
    const handleMouseUp = () => setIsPointerDown(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
      setVariant('default');
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    // Smooth RAF loop for subtle trailing physics
    const loop = () => {
      if (prefersReducedMotion) {
        currentPos.current = { ...targetPos.current };
      } else {
        // High-end lerp factor (0.22 creates an ultra-responsive yet soft kinetic trail)
        const lerpFactor = 0.22;
        currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerpFactor;
        currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerpFactor;
      }

      setPosition({
        x: currentPos.current.x,
        y: currentPos.current.y,
      });

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isFinePointer, isVisible]);

  if (!isFinePointer || !isVisible || variant === 'hidden') {
    return null;
  }

  // Exact coordinates of cursor dot (follows mouse exactly without lag)
  const exactX = targetPos.current.x;
  const exactY = targetPos.current.y;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
    >
      {/* 1. Precision Center Dot: Immediate response, warm espresso/gold tone */}
      <div
        className={`fixed top-0 left-0 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-transform duration-150 ease-out ${
          variant === 'image'
            ? 'scale-0 opacity-0'
            : isPointerDown
            ? 'scale-75 bg-[#C97A63]'
            : variant === 'button' || variant === 'link'
            ? 'scale-125 bg-[#8C6D4F]'
            : 'bg-[#332B2B]/85'
        }`}
        style={{
          transform: `translate3d(${exactX}px, ${exactY}px, 0)`,
        }}
      />

      {/* 2. Kinetic Editorial Ring & Badge */}
      <div
        className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none flex items-center justify-center transition-all duration-300 ease-out will-change-transform ${
          variant === 'default'
            ? 'w-8 h-8 border border-[#B89B82]/40 bg-transparent'
            : variant === 'button'
            ? 'w-11 h-11 border border-[#8C6D4F]/80 bg-[#8C6D4F]/10 backdrop-blur-[0.5px] scale-100'
            : variant === 'link'
            ? 'w-10 h-10 border border-[#C97A63]/80 bg-[#C97A63]/10 scale-100'
            : variant === 'image'
            ? 'w-16 h-16 border border-[#FFFFFF]/80 bg-[#2A2323]/75 backdrop-blur-[2px] shadow-[0_8px_20px_rgba(42,35,35,0.25)] text-white'
            : 'w-7 h-7 border border-[#B89B82]/30'
        } ${isPointerDown ? 'scale-90 opacity-90' : 'opacity-100'}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        }}
      >
        {/* Subtle typography badge when hovering jewelry imagery */}
        {variant === 'image' && (
          <span className="text-[9px] font-sans tracking-[0.24em] font-medium uppercase text-[#FAF5EE] select-none scale-90">
            {cursorText || 'VIEW'}
          </span>
        )}
      </div>
    </div>
  );
};
