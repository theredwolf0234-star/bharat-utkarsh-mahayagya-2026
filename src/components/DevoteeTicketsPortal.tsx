import React, { useState, useMemo } from 'react';
import {
  Flame,
  LogOut,
  Ticket,
  Printer,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { DevoteeUser, Registration } from '../types/yagya';

interface DevoteeTicketsPortalProps {
  currentUser: DevoteeUser | null;
  setCurrentUser: (user: DevoteeUser | null) => void;
  devotees: DevoteeUser[];
  setDevotees: React.Dispatch<React.SetStateAction<DevoteeUser[]>>;
  registrations: Registration[];
  onOpenSlip: (reg: Registration) => void;
  onBookNew: () => void;
}

export const DevoteeTicketsPortal: React.FC<DevoteeTicketsPortalProps> = ({
  currentUser,
  setCurrentUser,
  devotees,
  setDevotees,
  registrations,
  onOpenSlip,
  onBookNew,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('नोएडा');
  const [gotra, setGotra] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanMob = mobile.replace(/\D/g, '').slice(-10);
    const found = devotees.find((d) => d.mobile === cleanMob && d.password === password);
    if (!found) {
      setAuthError('मोबाइल नंबर अथवा पासवर्ड सही नहीं है।');
      return;
    }
    setCurrentUser(found);
    localStorage.setItem('yagya_devotee_user', JSON.stringify(found));
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanMob = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMob.length !== 10) {
      setAuthError('कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }
    const exists = devotees.some((d) => d.mobile === cleanMob);
    if (exists) {
      setAuthError('यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।');
      return;
    }
    const newDevotee: DevoteeUser = {
      id: `dev-${Date.now()}`,
      fullName: fullName.trim(),
      mobile: cleanMob,
      password,
      city: city.trim(),
      gotra: gotra.trim(),
    };
    setDevotees((prev) => [...prev, newDevotee]);
    setCurrentUser(newDevotee);
    localStorage.setItem('yagya_devotee_user', JSON.stringify(newDevotee));
  };

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return registrations.filter(
      (r) => (r.userId && r.userId === currentUser.id) || r.mobile === currentUser.mobile
    );
  }, [currentUser, registrations]);

  if (currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] text-white rounded-3xl p-6 shadow-xl border-2 border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#4a0e17] flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-amber-200 shrink-0">
              {currentUser.fullName ? currentUser.fullName.charAt(0) : '✓'}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-amber-200">
                {currentUser.fullName}
              </h2>
              <div className="text-xs text-amber-100/80 mt-0.5">
                मोबाइल: +91 {currentUser.mobile} • नगर: {currentUser.city || 'नोएडा'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBookNew}
              className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" />
              <span>नया कुंड बुक करें</span>
            </button>
            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('yagya_devotee_user');
              }}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-200 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-400/30 cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉग आउट</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#872e18] font-serif flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-600" />
            <span>मेरे आरक्षित हवन कुंड एवं रसीदें ({myBookings.length})</span>
          </h3>

          {myBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-amber-300">
              <Ticket className="w-12 h-12 text-amber-600/50 mx-auto mb-2" />
              <div className="font-bold text-base text-stone-800">कोई सक्रिय बुकिंग नहीं मिली</div>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                आपने अभी तक कोई हवन कुंड बुक नहीं किया है।
              </p>
              <button
                onClick={onBookNew}
                className="bg-[#872e18] text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                हवन कुंड आरक्षण आरंभ करें
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myBookings.map((ticket) => {
                const isPaid = ticket.paymentStatus === 'paid';
                const isPending = ticket.paymentStatus === 'pending';

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-2xl border-2 p-5 shadow-sm space-y-3 ${
                      isPaid
                        ? 'border-emerald-300'
                        : ticket.paymentStatus === 'rejected'
                        ? 'border-rose-300'
                        : 'border-amber-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#872e18] text-amber-200 font-bold px-3 py-1 rounded-lg text-xs">
                          हवन कुंड #{ticket.kundNumbers && ticket.kundNumbers.length > 0 ? ticket.kundNumbers.map((n) => String(n).padStart(3, '0')).join(', #') : String(ticket.kundNumber).padStart(3, '0')}
                        </span>
                        <div>
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            टोकन: {ticket.token}
                          </span>
                          <div className="text-[11px] text-stone-500">
                            {ticket.date} • {ticket.timeSlot || 'प्रातः 09:00 AM'}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isPaid ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold">
                            ✓ भुगतान सत्यापित (Payment Verified)
                          </span>
                        ) : ticket.paymentStatus === 'rejected' ? (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-xs px-3 py-1 rounded-full font-bold">
                            ✕ भुगतान अस्वीकृत (Payment Rejected)
                          </span>
                        ) : isPending ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                            ⏳ भुगतान सत्यापन लंबित (Payment Pending Verification)
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                            काउंटर भुगतान (Counter Payment)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl">
                      <div><strong>यजमान:</strong> {ticket.fullName || ticket.husbandName}</div>
                      <div><strong>कुल दक्षिणा:</strong> ₹ {ticket.amount} ({ticket.kundCount || 1} कुंड × ₹1,100)</div>
                      <div><strong>आरक्षित कुंड:</strong> {ticket.kundCount || 1}</div>
                      <div><strong>UTR संदर्भ:</strong> {ticket.utrNumber || '-'}</div>
                    </div>

                    {ticket.paymentStatus === 'rejected' && ticket.rejectionReason && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800">
                        <strong>अस्वीकृति कारण:</strong> {ticket.rejectionReason}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-stone-500">
                        {isPaid
                          ? 'सत्यापन पूर्ण। आप आधिकारिक रसीद देख सकते हैं या PDF के रूप में डाउनलोड कर सकते हैं।'
                          : ticket.paymentStatus === 'rejected'
                          ? 'भुगतान अस्वीकृत हो चुका है। आधिकारिक पास जारी नहीं किया गया।'
                          : 'आश्रम व्यवस्थापक द्वारा UTR एवं बैंक सत्यापन के उपरांत आधिकारिक रसीद सक्रिय होगी।'}
                      </span>

                      {isPaid ? (
                        <button
                          onClick={() => onOpenSlip(ticket)}
                          className="px-4 py-2 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>रसीद देखें / PDF प्रिंट करें</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-stone-200 text-stone-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-1.5 shrink-0"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>रसीद लॉक है ({ticket.paymentStatus === 'rejected' ? 'अस्वीकृत' : 'सत्यापन लंबित'})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-8">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] p-6 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto mb-2 border border-amber-400/40">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-amber-200">
            साधक खाता लॉगिन व पंजीकरण
          </h2>
          <p className="text-xs text-amber-100/80 mt-1">
            अपने मोबाइल व पासवर्ड से लॉगिन करके अपनी स्वीकृत रसीद व पास देखें।
          </p>
        </div>

        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 cursor-pointer ${
              authMode === 'login'
                ? 'border-[#872e18] text-[#872e18] bg-white'
                : 'border-transparent text-stone-500'
            }`}
          >
            साधक लॉगिन (Sign In)
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 cursor-pointer ${
              authMode === 'signup'
                ? 'border-[#872e18] text-[#872e18] bg-white'
                : 'border-transparent text-stone-500'
            }`}
          >
            नया खाता बनाएं (Sign Up)
          </button>
        </div>

        <div className="p-6">
          {authError && (
            <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पंजीकृत मोबाइल नंबर (10 अंक) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  साधक पासवर्ड *
                </label>
                <input
                  type="password"
                  required
                  placeholder="पासवर्ड दर्ज करें"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer"
              >
                खाता लॉगिन करें
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पूरा नाम *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. राम प्रसाद शर्मा"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  मोबाइल नंबर (10 अंक) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पासवर्ड बनाएं (कम से कम 4 अक्षर) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="पासवर्ड बनाएं"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">नगर / शहर</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">गोत्र (वैकल्पिक)</label>
                  <input
                    type="text"
                    value={gotra}
                    onChange={(e) => setGotra(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer mt-1"
              >
                खाता बनाएं व लॉगिन करें
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
