import React from 'react';
import { Registration, TOTAL_KUNDS, RESERVED_KUNDS_COUNT, YAGYA_LOCATION_MAP_URL } from '../types/yagya';
import { computeKundStatuses } from '../utils/kundAvailability';
import { Flame, Calendar, MapPin, Sparkles, Printer, UserCheck, ShieldCheck, ArrowRight, ExternalLink, Ticket, Lock } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface Props {
  registrations: Registration[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onStartRegistration: () => void;
  onOpenLookup: () => void;
  onOpenTickets?: () => void;
  onOpenSlip?: (reg: Registration) => void;
  lang?: Language;
}

export const HomeTab: React.FC<Props> = ({
  registrations,
  selectedDate,
  onStartRegistration,
  onOpenLookup,
  onOpenTickets,
  lang = 'hi',
}) => {
  const t = translations[lang] || translations.hi;

  const summary = computeKundStatuses(registrations, selectedDate, 2);
  const totalBookedKunds = summary.kundList.filter(
    (k) => !k.isReserved && k.bookedCount > 0
  ).length;
  const totalAvailableKunds = summary.totalAvailable;

  return (
    <div className="w-full pb-12 font-sans bg-[#faf5eb] min-h-screen">
      {/* 1. Hero Section */}
      <div 
        className="w-full text-white text-center py-10 sm:py-16 px-4 shadow-lg relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #99371d 0%, #7d2a15 50%, #44120c 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-center gap-1.5 text-pink-200 text-sm sm:text-base font-medium">
            <span>🌸</span>
            <span>जय गुरुदेव</span>
            <span>🌸</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-normal drop-shadow-md">
            {t.appName}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm pt-1">
            <div className="bg-black/30 backdrop-blur-xs border border-white/20 rounded-full px-4 py-1.5 text-stone-100 shadow-inner">
              <span className="font-medium">"{t.tagline}"</span>
              <span className="mx-2 text-amber-300">—</span>
              <span className="font-bold">{t.eventDates}</span>
            </div>

            <div className="bg-black/30 backdrop-blur-xs border border-white/20 rounded-full px-3.5 py-1.5 text-stone-100 flex items-center gap-1.5 shadow-inner">
              <span className="text-orange-400">🔥</span>
              <span>{t.totalKunds}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <button
              type="button"
              onClick={onStartRegistration}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#a33d1b] hover:bg-[#8e3314] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg border border-[#c95227] transition-all transform hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              <Flame className="w-4 h-4 fill-amber-300 text-amber-200" />
              <span>{t.registerNowBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenTickets || onOpenLookup}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-black/25 hover:bg-black/40 text-amber-200 font-bold text-sm sm:text-base rounded-xl border border-amber-300/40 backdrop-blur-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>मेरे प्रवेश पत्र / लॉगिन (My Passes)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Privacy Assurance Bar */}
        <div className="bg-emerald-50 border border-emerald-300/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-emerald-950 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>गोपनीयता सुरक्षा:</strong> आपका पास व व्यक्तिगत विवरण सुरक्षित हैं। केवल लॉगिन करने पर ही आपका पास दिखेगा, अन्य किसी को नहीं।
            </span>
          </div>
          <button
            onClick={onOpenTickets}
            className="text-emerald-800 hover:text-emerald-950 font-bold underline shrink-0 cursor-pointer text-xs"
          >
            लॉगिन करें →
          </button>
        </div>

        {/* Card 1: Sacred Yagya Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8ddcb]">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 mb-3 text-center sm:text-left">
            {t.heroTitle}
          </h2>

          <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            {t.heroSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-stone-800 bg-[#fdf9f2] p-4 rounded-xl border border-[#ede1cd]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>{t.yagyaDateText}</strong> {t.eventDates}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-700 shrink-0" />
                <span className="truncate"><strong>स्थान:</strong> {t.venueAddress}</span>
              </div>
              <a
                href={YAGYA_LOCATION_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#872e18] hover:bg-[#6b2210] text-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 shadow-xs"
                title="Google Maps Location"
              >
                <span>GPS मैप</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              <span>{t.kundAllocationRulesTitle}</span>
            </h4>
            <ul className="text-xs text-amber-900/90 space-y-1 pl-5 list-disc">
              <li>{t.rule1}</li>
              <li>{t.rule2}</li>
              <li>{t.rule3}</li>
            </ul>
          </div>
        </div>

        {/* 3 Stats Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-[#e8ddcb]">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-2 text-xl">
              🔥
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-stone-900">
              १०८
            </div>
            <div className="text-xs text-stone-600 font-medium mt-0.5">
              {t.totalKunds}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-[#e8ddcb]">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-2 text-xl">
              🪔
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-amber-900">
              {totalBookedKunds}
            </div>
            <div className="text-xs text-stone-600 font-medium mt-0.5">
              {t.bookedKunds}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-[#e8ddcb]">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-2 text-xl">
              🌸
            </div>
            <div className="text-2xl sm:text-3xl font-black font-heading text-emerald-800">
              {totalAvailableKunds}
            </div>
            <div className="text-xs text-stone-600 font-medium mt-0.5">
              {t.availableKunds}
            </div>
          </div>
        </div>

        {/* Card 2: Registration Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8ddcb] text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 mb-2">
            {t.regTab}
          </h2>

          <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            दिनांक एवं समय स्लॉट चुनें। पति-पत्नी (दंपति), परिवार अथवा एकल यजमान के रूप में सहभागी बनें। UPI QR स्कैन कर भुगतान प्रमाण (UTR + स्क्रीनशॉट) जमा करें। आश्रम सत्यापन उपरांत आपका आधिकारिक टोकन प्रवेश पत्र जारी होगा।
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={onStartRegistration}
              className="px-6 sm:px-7 py-2.5 bg-[#a33d1b] hover:bg-[#8e3314] text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              {t.registerNowBtn}
            </button>

            <button
              type="button"
              onClick={onOpenLookup}
              className="px-6 sm:px-7 py-2.5 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm rounded-xl border border-stone-300 shadow-2xs transition-all cursor-pointer"
            >
              {t.findMyPassBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
