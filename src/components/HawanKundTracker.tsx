import React, { useState, useMemo } from 'react';
import { HawanKundStatus, Registration, YAGYA_DATES, RESERVED_KUNDS_COUNT, TOTAL_KUNDS } from '../types/yagya';
import { computeKundStatuses, isKundBookable } from '../utils/kundAvailability';
import { Flame, ShieldAlert, CheckCircle2, Users, Search, Info, Calendar } from 'lucide-react';

interface Props {
  registrations: Registration[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSelectKundForBooking: (kundNumber: number, date: string) => void;
}

export const HawanKundTracker: React.FC<Props> = ({
  registrations,
  selectedDate,
  onSelectDate,
  onSelectKundForBooking,
}) => {
  const [searchKund, setSearchKund] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'partial' | 'full' | 'reserved'>('all');
  const [selectedKundDetail, setSelectedKundDetail] = useState<HawanKundStatus | null>(null);

  // Compute live availability for the selected date
  const summary = useMemo(() => {
    return computeKundStatuses(registrations, selectedDate, 2);
  }, [registrations, selectedDate]);

  // Filter kunds based on search and status
  const filteredKunds = useMemo(() => {
    return summary.kundList.filter((k) => {
      // Search filter
      if (searchKund.trim()) {
        const query = searchKund.trim();
        if (!String(k.kundNumber).includes(query)) return false;
      }

      // Status filter
      if (statusFilter === 'reserved') return k.isReserved;
      if (statusFilter === 'available') return !k.isReserved && k.bookedCount === 0;
      if (statusFilter === 'partial') return !k.isReserved && k.bookedCount === 1;
      if (statusFilter === 'full') return !k.isReserved && k.bookedCount >= k.capacity;

      return true;
    });
  }, [summary, searchKund, statusFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-amber-200/80 p-4 sm:p-6 mb-8">
      {/* Title & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-stone-900">
                १०८ हवन कुंड लाइव उपलब्धता ट्रैकर (Live Kund Tracker)
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                यज्ञ मंडप में वास्तविक समय उपलब्धता देखें एवं अपने अभीष्ट हवन कुंड का चयन करें
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-amber-50/80 p-2 rounded-xl border border-amber-300">
          <Calendar className="w-5 h-5 text-amber-800 shrink-0" />
          <label htmlFor="yagya-date-select" className="text-xs font-semibold text-stone-700 hidden sm:inline">
            यज्ञ तिथि:
          </label>
          <select
            id="yagya-date-select"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="bg-white text-stone-900 text-sm font-semibold rounded-lg px-3 py-1.5 border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
          >
            {YAGYA_DATES.map((d) => (
              <option key={d.date} value={d.date}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 my-4">
        {/* Total Kunds */}
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-center">
          <div className="text-xs text-stone-600 font-medium">कुल हवन कुंड</div>
          <div className="text-2xl font-black text-amber-900">{TOTAL_KUNDS}</div>
          <div className="text-[11px] text-amber-800 font-medium">मंडप परिसर</div>
        </div>

        {/* Reserved Kunds 1-9 */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <div className="text-xs text-purple-700 font-medium">संत / आचार्य आरक्षित</div>
          <div className="text-2xl font-black text-purple-900">{RESERVED_KUNDS_COUNT}</div>
          <div className="text-[11px] text-purple-700 font-medium">कुंड 1 से 9</div>
        </div>

        {/* Available Empty */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <div className="text-xs text-emerald-700 font-medium">पूर्णतः रिक्त (उपलब्ध)</div>
          <div className="text-2xl font-black text-emerald-800">{summary.totalAvailable}</div>
          <div className="text-[11px] text-emerald-700 font-medium">कुंड 10 से 108</div>
        </div>

        {/* Partially Booked (1 seated) */}
        <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-center">
          <div className="text-xs text-amber-800 font-medium">1 यजमान (सांझा उपलब्ध)</div>
          <div className="text-2xl font-black text-amber-900">{summary.totalPartiallyBooked}</div>
          <div className="text-[11px] text-amber-800 font-medium">क्षमता 2 यजमान</div>
        </div>

        {/* Full */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
          <div className="text-xs text-rose-700 font-medium">पूर्णतः आरक्षित (Full)</div>
          <div className="text-2xl font-black text-rose-900">{summary.totalFull}</div>
          <div className="text-[11px] text-rose-700 font-medium">2/2 यजमान भरे</div>
        </div>
      </div>

      {/* Special Rule Alert Box (Addressing User's specific rule question) */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-l-4 border-amber-600 p-3.5 rounded-r-xl mb-4 text-xs sm:text-sm text-stone-800 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-900">हवन कुंड आवंटन एवं सांझा नियम (Capacity Rule):</span>
          <p className="mt-0.5 leading-relaxed text-stone-700">
            <strong>कुंड 1 से 9:</strong> पूज्य संत-महात्मा एवं वैदिक आचार्यों हेतु आरक्षित हैं (सामान्य बुकिंग मान्य नहीं)।<br />
            <strong>कुंड 10 से 108:</strong> यजमानों हेतु उपलब्ध हैं। प्रत्येक कुंड की क्षमता 2 यजमानों की है। यदि किसी कुंड (जैसे कुंड 10) पर 1 यजमान पहले से बैठे हैं, तो शेष क्षमता के अंतर्गत अतिरिक्त यजमान तभी आवंटित हो सकते हैं जब शेष कुंड भी भर रहे हों अथवा यजमान सांझा बुकिंग का विकल्प चुनें।
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="कुंड संख्या खोजें (उदा. 10, 54, 108)..."
            value={searchKund}
            onChange={(e) => setSearchKund(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white font-semibold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            सभी (All 108)
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🟢 रिक्त ({summary.totalAvailable})
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'partial'
                ? 'bg-amber-500 text-stone-900 font-semibold'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            🟡 1 यजमान ({summary.totalPartiallyBooked})
          </button>
          <button
            onClick={() => setStatusFilter('full')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'full'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            🔴 पूर्ण ({summary.totalFull})
          </button>
          <button
            onClick={() => setStatusFilter('reserved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              statusFilter === 'reserved'
                ? 'bg-purple-700 text-white font-semibold'
                : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            🟣 आरक्षित ({RESERVED_KUNDS_COUNT})
          </button>
        </div>
      </div>

      {/* 108 Kunds Visual Grid */}
      <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 max-h-[460px] overflow-y-auto">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2">
          {filteredKunds.map((k) => {
            const isReserved = k.isReserved;
            const isFull = !isReserved && k.bookedCount >= k.capacity;
            const isPartial = !isReserved && k.bookedCount === 1;
            const isAvailable = !isReserved && k.bookedCount === 0;

            let cardBg = '';
            let textColor = '';
            let badge = '';

            if (isReserved) {
              cardBg = 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-900';
              textColor = 'text-purple-900';
              badge = 'आरक्षित';
            } else if (isFull) {
              cardBg = 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900 cursor-not-allowed';
              textColor = 'text-rose-900';
              badge = 'पूर्ण 2/2';
            } else if (isPartial) {
              cardBg = 'bg-amber-50 hover:bg-amber-100 border-amber-400 text-amber-950 cursor-pointer shadow-xs';
              textColor = 'text-amber-950';
              badge = '1 यजमान';
            } else {
              cardBg = 'bg-emerald-50/90 hover:bg-emerald-100 border-emerald-300 text-emerald-950 cursor-pointer hover:shadow-md';
              textColor = 'text-emerald-950';
              badge = 'उपलब्ध';
            }

            return (
              <button
                key={k.kundNumber}
                type="button"
                onClick={() => setSelectedKundDetail(k)}
                className={`relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all transform hover:scale-[1.03] active:scale-95 ${cardBg}`}
                title={`कुंड संख्या ${k.kundNumber} - ${badge}`}
              >
                {/* Kund Number with holy fire icon */}
                <div className="flex items-center gap-1 font-bold text-xs sm:text-sm">
                  <Flame
                    className={`w-3 h-3 ${
                      isReserved
                        ? 'text-purple-600'
                        : isFull
                        ? 'text-rose-600'
                        : isPartial
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  <span>#{k.kundNumber}</span>
                </div>

                {/* Status indicator */}
                <div className="mt-1 text-[10px] font-semibold tracking-tighter truncate max-w-full">
                  {badge}
                </div>

                {/* Capacity dots */}
                {!isReserved && (
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        k.bookedCount >= 1 ? 'bg-amber-600' : 'bg-emerald-300'
                      }`}
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        k.bookedCount >= 2 ? 'bg-rose-600' : 'bg-emerald-300'
                      }`}
                    />
                  </div>
                )}
                {isReserved && (
                  <div className="text-[9px] text-purple-700 font-medium mt-0.5">
                    संत
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredKunds.length === 0 && (
          <div className="text-center py-8 text-stone-500">
            कोई हवन कुंड इस खोज मापदंड से नहीं मिला।
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-600 pt-2 border-t border-stone-200">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-200 border border-purple-400"></span>
          <span>कुंड 1-9: पूज्य संत/आचार्य आरक्षित</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-400"></span>
          <span>रिक्त एवं उपलब्ध (0/2)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-400"></span>
          <span>1 यजमान उपस्थित (सांझा बुकिंग हेतु खुला)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-200 border border-rose-400"></span>
          <span>पूर्ण (2/2 यजमान)</span>
        </div>
      </div>

      {/* Kund Detail Modal */}
      {selectedKundDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-900 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-600" />
                </span>
                <div>
                  <h3 className="text-lg font-bold font-heading text-stone-900">
                    हवन कुंड विवरण (Kund #{selectedKundDetail.kundNumber})
                  </h3>
                  <p className="text-xs text-stone-500">तिथि: {selectedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedKundDetail(null)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5 text-sm">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="text-stone-700 font-medium">कुंड स्थिति:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded text-xs ${
                    selectedKundDetail.isReserved
                      ? 'bg-purple-100 text-purple-800'
                      : selectedKundDetail.bookedCount >= selectedKundDetail.capacity
                      ? 'bg-rose-100 text-rose-800'
                      : selectedKundDetail.bookedCount === 1
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedKundDetail.isReserved
                    ? 'पूज्य संत एवं आचार्य आरक्षित'
                    : selectedKundDetail.bookedCount >= selectedKundDetail.capacity
                    ? 'पूर्णतः भरा हुआ (2/2)'
                    : selectedKundDetail.bookedCount === 1
                    ? '1 यजमान (सांझा बुकिंग संभव)'
                    : 'पूर्णतः उपलब्ध (0/2)'}
                </span>
              </div>

              {selectedKundDetail.isReserved ? (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs leading-relaxed">
                  <ShieldAlert className="w-5 h-5 text-purple-600 mb-1" />
                  कुंड संख्या 1 से 9 केवल मुख्य यज्ञाचार्य, पूज्य संतों एवं विशिष्ट वैदिक विद्वानों हेतु आरक्षित हैं। कृपया कुंड संख्या 10 से 108 में से किसी कुंड का चयन करें।
                </div>
              ) : (
                <>
                  <div className="text-xs text-stone-600 space-y-1">
                    <div className="flex justify-between">
                      <span>यज्ञ स्थल:</span>
                      <span className="font-semibold text-stone-800">रामलीला मैदान, महर्षि आश्रम, नोएडा</span>
                    </div>
                    <div className="flex justify-between">
                      <span>पंजीकरण शुल्क:</span>
                      <span className="font-bold text-amber-900">₹1100 प्रति व्यक्ति</span>
                    </div>
                    <div className="flex justify-between">
                      <span>वर्तमान में पंजीकृत:</span>
                      <span className="font-semibold text-stone-800">
                        {selectedKundDetail.bookedCount} / {selectedKundDetail.capacity} यजमान
                      </span>
                    </div>
                  </div>

                  {selectedKundDetail.bookedCount > 0 && (
                    <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedKundDetail.bookedCount >= selectedKundDetail.capacity ? 'bg-rose-600' : 'bg-amber-500'}`} />
                        <span>बुकिंग स्थिति (Reservation Status):</span>
                      </div>
                      <p className="text-stone-700 leading-relaxed font-medium">
                        {selectedKundDetail.bookedCount >= selectedKundDetail.capacity
                          ? 'यह हवन कुंड इस तिथि के लिए पूर्णतः आरक्षित / बुक है (Booked)।'
                          : 'इस हवन कुंड पर १ स्थान आरक्षित है (1 Booked)। क्षमतानुसार दूसरा स्थान उपलब्ध है।'}
                      </p>
                    </div>
                  )}

                  {/* Explanation for 1-seated kund */}
                  {selectedKundDetail.bookedCount === 1 && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-snug">
                      ✨ <strong>सांझा बुकिंग सूचना:</strong> इस कुंड पर 1 स्थान बुक है। आप इस कुंड के 2nd स्लॉट को बुक कर सकते हैं।
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedKundDetail(null)}
                className="flex-1 py-2 px-3 border border-stone-300 rounded-xl text-stone-700 text-sm font-semibold hover:bg-stone-50"
              >
                बंद करें
              </button>
              {!selectedKundDetail.isReserved && selectedKundDetail.bookedCount < selectedKundDetail.capacity && (
                <button
                  type="button"
                  onClick={() => {
                    const kNum = selectedKundDetail.kundNumber;
                    setSelectedKundDetail(null);
                    onSelectKundForBooking(kNum, selectedDate);
                  }}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-stone-950" />
                  <span>कुंड #{selectedKundDetail.kundNumber} बुक करें</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
