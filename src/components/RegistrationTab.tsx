import React, { useState, useEffect } from 'react';
import { 
  Registration, 
  YAGYA_DATES, 
  TIME_SLOTS, 
  PARTICIPATION_TYPES, 
  TOTAL_KUNDS, 
  RESERVED_KUNDS_COUNT, 
  DEFAULT_PRICE_PER_PERSON, 
  DEFAULT_ADDRESS,
  DevoteeUser
} from '../types/yagya';
import { computeKundStatuses, isKundBookable } from '../utils/kundAvailability';
import { Language, translations } from '../utils/i18n';
import { Flame, CheckCircle, AlertCircle, Calendar, Clock, MapPin, User, Phone, Mail, Users, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface Props {
  registrations: Registration[];
  onProceedToPayment: (data: any) => void;
  initialKundNumber?: number | null;
  initialDate?: string;
  lang?: Language;
  currentUser?: DevoteeUser | null;
}

export const RegistrationTab: React.FC<Props> = ({
  registrations,
  onProceedToPayment,
  initialKundNumber,
  initialDate,
  lang = 'hi',
  currentUser = null,
}) => {
  const t = translations[lang] || translations.hi;

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [wifeName, setWifeName] = useState('');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [city, setCity] = useState(currentUser?.city || 'नोएडा');
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [gotra, setGotra] = useState(currentUser?.gotra || '');
  const [date, setDate] = useState<string>(initialDate || YAGYA_DATES[0].date);
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [participationType, setParticipationType] = useState<string>(PARTICIPATION_TYPES[0].label);
  const [personCount, setPersonCount] = useState<number>(2);
  const [selectedKund, setSelectedKund] = useState<number | null>(initialKundNumber || null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isHolding, setIsHolding] = useState(false);

  // Sync if currentUser loads after mount
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName);
      if (!mobile) setMobile(currentUser.mobile);
      if (currentUser.city) setCity(currentUser.city);
      if (currentUser.gotra) setGotra(currentUser.gotra);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Auto-adjust persons when participation type changes
  const handleParticipationChange = (typeStr: string) => {
    setParticipationType(typeStr);
    const found = PARTICIPATION_TYPES.find((p) => p.label === typeStr);
    if (found) {
      setPersonCount(found.defaultPersons);
    }
  };

  // Re-compute kund statuses for the chosen date
  const summary = computeKundStatuses(registrations, date, 2);

  useEffect(() => {
    if (initialKundNumber && initialKundNumber > RESERVED_KUNDS_COUNT) {
      setSelectedKund(initialKundNumber);
    }
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialKundNumber, initialDate]);

  const totalAmount = personCount * DEFAULT_PRICE_PER_PERSON;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg(t.fillAllRequired);
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length < 10) {
      setErrorMsg(t.invalidMobile);
      return;
    }

    if (!city.trim()) {
      setErrorMsg(t.fillAllRequired);
      return;
    }

    if (!selectedKund) {
      setErrorMsg(t.selectKundPrompt);
      return;
    }

    const targetKund = summary.kundList.find((k) => k.kundNumber === selectedKund);
    if (!targetKund) {
      setErrorMsg('अमान्य कुंड चयन');
      return;
    }

    const check = isKundBookable(targetKund, summary.allOtherKundsFilledForShared);
    if (!check.bookable) {
      setErrorMsg(check.reason);
      return;
    }

    // Call backend API to initiate temporary reservation hold & prevent double booking
    setIsHolding(true);
    try {
      const userToken = localStorage.getItem('yagya_devotee_token');
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) reqHeaders['Authorization'] = `Bearer ${userToken}`;

      const res = await fetch('/api/reservations/temp-hold', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          fullName: fullName.trim(),
          husbandName: fullName.trim(),
          wifeName: wifeName.trim() || undefined,
          mobile: cleanMobile,
          email: email.trim() || undefined,
          city: city.trim(),
          address: address.trim(),
          gotra: gotra.trim() || undefined,
          kundNumber: selectedKund,
          date,
          timeSlot,
          participationType,
          personCount,
          amount: totalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsHolding(false);
        setErrorMsg(data.error || 'आरक्षण स्लॉट प्राप्त नहीं हो सका।');
        return;
      }

      setIsHolding(false);
      onProceedToPayment(data.registration);
    } catch (err: any) {
      console.warn('Backend temp-hold fallback:', err);
      // Fallback local hold if server unreachable
      setIsHolding(false);
      const fallbackExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      onProceedToPayment({
        id: `reg-${Date.now()}`,
        token: `MUMY-26-K${String(selectedKund).padStart(2, '0')}-${cleanMobile.slice(-2)}`,
        fullName: fullName.trim(),
        husbandName: fullName.trim(),
        wifeName: wifeName.trim() || undefined,
        mobile: cleanMobile,
        email: email.trim() || undefined,
        city: city.trim(),
        address: address.trim(),
        gotra: gotra.trim() || undefined,
        kundNumber: selectedKund,
        date,
        timeSlot,
        participationType,
        personCount,
        amount: totalAmount,
        paymentStatus: 'temp_hold',
        expiresAt: fallbackExpires,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="w-full pb-14 font-sans bg-[#faf5eb] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-3xl shadow-sm border border-[#e8ddcb] p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="border-b border-stone-200 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 text-center sm:text-left">
              {t.personalInfoTitle}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              कृपया सभी आवश्यक विवरण सावधानीपूर्वक भरें।
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.husbandName} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={t.husbandNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.wifeName}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t.wifeNamePlaceholder}
                    value={wifeName}
                    onChange={(e) => setWifeName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.mobileNumber} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder={t.mobilePlaceholder}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-mono font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.city} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={t.cityPlaceholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.gotra}
                </label>
                <input
                  type="text"
                  placeholder={t.gotraPlaceholder}
                  value={gotra}
                  onChange={(e) => setGotra(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Step 2: Date, Session & Participation Selection */}
            <div className="border-t border-stone-200 pt-5 space-y-4">
              <h3 className="text-base font-bold font-heading text-stone-900">
                यज्ञ तिथि, सत्र एवं सहभागिता चयन
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.selectDate} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                    >
                      {YAGYA_DATES.map((d) => (
                        <option key={d.date} value={d.date}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.sessionTimeSlot} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                    >
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.participationType}
                  </label>
                  <select
                    value={participationType}
                    onChange={(e) => handleParticipationChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {PARTICIPATION_TYPES.map((pt) => (
                      <option key={pt.label} value={pt.label}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.personCount} (₹1100 प्रति यजमान)
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={personCount}
                      onChange={(e) => setPersonCount(Math.max(1, Number(e.target.value)))}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Interactive Hawan Kund Selector (Kunds 10 to 108) */}
            <div className="border-t border-stone-200 pt-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold font-heading text-stone-900">
                    {t.selectKund}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {t.reservedNotice}
                  </p>
                </div>

                {selectedKund && (
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-xl text-xs border border-amber-300">
                    <Flame className="w-4 h-4 text-amber-700" />
                    <span>चयनित: अग्नि कुंड #{String(selectedKund).padStart(3, '0')}</span>
                  </div>
                )}
              </div>

              {/* Grid of Kunds */}
              <div className="bg-[#faf5eb] p-4 rounded-2xl border border-amber-200">
                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-56 overflow-y-auto p-1">
                  {summary.kundList.map((k) => {
                    const isSelected = selectedKund === k.kundNumber;
                    const isReservedForSant = k.isReserved; // 1-9
                    const isFull = k.bookedCount >= k.capacity;

                    return (
                      <button
                        key={k.kundNumber}
                        type="button"
                        disabled={isReservedForSant || isFull}
                        onClick={() => setSelectedKund(k.kundNumber)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isReservedForSant
                            ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                            : isFull
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#8a1523] text-white shadow-md scale-105 border-2 border-amber-400'
                            : 'bg-white hover:bg-amber-100 text-stone-800 border border-stone-300 hover:border-amber-400'
                        }`}
                        title={
                          isReservedForSant
                            ? 'संतों हेतु आरक्षित'
                            : isFull
                            ? 'पूर्ण आरक्षित'
                            : `कुंड #${k.formattedNumber}`
                        }
                      >
                        <span className="text-[10px] leading-none opacity-70">#</span>
                        <span className="text-xs font-black">{k.formattedNumber}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Total Amount & Submit */}
            <div className="border-t border-stone-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                  कुल समर्पण दक्षिणा
                </span>
                <span className="text-2xl font-black text-[#872e18]">
                  ₹{totalAmount}
                </span>
                <span className="text-[11px] text-stone-500 ml-2">
                  ({personCount} यजमान × ₹1100)
                </span>
              </div>

              <button
                type="submit"
                disabled={isHolding}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#8a1523] hover:bg-[#70101b] disabled:bg-stone-300 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isHolding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>स्लॉट सुरक्षित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <span>{t.proceedToPayment}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
