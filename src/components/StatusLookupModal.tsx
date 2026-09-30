import React, { useState } from 'react';
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Calendar,
  Flame,
  User,
  Phone,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { Registration, getPaymentStatusDisplay } from '../types/yagya';

interface StatusLookupModalProps {
  onClose: () => void;
  registrations: Registration[];
  onOpenSlip: (reg: Registration) => void;
  initialQuery?: string;
}

export const StatusLookupModal: React.FC<StatusLookupModalProps> = ({
  onClose,
  registrations,
  onOpenSlip,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [matchingBookings, setMatchingBookings] = useState<Registration[]>(() => {
    if (!initialQuery) return [];
    const q = initialQuery.trim().toLowerCase();
    const cleanMob = q.replace(/\D/g, '').slice(-10);
    return registrations.filter((r) => {
      const matchToken = r.token.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchMobile = cleanMob.length >= 4 && r.mobile.includes(cleanMob);
      const matchUtr = r.utrNumber && r.utrNumber.toLowerCase().includes(q);
      return matchToken || matchMobile || matchUtr;
    });
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const q = query.trim().toLowerCase();
    if (!q) {
      setMatchingBookings([]);
      return;
    }

    const cleanMob = q.replace(/\D/g, '').slice(-10);
    const results = registrations.filter((r) => {
      const matchToken = r.token.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchMobile = cleanMob.length >= 4 && r.mobile.includes(cleanMob);
      const matchUtr = r.utrNumber && r.utrNumber.toLowerCase().includes(q);
      const matchName = (r.fullName || '').toLowerCase().includes(q) || (r.husbandName && r.husbandName.toLowerCase().includes(q));
      return matchToken || matchMobile || matchUtr || matchName;
    });

    setMatchingBookings(results);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-amber-300 overflow-hidden my-auto animate-in fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] p-3.5 sm:p-5 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold font-serif text-amber-200 truncate">
                आरक्षण एवं स्थिति जांचें
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-100/80 truncate">
                मोबाइल नंबर अथवा टोकन दर्ज करके स्थिति देखें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer shrink-0"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 sm:p-5 border-b border-stone-200 bg-[#faf5eb]">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="मोबाइल, टोकन या UTR दर्ज करें..."
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-white border-2 border-stone-300 rounded-xl text-stone-900 text-xs sm:text-sm focus:border-[#872e18] focus:outline-hidden shadow-xs"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-[#872e18] hover:bg-[#6c2312] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>जांचें</span>
            </button>
          </form>
          <div className="text-[10px] sm:text-[11px] text-stone-500 mt-2">
            उदाहरण: अपना 10 अंकों का व्हाट्सएप नंबर (उदा. 9876543210) या टोकन दर्ज करें।
          </div>
        </div>

        {/* Results Body */}
        <div className="p-3.5 sm:p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {!hasSearched ? (
            <div className="text-center py-8 text-stone-500">
              <Search className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-medium">कृपया अपना मोबाइल नंबर या टोकन संख्या दर्ज करें।</p>
            </div>
          ) : matchingBookings.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-4">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-800">कोई पंजीकरण नहीं मिला</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                दर्ज किए गए विवरण "{query}" से संबंधित कोई रिकॉर्ड नहीं मिला। कृपया अपना 10 अंकों का मोबाइल नंबर पुनः जांचें।
              </p>
            </div>
          ) : (
            matchingBookings.map((b) => {
              const isPaid = b.paymentStatus === 'paid';
              const isPending = b.paymentStatus === 'pending' || b.paymentStatus === 'temp_hold';
              const isRejected = b.paymentStatus === 'rejected';
              const statusDisplay = getPaymentStatusDisplay(b.paymentStatus);

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border-2 p-3.5 sm:p-5 shadow-xs space-y-3 transition-all ${
                    isPaid
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : isRejected
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-amber-300 bg-amber-50/30'
                  }`}
                >
                  {/* Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-stone-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-black text-xs sm:text-sm text-stone-900 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-stone-200 shadow-xs break-all">
                        {b.token}
                      </span>
                      <span className="bg-[#872e18] text-amber-200 font-bold px-2 py-0.5 rounded-lg text-xs shrink-0">
                        कुंड #{b.kundNumbers && b.kundNumbers.length > 0 ? b.kundNumbers.map((n) => String(n).padStart(3, '0')).join(', #') : String(b.kundNumber).padStart(3, '0')}
                      </span>
                    </div>

                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold text-xs px-2.5 sm:px-3 py-1 rounded-full shadow-xs flex-wrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{statusDisplay.labelHi} (Verified)</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-400 font-bold text-xs px-2.5 sm:px-3 py-1 rounded-full shadow-xs flex-wrap">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>{statusDisplay.labelHi} (Rejected)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-400 font-bold text-xs px-2.5 sm:px-3 py-1 rounded-full shadow-xs animate-pulse flex-wrap">
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{statusDisplay.labelHi} (Pending)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-stone-700 bg-white p-3 sm:p-3.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">यजमान</span>
                      <strong className="text-stone-900 break-words">{b.fullName || b.husbandName}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">पंजीकृत मोबाइल</span>
                      <strong className="text-stone-900">+91 {b.mobile}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">यज्ञ तिथि व समय</span>
                      <strong className="text-stone-900">{b.date} • {b.timeSlot || '09:00 AM'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] font-bold uppercase">कुल दक्षिणा राशि</span>
                      <strong className="text-[#872e18] font-bold">₹ {b.amount} ({b.kundCount || 1} कुंड)</strong>
                    </div>
                    {b.utrNumber && (
                      <div className="col-span-1 min-[360px]:col-span-2">
                        <span className="text-stone-400 block text-[10px] font-bold uppercase">जमा किया गया UTR / संदर्भ सं.</span>
                        <code className="text-stone-900 font-bold font-mono bg-stone-100 px-2 py-0.5 rounded text-[11px] break-all">{b.utrNumber}</code>
                      </div>
                    )}
                  </div>

                  {/* Status Explanation Message */}
                  {isPaid ? (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
                      <div>
                        <strong>सत्यापन पूर्ण:</strong> आपका भुगतान आश्रम व्यवस्थापक द्वारा सत्यापित कर दिया गया है। आपका टोकन आधिकारिक रूप से मान्य है।
                      </div>
                      <button
                        onClick={() => onOpenSlip(b)}
                        className="w-full sm:w-auto justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 sm:py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs text-center"
                      >
                        <Printer className="w-3.5 h-3.5 shrink-0" />
                        <span>प्रवेश पास व रसीद देखें / डाउनलोड करें</span>
                      </button>
                    </div>
                  ) : isRejected ? (
                    <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                      <div>
                        <strong>भुगतान अस्वीकृत:</strong> व्यवस्थापक द्वारा आपका भुगतान सत्यापित नहीं हो सका।
                      </div>
                      {b.rejectionReason && (
                        <div className="text-rose-800 break-words">
                          <strong>कारण:</strong> {b.rejectionReason}
                        </div>
                      )}
                      <p className="text-[11px] text-stone-600 mt-1">
                        यदि आपने सही भुगतान किया है, तो कृपया आश्रम हेल्पलाइन पर संपर्क करें।
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>भुगतान सत्यापन प्रक्रिया में है (Pending)</span>
                      </div>
                      <p className="text-stone-700 text-[11px] leading-relaxed break-words">
                        आपने UTR सं. <strong>{b.utrNumber || 'दर्ज विवरण'}</strong> जमा कर दिया है। आश्रम के व्यवस्थापक द्वारा बैंक खाते में पुष्टि के बाद टोकन मान्य होगा।
                      </p>
                      <div className="text-[10px] text-stone-500 italic pt-1">
                        * महत्वपूर्ण: व्यवस्थापक द्वारा भुगतान सत्यापन से पूर्व यह टोकन मान्य प्रवेश पास नहीं माना जाएगा।
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-3 sm:p-4 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
