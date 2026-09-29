import React from 'react';
import { Flame, Search, Lock, Globe, Database, Beaker, Ticket, User, MapPin } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { DevoteeUser, YAGYA_LOCATION_MAP_URL } from '../types/yagya';

interface Props {
  currentView: 'home' | 'register' | 'lookup' | 'admin' | 'database' | 'map' | 'tickets';
  onNavigate: (view: 'home' | 'register' | 'lookup' | 'admin' | 'database' | 'map' | 'tickets') => void;
  currentStep?: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isTestMode?: boolean;
  currentUser?: DevoteeUser | null;
}

export const VedicHeader: React.FC<Props> = ({
  currentView,
  onNavigate,
  currentStep = 1,
  onStepClick,
  lang,
  onLanguageChange,
  isTestMode = false,
  currentUser = null,
}) => {
  const t = translations[lang] || translations.hi;

  const steps = [
    { num: 1, label: t.step1 },
    { num: 2, label: t.step2 },
    { num: 3, label: t.step3 },
    { num: 4, label: t.step4 },
  ];

  return (
    <header className="no-print w-full sticky top-0 z-40 shadow-md">
      {/* Test Mode Banner if active */}
      {isTestMode && (
        <div className="bg-amber-500 text-stone-950 font-bold px-4 py-1 text-center text-xs flex items-center justify-center gap-2 border-b border-amber-600 shadow-inner">
          <Beaker className="w-3.5 h-3.5" />
          <span>{t.testModeBanner}</span>
        </div>
      )}

      {/* Top Navbar */}
      <div className="bg-[#240608] text-amber-100 border-b border-[#3d0d12]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          {/* Left Brand */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-4 h-4 fill-amber-200 text-amber-100" />
            </div>
            <div>
              <span className="font-heading font-bold text-sm sm:text-base text-amber-200 tracking-wide block leading-tight">
                {t.appName}
              </span>
              <span className="text-[10px] text-amber-300/70 hidden md:block">
                {t.tagline}
              </span>
            </div>
          </button>

          {/* Right Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3.5 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`transition-colors cursor-pointer px-2 py-1 rounded-md ${
                currentView === 'home'
                  ? 'text-amber-300 font-bold underline underline-offset-4'
                  : 'text-stone-300 hover:text-amber-200'
              }`}
            >
              {t.homeTab}
            </button>

            {/* Devotee Login / My Tickets Tab */}
            <button
              type="button"
              onClick={() => onNavigate('tickets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'tickets'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30'
              }`}
              title="मेरे प्रवेश पत्र एवं यजमान लॉगिन"
            >
              {currentUser ? (
                <>
                  <User className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="max-w-[100px] sm:max-w-none truncate font-bold">
                    {currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'पास'} के टिकट
                  </span>
                </>
              ) : (
                <>
                  <Ticket className="w-3.5 h-3.5 shrink-0" />
                  <span>प्रवेश पत्र / लॉगिन</span>
                </>
              )}
            </button>

            {/* Google Maps Location Link */}
            <a
              href={YAGYA_LOCATION_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1 text-stone-300 hover:text-amber-200 transition-colors px-2 py-1"
              title="गूगल मैप्स लाइव लोकेशन"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>नोएडा आश्रम मैप</span>
            </a>

            <button
              type="button"
              onClick={() => onNavigate('database')}
              className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentView === 'database'
                  ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/50 shadow-xs'
                  : 'text-stone-300 hover:text-amber-200 hover:bg-black/30'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{t.databaseTab}</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1 py-0.2 rounded font-mono font-semibold">
                SQL
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-md ${
                currentView === 'admin'
                  ? 'text-amber-300 font-bold underline underline-offset-4'
                  : 'text-stone-300 hover:text-amber-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t.adminPortal}</span>
              <span className="sm:hidden">व्यवस्थापक</span>
            </button>

            {/* Language dropdown (Always visible & interactive on all screen sizes) */}
            <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-md border border-amber-500/40 text-xs shadow-inner">
              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={lang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-transparent text-amber-200 text-xs font-bold focus:outline-hidden cursor-pointer"
                title="भाषा बदलें / Select Language"
              >
                <option value="hi" className="bg-[#240608] text-white">हिन्दी (HI)</option>
                <option value="en" className="bg-[#240608] text-white">English (EN)</option>
                <option value="sa" className="bg-[#240608] text-white">संस्कृतम् (SA)</option>
                <option value="gu" className="bg-[#240608] text-white">ગુજરાતી (GU)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper when in Registration / Payment Flow */}
      {currentView === 'register' && (
        <div className="bg-[#fcf5e9] border-b border-[#e8d8be] shadow-2xs py-2 px-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between text-xs sm:text-sm font-semibold">
            {steps.map((st) => {
              const isPassed = currentStep > st.num;
              const isCurrent = currentStep === st.num;

              return (
                <button
                  key={st.num}
                  type="button"
                  disabled={!isPassed && !isCurrent}
                  onClick={() => onStepClick && onStepClick(st.num as any)}
                  className={`flex items-center gap-1.5 transition-all text-left ${
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
                  <span className="truncate max-w-[70px] sm:max-w-none">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
