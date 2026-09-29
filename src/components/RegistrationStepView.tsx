import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  User,
  AlertCircle,
  KeyRound,
  Sparkles,
  Flame,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { DevoteeUser, Registration, KundSummary } from '../types/yagya';
import {
  YAGYA_DATES,
  YAGYA_TIME,
  TIME_SLOTS,
  PARTICIPATION_TYPES,
  DEFAULT_PRICE_PER_PERSON,
  RESERVED_KUNDS_COUNT,
} from '../constants/yagya';

interface RegistrationStepViewProps {
  initialKund: number | null;
  selectedDate: string;
  currentUser: DevoteeUser | null;
  devotees: DevoteeUser[];
  setDevotees: React.Dispatch<React.SetStateAction<DevoteeUser[]>>;
  setCurrentUser: (user: DevoteeUser | null) => void;
  onProceedToPayment: (tempReg: Registration) => void;
  kundSummary: KundSummary;
  registrations: Registration[];
}

export const RegistrationStepView: React.FC<RegistrationStepViewProps> = ({
  initialKund,
  selectedDate,
  currentUser,
  devotees,
  setDevotees,
  setCurrentUser,
  onProceedToPayment,
  kundSummary,
  registrations,
}) => {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [wifeName, setWifeName] = useState('');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [city, setCity] = useState(currentUser?.city || 'नोएडा');
  const [gotra, setGotra] = useState(currentUser?.gotra || '');

  const [accountPassword, setAccountPassword] = useState('');
  const [isExistingLoginMode, setIsExistingLoginMode] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [date, setDate] = useState(selectedDate || YAGYA_DATES[0].date);
  const [timeSlot, setTimeSlot] = useState('9:00 AM (प्रातः 09:00 AM)');
  const [participationType, setParticipationType] = useState(PARTICIPATION_TYPES[0].label);
  const [kundCount, setKundCount] = useState<number>(1);
  const [selectedKunds, setSelectedKunds] = useState<number[]>([
    initialKund && initialKund > RESERVED_KUNDS_COUNT ? initialKund : 10,
  ]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setMobile(currentUser.mobile);
      if (currentUser.city) setCity(currentUser.city);
      if (currentUser.gotra) setGotra(currentUser.gotra);
      if (currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialKund && initialKund > RESERVED_KUNDS_COUNT) {
      setSelectedKunds([initialKund]);
    }
  }, [initialKund]);

  const handleKundCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    setKundCount(validCount);
    // If fewer kunds are currently selected than new count, keep existing
    // If more are selected, slice to new count
    if (selectedKunds.length > validCount) {
      setSelectedKunds(selectedKunds.slice(0, validCount));
    }
  };

  const handleToggleKund = (kundNum: number) => {
    if (selectedKunds.includes(kundNum)) {
      if (selectedKunds.length > 1) {
        setSelectedKunds(selectedKunds.filter((k) => k !== kundNum));
      }
    } else {
      if (selectedKunds.length < kundCount) {
        setSelectedKunds([...selectedKunds, kundNum]);
      } else {
        // If single kund, replace; if multiple, replace last
        if (kundCount === 1) {
          setSelectedKunds([kundNum]);
        } else {
          setSelectedKunds([...selectedKunds.slice(0, kundCount - 1), kundNum]);
        }
      }
    }
  };

  // Requirement 2: System calculates the total amount at ₹1,100 per Kund
  const totalAmount = kundCount * 1100;

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    const cleanMob = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMob.length !== 10) {
      setAuthError('कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }
    const found = devotees.find((d) => d.mobile === cleanMob);
    if (!found) {
      setAuthError('इस मोबाइल नंबर से कोई साधक खाता पंजीकृत नहीं है। कृपया नया खाता बनाएं।');
      return;
    }
    if (found.password !== loginPassword) {
      setAuthError('पासवर्ड अमान्य है। कृपया पुनः प्रयास करें।');
      return;
    }
    setCurrentUser(found);
    localStorage.setItem('yagya_devotee_user', JSON.stringify(found));
    setFullName(found.fullName);
    setCity(found.city || 'नोएडा');
    setGotra(found.gotra || '');
    setAuthSuccess('✓ साधक खाता सफलतापूर्वक प्रमाणित हो गया!');
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('कृपया मुख्य यजमान का पूरा नाम दर्ज करें।');
      return;
    }
    const cleanMob = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMob.length !== 10) {
      setFormError('कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }

    let devoteeRecord = currentUser;
    if (!currentUser) {
      if (!accountPassword || accountPassword.length < 4) {
        setFormError('कृपया कम से कम 4 अक्षरों का पासवर्ड बनाएं ताकि आप अगली बार लॉगिन करके अपनी रसीद व पास प्राप्त कर सकें।');
        return;
      }
      const existing = devotees.find((d) => d.mobile === cleanMob);
      if (existing) {
        if (existing.password === accountPassword) {
          devoteeRecord = existing;
          setCurrentUser(existing);
          localStorage.setItem('yagya_devotee_user', JSON.stringify(existing));
        } else {
          setFormError('यह मोबाइल पहले से पंजीकृत है। कृपया लॉगिन करें अथवा सही पासवर्ड दर्ज करें।');
          return;
        }
      } else {
        devoteeRecord = {
          id: `dev-${Date.now()}`,
          fullName: fullName.trim(),
          mobile: cleanMob,
          password: accountPassword,
          city: city.trim(),
          gotra: gotra.trim(),
          email: email.trim(),
        };
        setDevotees((prev) => [...prev, devoteeRecord!]);
        setCurrentUser(devoteeRecord);
        localStorage.setItem('yagya_devotee_user', JSON.stringify(devoteeRecord));
      }
    }

    if (selectedKunds.length === 0) {
      setFormError('कृपया 10 से 108 में से किसी उपलब्ध हवन कुंड का चयन करें।');
      return;
    }

    const primaryKund = selectedKunds[0];
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const token = `MUMY-26-K${String(primaryKund).padStart(2, '0')}-${cleanMob.slice(-2)}${randHex}`;
    const id = `reg-${Date.now()}-${randHex}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const tempRegistration: Registration = {
      id,
      token,
      userId: devoteeRecord?.id,
      fullName: fullName.trim(),
      husbandName: fullName.trim(),
      wifeName: wifeName.trim() || undefined,
      mobile: cleanMob,
      email: email.trim() || undefined,
      city: city.trim(),
      gotra: gotra.trim() || undefined,
      kundNumber: primaryKund,
      kundNumbers: selectedKunds,
      kundCount: kundCount,
      date,
      timeSlot: '9:00 AM (प्रातः 09:00 AM)',
      participationType,
      personCount: kundCount * 2,
      amount: totalAmount,
      paymentStatus: 'temp_hold',
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    onProceedToPayment(tempRegistration);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 shadow-xs flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-[#8a1523] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-stone-800 leading-relaxed">
          <span className="font-bold text-[#8a1523]">महत्वपूर्ण नियम व व्यवस्थापक सत्यापन:</span>
          <p className="mt-0.5 text-stone-700">
            हवन कुंड आरक्षण के उपरांत, आश्रम के <strong>व्यवस्थापक (Admin) द्वारा बैंक खाते से UTR मिलान करने के बाद ही आधिकारिक डिजिटल टोकन एवं प्रवेश पास जारी किया जाएगा।</strong>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-xs">
        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-300 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : '✓'}
              </div>
              <div>
                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>प्रमाणित साधक खाता लॉगिन है</span>
                </div>
                <div className="text-sm font-bold text-stone-900 font-serif">
                  {currentUser.fullName} (+91 {currentUser.mobile})
                </div>
              </div>
            </div>
            <span className="text-xs text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 font-medium">
              अगली बार इसी खाते में रसीद सुरक्षित रहेगी
            </span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-stone-200 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#8a1523]" />
                <span className="font-bold text-sm sm:text-base text-stone-900 font-serif">
                  साधक खाता एवं क्रेडेंशियल्स (भविष्य में रसीद देखने हेतु)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExistingLoginMode(!isExistingLoginMode)}
                className="text-xs font-bold text-[#8a1523] hover:underline cursor-pointer"
              >
                {isExistingLoginMode ? 'नया साधक खाता बनाएं' : 'पहले से खाता है? लॉगिन करें'}
              </button>
            </div>

            {authError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {isExistingLoginMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पंजीकृत मोबाइल नंबर *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पासवर्ड *
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="पासवर्ड दर्ज करें"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  className="w-full py-2 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>खाता लॉगिन करें</span>
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-stone-700">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>रसीद सुरक्षित रखने हेतु पासवर्ड बनाएं:</span>
                </div>
                <p>
                  नीचे दिए गए फ़ॉर्म में अपना 10 अंकों का मोबाइल नंबर और एक सरल पासवर्ड बनाएं। यह सुरक्षित हो जाएगा, जिससे अगली बार आप केवल मोबाइल और पासवर्ड डालकर अपनी स्वीकृत रसीद व पास डाउनलोड कर सकेंगे।
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-[#e8ddcb] p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 border-b border-stone-200 pb-3 mb-5">
          हवन कुंड यजमान पंजीकरण फ़ॉर्म
        </h2>

        <form onSubmit={handleSubmitBooking} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                मुख्य यजमान का पूरा नाम <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="उदा. राम प्रसाद शर्मा"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                सह-यजमान / धर्मपत्नी का नाम
              </label>
              <input
                type="text"
                placeholder="उदा. श्रीमती सीता शर्मा"
                value={wifeName}
                onChange={(e) => setWifeName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                मोबाइल नंबर (10 अंक) <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-mono"
              />
            </div>

            {!currentUser && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  साधक खाता पासवर्ड बनाएं <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="कम से कम 4 अक्षर या अंक"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                शहर / नगर <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="उदा. नोएडा / दिल्ली"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                गोत्र (वैकल्पिक)
              </label>
              <input
                type="text"
                placeholder="उदा. कश्यप / भारद्वाज"
                value={gotra}
                onChange={(e) => setGotra(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="border-t border-stone-200 pt-5 space-y-4">
            <h3 className="text-base font-bold font-serif text-stone-900 flex items-center justify-between">
              <span>महायज्ञ तिथि, समय (9:00 AM) एवं हवन कुंड संख्या</span>
              <span className="text-xs font-bold text-[#872e18] bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                ₹ 1,100 प्रति कुंड
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  1. यज्ञ दिवस व तिथि <span className="text-rose-600">*</span>
                </label>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 cursor-pointer shadow-2xs"
                >
                  {YAGYA_DATES.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  2. यज्ञ समय <span className="text-emerald-700 font-bold">(9:00 AM नियत)</span>
                </label>
                <div className="w-full px-3 py-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-[#8a1523] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8a1523]" />
                    <span>9:00 AM (प्रातः 09:00 AM)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-bold">
                    एकल सत्र
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  3. हवन कुंडों की संख्या (₹1,100/कुंड) <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={kundCount}
                    onChange={(e) => handleKundCountChange(Number(e.target.value))}
                    className="w-20 px-3 py-2.5 bg-white border-2 border-amber-400 rounded-xl text-xs sm:text-sm font-black text-[#872e18] text-center shadow-2xs"
                  />
                  <div className="flex items-center gap-1 flex-1">
                    {[1, 2, 3, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleKundCountChange(cnt)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          kundCount === cnt
                            ? 'bg-[#8a1523] text-white border-[#8a1523] shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold font-serif text-stone-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <span>अग्नि कुंड संख्या चुनें (10 से 108)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  कुंड 1 से 9 संतों व वेदाचार्यों के लिए आरक्षित हैं। आप {kundCount} कुंड चुन सकते हैं।
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 font-bold px-3 py-1.5 rounded-xl text-xs border border-amber-300">
                <Flame className="w-4 h-4 text-amber-700" />
                <span>
                  चयनित {selectedKunds.length}/{kundCount} कुंड:{' '}
                  {selectedKunds.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')}
                </span>
              </div>
            </div>

            <div className="bg-[#faf5eb] p-3 sm:p-4 rounded-2xl border border-amber-200">
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-56 overflow-y-auto p-1">
                {kundSummary.list.map((k) => {
                  const isReservedSant = k.isReserved;
                  const isSelected = selectedKunds.includes(k.kundNumber);
                  const isFull = !isReservedSant && k.bookedCount >= 2;

                  return (
                    <button
                      key={k.kundNumber}
                      type="button"
                      disabled={isReservedSant || isFull}
                      onClick={() => handleToggleKund(k.kundNumber)}
                      className={`p-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isReservedSant
                          ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                          : isFull
                          ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#8a1523] text-white shadow-md scale-105 border-2 border-amber-400 font-black'
                          : 'bg-white hover:bg-amber-100 text-stone-800 border border-stone-300'
                      }`}
                      title={
                        isReservedSant
                          ? 'संतों व आचार्यों हेतु आरक्षित'
                          : isFull
                          ? 'यह कुंड पूर्ण है'
                          : `हवन कुंड #${k.formattedNumber} चुनें`
                      }
                    >
                      <span className="text-[9px] opacity-70">#</span>
                      <span className="text-xs font-black">{k.formattedNumber}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
            <span className="text-lg leading-none">📲</span>
            <div className="leading-relaxed">
              <span className="font-bold text-emerald-900 block mb-0.5">WhatsApp स्वचालित विवरण सेवा:</span>
              दक्षिणा UTR जमा करने के उपरांत, आश्रम के व्यवस्थापक (Admin) द्वारा बैंक सत्यापन होते ही आपका <strong>आधिकारिक टोकन नंबर, हवन कुंड संख्या एवं सभी विवरण आपके पंजीकृत मोबाइल नंबर (+91 {mobile || 'XXXXXXXXXX'}) पर WhatsApp द्वारा</strong> भेज दिए जाएंगे।
            </div>
          </div>

          <div className="border-t border-stone-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                कुल देय दक्षिणा (Total Amount)
              </span>
              <span className="text-3xl font-black text-[#872e18]">
                ₹ {totalAmount}
              </span>
              <span className="text-xs font-bold text-stone-600 ml-2">
                ({kundCount} हवन कुंड × ₹ 1,100 प्रति कुंड)
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>अस्थायी आरक्षण करें व दक्षिणा जमा करें</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
