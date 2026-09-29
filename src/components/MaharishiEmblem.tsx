import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const MaharishiEmblem: React.FC<Props> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Circular Emblem Container */}
      <div
        className={`${sizeClasses[size]} relative rounded-full p-2 shadow-2xl transition-transform hover:scale-[1.02] flex items-center justify-center`}
        style={{
          background: 'radial-gradient(circle, #f39c12 0%, #d35400 70%, #962d00 100%)',
          boxShadow: '0 10px 30px rgba(180, 70, 0, 0.4), inset 0 2px 6px rgba(255, 235, 150, 0.7)',
        }}
      >
        {/* Render uploaded image if available */}
        <img
          src="image.png"
          alt="भारत उत्कर्ष महायज्ञ"
          className="w-full h-full object-contain rounded-full drop-shadow-md"
          onError={(e) => {
            // If direct image.png is not found, render high-fidelity SVG badge
            const target = e.target as HTMLElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />

        {/* High-Fidelity SVG Fallback matching Image 2 */}
        <div className="hidden w-full h-full flex-col items-center justify-center text-center relative">
          {/* Header Curved Text */}
          <div className="text-[13px] sm:text-base font-black font-heading text-amber-950 tracking-wider drop-shadow-sm mb-1">
            भारत उत्कर्ष
          </div>

          {/* Hawan Kund & Sacred Flame Icon */}
          <div className="text-2xl sm:text-3xl animate-pulse my-0.5">
            🔥
          </div>

          {/* Golden Subheading */}
          <div className="text-[9px] sm:text-[11px] font-bold text-white bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm mt-0.5">
            परम पूज्य महर्षि महेश योगी जी
          </div>

          {/* 3D Golden Devnagari महायज्ञ */}
          <div
            className="text-xl sm:text-3xl font-black font-heading mt-1 tracking-widest text-[#ffe600] uppercase"
            style={{
              textShadow: '0 2px 0 #b37400, 0 4px 0 #7a4f00, 0 6px 12px rgba(0,0,0,0.6)',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
            }}
          >
            महायज्ञ
          </div>
        </div>
      </div>

      {showSubtitle && (
        <div className="text-center mt-2.5 space-y-0.5">
          <div className="text-xs sm:text-sm font-bold text-[#8a1523] uppercase tracking-wider">
            आधिकारिक महायज्ञ प्रतीक चिह्न
          </div>
          <div className="text-[11px] text-stone-600">
            १०८ कुण्डीय राष्ट्र कल्याण महायज्ञ
          </div>
        </div>
      )}
    </div>
  );
};
