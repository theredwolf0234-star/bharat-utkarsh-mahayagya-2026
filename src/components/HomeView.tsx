import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Ticket,
  ShieldCheck,
  Calendar,
  Search,
  MapPin,
  Compass,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { KundSummary, KundLiveItem } from '../types/yagya';
import { YAGYA_DATES, VENUE_ADDRESS, YAGYA_LOCATION_MAP_URL } from '../constants/yagya';

interface HomeViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  kundSummary: KundSummary;
  onStartBooking: (kundNum: number | null) => void;
  onOpenTickets: () => void;
  onOpenStatusLookup: () => void;
  onOpenIntroSlides?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  selectedDate,
  onSelectDate,
  kundSummary,
  onStartBooking,
  onOpenTickets,
  onOpenStatusLookup,
  onOpenIntroSlides,
}) => {
  const [searchKund, setSearchKund] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Real-time server live status for all 108 Kunds
  const [liveKunds, setLiveKunds] = useState<KundLiveItem[]>([]);
  const [liveCounts, setLiveCounts] = useState({
    available: 99,
    locked: 0,
    booked: 0,
    reserved: 9,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/kunds/status?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.kunds)) {
            setLiveKunds(data.kunds);
            setLiveCounts({
              available: data.availableCount ?? 99,
              locked: data.lockedCount ?? 0,
              booked: data.bookedCount ?? 0,
              reserved: data.santReservedCount ?? 9,
            });
          }
        }
      } catch (e) {
        // Fallback to local kundSummary
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedDate]);

  // Merge live server data with local fallback
  const allKunds = useMemo<KundLiveItem[]>(() => {
    if (liveKunds.length > 0) return liveKunds;
    return kundSummary.list.map((k) => {
      const isReserved = k.isReserved;
      const isBooked = !isReserved && k.bookedCount > 0;
      return {
        kundNumber: k.kundNumber,
        formattedNumber: k.formattedNumber,
        status: isReserved ? ('RESERVED' as const) : isBooked ? ('BOOKED' as const) : ('AVAILABLE' as const),
        isSantReserved: isReserved,
      };
    });
  }, [liveKunds, kundSummary]);

  const filteredKunds = useMemo(() => {
    return allKunds.filter((k) => {
      if (searchKund && !String(k.kundNumber).includes(searchKund)) return false;
      if (filterType === 'available') return k.status === 'AVAILABLE';
      if (filterType === 'locked') return k.status === 'LOCKED';
      if (filterType === 'booked') return k.status === 'BOOKED';
      if (filterType === 'reserved') return k.status === 'RESERVED';
      return true;
    });
  }, [allKunds, searchKund, filterType]);

  return (
    <div className="w-full pb-14 font-sans bg-[#faf5eb]">
      {/* Hero Section with Vedic Crimson / Maroon Gradient */}
      <div
        className="w-full text-white text-center py-8 sm:py-16 px-3 sm:px-4 shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #872e18 0%, #5c1810 60%, #2a0808 100%)' }}
      >
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-amber-500/20 text-amber-200 border border-amber-400/40 px-2.5 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold max-w-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">परम पूज्य महर्षि महेश योगी जी के पावन आशीर्वाद से</span>
          </div>
          <h1 className="font-serif font-black text-2xl min-[360px]:text-3xl sm:text-5xl md:text-6xl text-amber-100 drop-shadow-md">
            भारत उत्कर्ष महायज्ञ 2026
          </h1>
          <p className="text-amber-200 text-xs sm:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            "राष्ट्र के उत्कर्ष में ही आपका उत्कर्ष" • 27 नवम्बर 2026 से 5 दिसम्बर 2026 • 108 भव्य हवन कुंड
          </p>

          <div className="flex flex-col min-[480px]:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 w-full max-w-2xl mx-auto">
            <button
              onClick={() => onStartBooking(null)}
              className="w-full min-[480px]:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[#d49a37] hover:bg-[#b88226] text-stone-950 font-bold text-xs sm:text-base rounded-xl shadow-lg border border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-stone-950 shrink-0" />
              <span>हवन कुंड ऑनलाइन बुक करें</span>
            </button>
            {onOpenIntroSlides && (
              <button
                onClick={onOpenIntroSlides}
                className="w-full min-[480px]:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold text-xs sm:text-base rounded-xl shadow-lg border border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-stone-950 shrink-0" />
                <span>पावन आमंत्रण (Flyer)</span>
              </button>
            )}
            <button
              onClick={onOpenStatusLookup}
              className="w-full min-[480px]:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs sm:text-base rounded-xl border border-amber-300/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-300 shrink-0" />
              <span>भुगतान व आरक्षण स्थिति जांचें</span>
            </button>
            <button
              onClick={onOpenTickets}
              className="w-full min-[480px]:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-stone-200 font-bold text-xs sm:text-base rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4 shrink-0" />
              <span>मेरी बुकिंग व पास</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-6 sm:mt-8 space-y-4 sm:space-y-6">
        {/* Verification Policy Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#8a1523] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-stone-800 leading-relaxed">
              <span className="font-bold text-[#8a1523] text-xs sm:text-base block">
                महत्वपूर्ण नियम एवं 5-मिनट रियल-टाइम लॉकिंग प्रणाली:
              </span>
              <p className="mt-1 text-stone-700">
                हवन कुंड चुनते ही वह आपके लिए <strong>5 मिनट हेतु सुरक्षित लॉक</strong> हो जाता है। 
                एक मोबाइल नंबर से <strong>एक दिन में केवल एक ही कुंड</strong> आरक्षित किया जा सकता है। दक्षिणा जमा करने पर आश्रम व्यवस्थापक सत्यापन के उपरांत आधिकारिक टोकन WhatsApp पर जारी होगा।
              </p>
              <p className="mt-1 text-amber-900 font-bold text-xs bg-amber-100/70 inline-block px-2 py-0.5 rounded border border-amber-300/60">
                🔒 नियम: 1 मोबाइल = 1 हवन कुंड प्रतिदिन • 5 मिनट अस्थायी लॉक
              </p>
            </div>
          </div>
          <button
            onClick={onOpenStatusLookup}
            className="w-full sm:w-auto px-4 py-2 bg-[#872e18] hover:bg-[#6e2412] text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5 self-auto sm:self-center"
          >
            <Search className="w-3.5 h-3.5" />
            <span>स्थिति जांचें</span>
          </button>
        </div>

        {/* 108 Hawan Kund Live Tracker Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-[#e8ddcb] space-y-4 sm:space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-stone-200 pb-3 sm:pb-4">
            <div>
              <h2 className="text-base sm:text-2xl font-bold font-serif text-stone-900 flex items-center gap-1.5 sm:gap-2">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-[#8a1523] shrink-0" />
                <span>108 हवन कुंड लाइव स्थिति व उपलब्धता</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1">
                कुंड 001 से 009 संतों हेतु आरक्षित • कुंड 10 से 108 यजमानों हेतु उपलब्ध • 5-मिनट रियल-टाइम लॉक सुरक्षा
              </p>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-300 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="text-xs font-semibold text-amber-950 sm:hidden">यज्ञ तिथि:</span>
              </div>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-white text-stone-900 text-xs sm:text-sm font-bold rounded-lg px-2.5 py-1.5 border border-stone-300 cursor-pointer"
              >
                {YAGYA_DATES.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability Summary Stats Cards (AVAILABLE / LOCKED / BOOKED / RESERVED) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center">
              <span className="text-[10px] min-[360px]:text-[11px] text-emerald-800 font-bold block truncate">
                उपलब्ध (AVAILABLE)
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-900">{liveCounts.available}</span>
            </div>
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center animate-pulse">
              <span className="text-[10px] min-[360px]:text-[11px] text-amber-900 font-bold block truncate flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-amber-700 inline" />
                <span>लॉक्ड (5m LOCKED)</span>
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-950">{liveCounts.locked}</span>
            </div>
            <div className="bg-rose-50 border border-rose-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center">
              <span className="text-[10px] min-[360px]:text-[11px] text-rose-800 font-bold block truncate">
                आरक्षित (BOOKED)
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-900">{liveCounts.booked}</span>
            </div>
            <div className="bg-purple-50 border border-purple-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-center">
              <span className="text-[10px] min-[360px]:text-[11px] text-purple-800 font-bold block truncate">
                संत आरक्षित (1-9)
              </span>
              <span className="text-xl sm:text-2xl font-black text-purple-900">{liveCounts.reserved}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="कुंड सं. खोजें (उदा. 10, 54)..."
                value={searchKund}
                onChange={(e) => setSearchKund(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs">
              {[
                { id: 'all', label: 'सभी (108)' },
                { id: 'available', label: `उपलब्ध (${liveCounts.available})` },
                { id: 'locked', label: `🔒 लॉक्ड (${liveCounts.locked})` },
                { id: 'booked', label: `आरक्षित (${liveCounts.booked})` },
                { id: 'reserved', label: 'संत आरक्षित (1-9)' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterType(pill.id)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors text-[11px] sm:text-xs ${
                    filterType === pill.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hawan Kund 1 to 108 Interactive Grid (Strict 4 States) */}
          <div className="bg-[#faf5eb] p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200 max-h-[380px] overflow-y-auto">
            <div className="grid grid-cols-4 min-[360px]:grid-cols-5 min-[420px]:grid-cols-6 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-1.5 sm:gap-2">
              {filteredKunds.map((k) => {
                const isSant = k.status === 'RESERVED';
                const isBooked = k.status === 'BOOKED';
                const isLocked = k.status === 'LOCKED';
                const isLockedSelf = Boolean(k.isLockedBySelf);

                let cardStyle = 'bg-white text-stone-800 border-stone-300 hover:border-amber-400 hover:bg-amber-50';
                let statusLabel = 'उपलब्ध';
                let disabled = false;

                if (isSant) {
                  cardStyle = 'bg-purple-100 text-purple-900 border-purple-300 opacity-80 cursor-not-allowed';
                  statusLabel = 'संत';
                  disabled = true;
                } else if (isBooked) {
                  cardStyle = 'bg-rose-100 text-rose-900 border-rose-300 cursor-not-allowed';
                  statusLabel = 'आरक्षित';
                  disabled = true;
                } else if (isLocked) {
                  if (isLockedSelf) {
                    cardStyle = 'bg-amber-100 text-amber-950 border-2 border-amber-500 shadow-md ring-2 ring-amber-400';
                    statusLabel = 'आपका लॉक';
                    disabled = false;
                  } else {
                    cardStyle = 'bg-amber-50 text-amber-950 border-2 border-dashed border-amber-400 opacity-90 cursor-not-allowed animate-pulse';
                    const remSec = k.lockInfo?.remainingSeconds;
                    const mins = remSec ? Math.floor(remSec / 60) : 5;
                    statusLabel = `🔒 लॉक्ड (${mins}m)`;
                    disabled = true;
                  }
                }

                return (
                  <button
                    key={k.kundNumber}
                    type="button"
                    disabled={disabled}
                    onClick={() => onStartBooking(k.kundNumber)}
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${cardStyle}`}
                    title={
                      isSant
                        ? 'संतों व आचार्यों हेतु आरक्षित'
                        : isBooked
                        ? `हवन कुंड #${k.formattedNumber} आरक्षित (Booked) है`
                        : isLocked
                        ? `हवन कुंड #${k.formattedNumber} 5 मिनट के लिए अस्थायी लॉक्ड है`
                        : `हवन कुंड #${k.formattedNumber} चुनें व बुक करें`
                    }
                  >
                    <span className="text-[9px] leading-none opacity-60">#</span>
                    <span className="text-xs sm:text-sm font-black">{k.formattedNumber}</span>
                    <span className="text-[8px] sm:text-[9px] mt-0.5 font-bold truncate w-full">
                      {statusLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Venue Address & GPS Navigation Link Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-[#e8ddcb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-rose-700 font-bold text-xs sm:text-sm">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>यज्ञ स्थल व आगमन निर्देश:</span>
            </div>
            <div className="text-stone-900 font-serif font-bold text-sm sm:text-lg leading-snug">
              {VENUE_ADDRESS}
            </div>
            <div className="text-stone-600 text-[11px] sm:text-xs">
              निकटतम मेट्रो स्टेशन: सेक्टर-81 अथवा NSEZ (एक्वा लाइन) से मात्र 1.5 किमी।
            </div>
          </div>

          <a
            href={YAGYA_LOCATION_MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Google Maps मार्ग देखें</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
};
