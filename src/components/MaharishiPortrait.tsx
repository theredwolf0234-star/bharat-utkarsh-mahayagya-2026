import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBlessing?: boolean;
}

export const MaharishiPortrait: React.FC<Props> = ({
  className = '',
  size = 'md',
  showBlessing = true,
}) => {
  const sizeClasses = {
    sm: 'w-20 h-28',
    md: 'w-32 h-44',
    lg: 'w-44 h-60',
    xl: 'w-56 h-76',
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Outer Golden Oval Medallion */}
      <div
        className={`${sizeClasses[size]} relative rounded-[50%] p-1.5 shadow-xl transition-transform hover:scale-[1.02]`}
        style={{
          background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 50%, #f3e5ab 75%, #8c6200 100%)',
          boxShadow: '0 8px 24px rgba(140, 98, 0, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
        }}
      >
        {/* Inner Golden Rim */}
        <div className="w-full h-full rounded-[50%] p-1 bg-[#441016] overflow-hidden relative border border-[#f5d77f]">
          {/* Portrait Image with fallback to rich SVG representation */}
          <img
            src="image.png"
            alt="परम पूज्य महर्षि महेश योगी जी"
            className="w-full h-full object-cover rounded-[50%] filter contrast-[1.05]"
            onError={(e) => {
              // Graceful fallback to Wikimedia high-res / spiritual vector portrait
              (e.target as HTMLImageElement).src =
                'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Maharishi_Mahesh_Yogi_1973.jpg/440px-Maharishi_Mahesh_Yogi_1973.jpg';
            }}
          />
          {/* Subtle Golden Sheen overlay */}
          <div
            className="absolute inset-0 rounded-[50%] pointer-events-none opacity-20"
            style={{
              background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8), transparent 70%)',
            }}
          />
        </div>
      </div>

      {showBlessing && (
        <div className="text-center mt-2 space-y-0.5">
          <div className="text-xs sm:text-sm font-bold font-heading text-amber-900 leading-tight">
            परम पूज्य महर्षि महेश योगी जी
          </div>
          <div className="text-[10px] text-amber-800/80 font-medium">
            संस्थापक एवं दिव्य प्रणेता
          </div>
        </div>
      )}
    </div>
  );
};
