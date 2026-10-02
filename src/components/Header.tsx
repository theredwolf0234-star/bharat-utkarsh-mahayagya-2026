import React from 'react';
import { Flame, Ticket, MapPin, Sparkles } from 'lucide-react';
import { DevoteeUser } from '../types/yagya';
import { YAGYA_LOCATION_MAP_URL } from '../constants/yagya';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  currentUser: DevoteeUser | null;
  onStartBooking: (kundNum?: number | null) => void;
  onOpenStatusLookup: () => void;
  onOpenIntroSlides?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  currentStep,
  setCurrentStep,
  currentUser,
  onStartBooking,
  onOpenStatusLookup,
  onOpenIntroSlides,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#240608] text-amber-100 border-b-2 border-amber-600/50 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Brand Logo & Event Name */}
        <button
          type="button"
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 sm:gap-3 hover:opacity-95 transition-opacity text-left cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md border border-amber-300/40 shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-200 text-amber-100" />
          </div>
          <div className="min-w-0">
            <span className="font-serif font-black text-xs min-[360px]:text-sm sm:text-xl text-amber-200 tracking-wide block leading-tight whitespace-nowrap">
              भारत उत्कर्ष महायज्ञ 2026
            </span>
            <span className="text-[11px] text-amber-300/80 font-medium hidden sm:block">
              "राष्ट्र के उत्कर्ष में ही आपका उत्कर्ष" • 108 हवन कुंड बुकिंग
            </span>
          </div>
        </button>

        {/* User Nav Items (Dedicated for Devotees only) */}
        <nav className="flex items-center gap-1 sm:gap-2 text-[11px] min-[360px]:text-xs sm:text-sm font-medium shrink-0">
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className={`px-1.5 min-[360px]:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'home'
                ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-400/40 shadow-sm'
                : 'text-stone-300 hover:text-amber-200 hover:bg-black/30'
            }`}
          >
            मुख्य पृष्ठ
          </button>

          <button
            type="button"
            onClick={() => onStartBooking(null)}
            className={`px-1.5 min-[360px]:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              currentView === 'register'
                ? 'bg-[#8a1523] text-white font-bold border border-amber-400/60 shadow-sm'
                : 'text-stone-300 hover:text-amber-200 hover:bg-black/30'
            }`}
          >
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 shrink-0" />
            <span className="hidden sm:inline">हवन कुंड बुकिंग</span>
            <span className="sm:hidden">बुकिंग</span>
          </button>

          {onOpenIntroSlides && (
            <button
              type="button"
              onClick={onOpenIntroSlides}
              className="flex items-center gap-1 px-1.5 min-[360px]:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/40 hover:to-orange-600/40 text-amber-200 border border-amber-400/40 whitespace-nowrap"
              title="महायज्ञ पावन आमंत्रण एवं आकर्षण देखें"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
              <span className="hidden sm:inline">पावन आमंत्रण</span>
              <span className="sm:hidden">पत्रिका</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStatusLookup}
            className="flex items-center gap-1 px-1.5 min-[360px]:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-400/30 whitespace-nowrap"
            title="अपनी बुकिंग व भुगतान स्थिति जांचें"
          >
            <span className="text-amber-300 font-bold text-xs sm:text-sm">🔍</span>
            <span className="hidden md:inline">स्थिति जांचें</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('tickets')}
            className={`flex items-center gap-1 sm:gap-1.5 px-1.5 min-[360px]:px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'tickets'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30'
            }`}
          >
            <Ticket className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>{currentUser ? currentUser.fullName.split(' ')[0] : 'मेरी बुकिंग'}</span>
          </button>

          <a
            href={YAGYA_LOCATION_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1 text-stone-300 hover:text-amber-200 transition-colors px-2 py-1 rounded-lg hover:bg-black/30"
            title="Google Maps पर यज्ञ स्थल"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>स्थल मार्ग</span>
          </a>
        </nav>
      </div>

      {/* Hawan Kund Booking Flow Stepper */}
      {currentView === 'register' && (
        <div className="bg-[#fcf5e9] border-t border-b border-[#e8d8be] py-2 px-2 sm:px-3 text-stone-800 overflow-x-auto no-scrollbar">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 min-w-max sm:min-w-0 text-xs sm:text-sm font-semibold">
            {[
              { num: 1, label: '1. यजमान व साधक खाता' },
              { num: 2, label: '2. कुंड व तिथि' },
              { num: 3, label: '3. यू.पी.आई. दक्षिणा व UTR' },
              { num: 4, label: '4. प्रशासक सत्यापन व पास' },
            ].map((st) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => (isPassed || isCurrent) && setCurrentStep(st.num)}
                  className={`flex items-center gap-1.5 transition-all text-left whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'text-[#872e18] font-bold border-b-2 border-[#872e18] pb-0.5'
                      : isPassed
                      ? 'text-stone-700 hover:text-stone-900 cursor-pointer'
                      : 'text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-[#872e18] text-white'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-300 text-stone-600'
                    }`}
                  >
                    {isPassed ? '✓' : st.num}
                  </span>
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
