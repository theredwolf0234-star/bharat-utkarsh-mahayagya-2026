import React, { useState } from 'react';
import {
  Flame,
  Ticket,
  MapPin,
  ArrowLeft,
  Smartphone,
  Menu,
  X,
  User,
  Search,
  Home,
  Shield,
  ExternalLink,
  ChevronRight,
  LogOut,
} from 'lucide-react';
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
  onOpenAdmin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  currentStep,
  setCurrentStep,
  currentUser,
  onStartBooking,
  onOpenStatusLookup,
  onOpenAdmin,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#240608] text-amber-100 border-b-2 border-amber-600/50 shadow-md safe-top w-full max-w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3 w-full">
        {/* Brand Logo & Event Name */}
        <button
          type="button"
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-95 transition-opacity text-left cursor-pointer min-w-0 shrink"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#2c090c] border-2 border-amber-400 shadow-md ring-1 ring-amber-300/40 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="भारत उत्कर्ष महायज्ञ लोगो"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="hidden w-full h-full items-center justify-center bg-gradient-to-tr from-amber-600 to-orange-500">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-200 text-amber-100" />
            </div>
          </div>
          <div className="min-w-0 truncate">
            <span className="font-serif font-black text-xs min-[360px]:text-sm sm:text-xl text-amber-200 tracking-wide block leading-tight truncate">
              <span className="hidden min-[380px]:inline">भारत उत्कर्ष महायज्ञ 2026</span>
              <span className="min-[380px]:hidden inline">भारत उत्कर्ष 2026</span>
            </span>
            <span className="text-[11px] text-amber-300/80 font-medium hidden md:block truncate">
              108 हवन कुंड बुकिंग पोर्टल • रामलीला मैदान, महर्षि आश्रम, नोएडा
            </span>
          </div>
        </button>

        {/* Clean Top Action Bar - Perfectly Aligned, No Floating, No Cut-Off */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Direct Hawan Kund Booking CTA */}
          <button
            type="button"
            onClick={() => onStartBooking(null)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-xl transition-all cursor-pointer font-extrabold text-xs sm:text-sm whitespace-nowrap shadow-sm shrink-0 ${
              currentView === 'register'
                ? 'bg-[#8a1523] text-white border-2 border-amber-400'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 border border-amber-300'
            }`}
            title="108 हवन कुंड ऑनलाइन बुक करें"
          >
            <Flame className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="hidden min-[480px]:inline">हवन कुंड बुकिंग</span>
            <span className="min-[480px]:hidden">बुक करें</span>
          </button>

          {/* Direct APK Download Button - Visible on screens >= 640px (sm:) */}
          {/* On mobile screens, APK download is prominently available in the Menu Dropdown & Hero Section without cramming the 360px header */}
          <a
            href="/yagya2026.apk"
            download="Bharat-Utkarsh-Mahayagya-2026.apk"
            className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold border border-emerald-400/50 shadow-sm whitespace-nowrap text-xs sm:text-sm shrink-0"
            title="एंड्रॉयड ऐप डाउनलोड करें (Direct APK)"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>📱 ऐप</span>
          </a>

          {/* Sleek Profile & Menu Bar Button - Always fully visible, never clipped at screen edge */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer border shadow-xs text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 ${
                isMenuOpen
                  ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
              }`}
              title="यजमान प्रोफाइल एवं मेन्यू"
              aria-label="Toggle Navigation Menu"
            >
              <div className="w-5 h-5 rounded-full bg-amber-400/30 flex items-center justify-center text-amber-200 shrink-0">
                <User className="w-3 h-3 text-current" />
              </div>
              <span className="hidden min-[440px]:inline max-w-[80px] sm:max-w-[120px] truncate">
                {currentUser ? currentUser.fullName.split(' ')[0] : 'प्रोफाइल'}
              </span>
              {isMenuOpen ? (
                <X className="w-3.5 h-3.5 text-current shrink-0" />
              ) : (
                <Menu className="w-3.5 h-3.5 text-current shrink-0" />
              )}
            </button>

            {/* Profile & Menu Dropdown Modal */}
            {isMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Dropdown Card */}
                <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-16 z-50 w-[calc(100vw-16px)] max-w-xs sm:w-80 bg-stone-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden text-stone-100 max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Devotee Profile Header */}
                  <div className="bg-gradient-to-r from-[#4a0e17] to-[#240608] p-3.5 border-b border-amber-600/40 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-bold shadow-md border border-amber-300/60 shrink-0">
                        <User className="w-5 h-5 text-stone-950" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-sm text-amber-200 truncate">
                          {currentUser ? currentUser.fullName : 'यजमान प्रोफाइल'}
                        </h4>
                        <p className="text-xs text-amber-300/80 truncate">
                          {currentUser ? `मो: ${currentUser.mobile}` : 'पंजीकरण एवं ई-पास पोर्टल'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="p-2 space-y-1 text-xs sm:text-sm overflow-y-auto flex-1">
                    <button
                      type="button"
                      onClick={() => handleNav(() => setCurrentView('home'))}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-stone-200 hover:text-amber-200 transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Home className="w-4 h-4 text-amber-400" />
                        <span>मुख्य पृष्ठ (Home)</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNav(() => onStartBooking(null))}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-stone-200 hover:text-amber-200 transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>108 हवन कुंड बुकिंग</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNav(() => setCurrentView('tickets'))}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-stone-200 hover:text-amber-200 transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Ticket className="w-4 h-4 text-amber-400" />
                        <span>मेरी बुकिंग व डिजिटल पास</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNav(onOpenStatusLookup)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-stone-200 hover:text-amber-200 transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Search className="w-4 h-4 text-amber-400" />
                        <span>आरक्षण व भुगतान स्थिति जांचें</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                    </button>

                    <a
                      href={YAGYA_LOCATION_MAP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-stone-200 hover:text-amber-200 transition-colors cursor-pointer text-left"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        <span>यज्ञ स्थल मार्ग (Google Maps)</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                    </a>

                    <a
                      href="/yagya2026.apk"
                      download="Bharat-Utkarsh-Mahayagya-2026.apk"
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 transition-colors cursor-pointer text-left border border-emerald-600/40"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span>📱 एंड्रॉयड ऐप डाउनलोड (.apk)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500 text-stone-950 px-1.5 py-0.5 rounded font-bold">
                        4.2 MB
                      </span>
                    </a>

                    {onOpenAdmin && (
                      <button
                        type="button"
                        onClick={() => handleNav(onOpenAdmin)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-stone-300 hover:text-amber-200 transition-colors cursor-pointer text-left border-t border-stone-800 mt-1 pt-2.5"
                      >
                        <span className="flex items-center gap-2.5">
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>व्यवस्थापक लॉगिन (Admin)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    )}

                    {currentUser && onLogout && (
                      <button
                        type="button"
                        onClick={() => handleNav(onLogout)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-rose-950/60 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer text-left border-t border-stone-800/80 mt-1 pt-2.5"
                      >
                        <span className="flex items-center gap-2.5">
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>साधक लॉग आउट (Logout)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hawan Kund Booking Flow Stepper with Previous Arrow (Only shown during active booking) */}
      {currentView === 'register' && (
        <div className="bg-[#fcf5e9] border-t border-b border-[#e8d8be] py-2 px-2 sm:px-3 text-stone-800 overflow-x-auto no-scrollbar">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3 min-w-max sm:min-w-0 text-xs sm:text-sm font-semibold">
            {/* Previous Arrow Button */}
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(1);
                } else {
                  setCurrentView('home');
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-white hover:bg-amber-100 text-[#872e18] border border-amber-300 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 group"
              title="पिछले पृष्ठ पर जाएं"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>पिछला (Previous)</span>
            </button>
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
