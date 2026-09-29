import React from 'react';
import { MapPin, Lock } from 'lucide-react';
import { VENUE_ADDRESS, YAGYA_LOCATION_MAP_URL } from '../constants/yagya';

interface FooterProps {
  onGoHome: () => void;
  onStartBooking: () => void;
  onOpenTickets: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onGoHome,
  onStartBooking,
  onOpenTickets,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#1a0406] text-amber-100 py-8 border-t-2 border-[#4a0e17] text-xs">
      <div className="max-w-5xl mx-auto px-4 space-y-5">
        <div className="text-center space-y-1">
          <div className="text-amber-200 font-bold font-serif text-lg">
            श्री महर्षि वेदविज्ञान संस्थान • भारत उत्कर्ष महायज्ञ 2026
          </div>
          <div className="text-amber-300/80 text-xs">
            "राष्ट्र के उत्कर्ष में ही आपका उत्कर्ष" • 108 हवन कुंड महायज्ञ
          </div>
          <div className="text-stone-400 text-[11px] flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{VENUE_ADDRESS}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-stone-300">
          <button onClick={onGoHome} className="hover:text-amber-200 cursor-pointer">
            मुख्य पृष्ठ
          </button>
          <span>•</span>
          <button onClick={onStartBooking} className="hover:text-amber-200 cursor-pointer">
            हवन कुंड आरक्षण
          </button>
          <span>•</span>
          <button onClick={onOpenTickets} className="hover:text-amber-200 cursor-pointer">
            मेरी बुकिंग एवं पास
          </button>
          <span>•</span>
          <a href={YAGYA_LOCATION_MAP_URL} target="_blank" rel="noreferrer" className="hover:text-amber-200">
            यज्ञ स्थल मार्ग (GPS)
          </a>
        </div>

        {/* DEDICATED HIGHLIGHTED ADMIN LINK */}
        <div className="pt-4 border-t border-[#3d0d12] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-stone-400 text-[11px]">
            © 2026 महर्षि भारत उत्कर्ष महायज्ञ। सर्वाधिकार सुरक्षित।
          </div>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-[#8a1523] via-[#b31b2c] to-[#8a1523] hover:from-[#a11b2b] hover:to-[#70101b] text-amber-200 font-bold rounded-xl shadow-lg border-2 border-amber-400/90 transition-all transform hover:scale-[1.02] cursor-pointer text-xs sm:text-sm"
            title="केवल अधिकृत व्यवस्थापक हेतु"
          >
            <div className="w-6 h-6 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span>व्यवस्थापक / प्रशासक लॉगिन (Admin & Database Portal)</span>
            <span className="bg-amber-300 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
              पासवर्ड सुरक्षित
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};
