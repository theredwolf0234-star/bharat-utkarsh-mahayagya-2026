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
  Lock,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { DevoteeUser, Registration, KundSummary, KundLiveItem } from '../types/yagya';
import {
  YAGYA_DATES,
  YAGYA_TIME,
  TIME_SLOTS,
  PARTICIPATION_TYPES,
  DEFAULT_PRICE_PER_PERSON,
  RESERVED_KUNDS_COUNT,
  DAKSHINA_PRESET_OPTIONS,
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
  onBack?: () => void;
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
  onBack,
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
  const [kundCount] = useState<number>(1); // Single kund per registered number
  const [selectedKunds, setSelectedKunds] = useState<number[]>([
    initialKund && initialKund > RESERVED_KUNDS_COUNT ? initialKund : 10,
  ]);
  const [formError, setFormError] = useState('');
  const [isLocking, setIsLocking] = useState(false);

  // Real-time server live status for all 108 Kunds
  const [liveKunds, setLiveKunds] = useState<KundLiveItem[]>([]);

  // Multiple Dakshina Options (Not fixed: 2100, 5100, 100000, and Custom)
  const [selectedDakshina, setSelectedDakshina] = useState<number>(2100);
  const [isCustomDakshina, setIsCustomDakshina] = useState<boolean>(false);
  const [customAmountText, setCustomAmountText] = useState<string>('');

  const finalDakshinaAmount = isCustomDakshina
    ? (Number(customAmountText) > 0 ? Number(customAmountText) : 2100)
    : selectedDakshina;
  const totalAmount = finalDakshinaAmount;

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

  const handleSelectKund = (kundNum: number) => {
    setSelectedKunds([kundNum]);
  };

  const cleanMob = mobile.replace(/\D/g, '').slice(-10);

  const fetchKundStatus = async () => {
    try {
      const mobParam = cleanMob.length === 10 ? `&mobile=${cleanMob}` : '';
      const res = await fetch(`/api/kunds/status?date=${date}${mobParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.kunds)) {
          setLiveKunds(data.kunds);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchKundStatus();
    const interval = setInterval(fetchKundStatus, 3000);
    return () => clearInterval(interval);
  }, [date, cleanMob]);

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
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

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('कृपया मुख्य यजमान का पूरा नाम दर्ज करें।');
      return;
    }
    if (cleanMob.length !== 10) {
      setFormError('कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }

    if (isCustomDakshina && (!customAmountText || Number(customAmountText) < 100)) {
      setFormError('कृपया वैध सहयोग दक्षिणा राशि दर्ज करें (कम से कम ₹100)।');
      return;
    }

    if (selectedKunds.length === 0) {
      setFormError('कृपया 10 से 108 में से किसी उपलब्ध हवन कुंड का चयन करें।');
      return;
    }

    const primaryKund = selectedKunds[0];
    setIsLocking(true);

    // Backend Lock Call: Enforces 1 Kund per day and concurrent lock
    try {
      const lockRes = await fetch('/api/kunds/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundNumber: primaryKund,
          date,
          mobile: cleanMob,
          fullName: fullName.trim(),
          amount: totalAmount,
        }),
      });

      const lockData = await lockRes.json();
      if (!lockRes.ok) {
        setFormError(
          lockData.error ||
            'इस मोबाइल नंबर से इस दिन पहले ही एक कुंड पंजीकृत है। एक मोबाइल नंबर से एक दिन में केवल एक कुंड का पंजीकरण किया जा सकता है।'
        );
        fetchKundStatus();
        setIsLocking(false);
        return;
      }

      let devoteeRecord = currentUser;
      if (!currentUser) {
        if (!accountPassword || accountPassword.length < 4) {
          setFormError('कृपया कम से कम 4 अक्षरों का पासवर्ड बनाएं ताकि आप अगली बार लॉगिन करके अपनी रसीद व पास प्राप्त कर सकें।');
          setIsLocking(false);
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
            setIsLocking(false);
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

      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const token = `MUMY-26-K${String(primaryKund).padStart(2, '0')}-${cleanMob.slice(-2)}${randHex}`;
      const id = `reg-${Date.now()}-${randHex}`;
      const expiresAt = lockData.lock?.lockExpiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();

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
        kundNumbers: [primaryKund],
        kundCount: 1,
        date,
        timeSlot: '9:00 AM (प्रातः 09:00 AM)',
        participationType,
        personCount: wifeName.trim() ? 2 : 1,
        amount: totalAmount,
        paymentStatus: 'temp_hold',
        expiresAt,
        createdAt: new Date().toISOString(),
      };

      // Background temp-hold sync
      fetch('/api/reservations/temp-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempRegistration),
      }).catch((e) => console.warn('Background temp-hold note:', e));

      setIsLocking(false);
      onProceedToPayment(tempRegistration);
    } catch (err: any) {
      setFormError(err.message || 'नेटवर्क त्रुटि: कृपया पुनः प्रयास करें।');
      setIsLocking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
      {/* Previous Arrow Button */}
      {onBack && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-amber-100 text-[#872e18] border border-amber-300 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer group"
            title="मुख्य पृष्ठ पर लौटें"
          >
            <ArrowLeft className="w-4 h-4 text-[#8a1523] group-hover:-translate-x-1 transition-transform" />
            <span>← पिछला पृष्ठ (मुख्य पृष्ठ पर वापस जाएं)</span>
          </button>
          <div className="text-[11px] sm:text-xs text-stone-500 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-stone-200">
            चरण 1 • यजमान विवरण व कुंड चयन
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-start gap-2.5 sm:gap-3">
        <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#8a1523] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-stone-800 leading-relaxed">
          <span className="font-bold text-[#8a1523]">महत्वपूर्ण नियम व व्यवस्थापक सत्यापन:</span>
          <p className="mt-0.5 text-stone-700">
            हवन कुंड आरक्षण के उपरांत, आश्रम के <strong>व्यवस्थापक (Admin) द्वारा बैंक खाते से UTR मिलान करने के बाद ही आधिकारिक डिजिटल टोकन एवं प्रवेश पास जारी किया जाएगा।</strong>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-amber-200 p-4 sm:p-5 shadow-xs">
        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : '✓'}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">प्रमाणित साधक खाता लॉगिन है</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-stone-900 font-serif truncate">
                  {currentUser.fullName} (+91 {currentUser.mobile})
                </div>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 font-medium self-start sm:self-auto">
              अगली बार इसी खाते में रसीद सुरक्षित रहेगी
            </span>
          </div>
        ) : (
          <div>
            <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-1.5 mb-3 border-b border-stone-200 pb-2.5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#8a1523] shrink-0" />
                <span className="font-bold text-xs sm:text-base text-stone-900 font-serif">
                  साधक खाता एवं क्रेडेंशियल्स (रसीद देखने हेतु)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExistingLoginMode(!isExistingLoginMode)}
                className="text-xs font-bold text-[#8a1523] hover:underline cursor-pointer self-start min-[420px]:self-auto"
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
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>रसीद सुरक्षित रखने हेतु पासवर्ड बनाएं:</span>
                </div>
                <p className="leading-relaxed">
                  नीचे दिए गए फ़ॉर्म में अपना 10 अंकों का मोबाइल नंबर और एक सरल पासवर्ड बनाएं। यह सुरक्षित हो जाएगा, जिससे अगली बार आप केवल मोबाइल और पासवर्ड डालकर अपनी स्वीकृत रसीद व पास डाउनलोड कर सकेंगे।
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#e8ddcb] p-4 sm:p-8">
        <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-900 border-b border-stone-200 pb-3 mb-5">
          हवन कुंड यजमान पंजीकरण फ़ॉर्म
        </h2>

        <form onSubmit={handleSubmitBooking} className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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

          {/* Multiple Dakshina Options (Not Fixed: 2100, 5100, 100000, and Custom) */}
          <div className="border-t border-stone-200 pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <label className="block text-sm sm:text-base font-bold font-serif text-stone-900">
                  यज्ञ सहयोग दक्षिणा विकल्प चुनें (Select Dakshina Option) <span className="text-rose-600">*</span>
                </label>
                <p className="text-xs text-stone-500">
                  दक्षिणा राशि नियत नहीं है। आप अपनी श्रद्धा एवं इच्छानुसार सहयोग विकल्प चुन सकते हैं।
                </p>
              </div>
              <span className="text-xs font-bold text-[#872e18] bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 self-start sm:self-auto shrink-0">
                चयनित: ₹ {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {DAKSHINA_PRESET_OPTIONS.map((opt) => {
                const isSelected = !isCustomDakshina && selectedDakshina === opt.amount;
                return (
                  <button
                    key={opt.amount}
                    type="button"
                    onClick={() => {
                      setSelectedDakshina(opt.amount);
                      setIsCustomDakshina(false);
                    }}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1 ${
                      isSelected
                        ? 'border-[#872e18] bg-amber-50 shadow-md ring-2 ring-amber-400'
                        : 'border-stone-300 bg-white hover:border-amber-400 hover:bg-stone-50'
                    }`}
                  >
                    <span className={`text-base sm:text-lg font-black ${isSelected ? 'text-[#872e18]' : 'text-stone-900'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 uppercase">
                      {opt.subtitle}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-black bg-[#872e18] text-amber-200 px-2 py-0.5 rounded-full mt-0.5">
                        ✓ चयनित
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomDakshina(true)}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1 ${
                  isCustomDakshina
                    ? 'border-[#872e18] bg-amber-50 shadow-md ring-2 ring-amber-400'
                    : 'border-stone-300 bg-white hover:border-amber-400 hover:bg-stone-50'
                }`}
              >
                <span className={`text-sm sm:text-base font-bold ${isCustomDakshina ? 'text-[#872e18]' : 'text-stone-900'}`}>
                  अन्य सहयोग राशि
                </span>
                <span className="text-[10px] text-stone-500">
                  इच्छानुसार राशि
                </span>
                {isCustomDakshina && (
                  <span className="text-[9px] font-black bg-[#872e18] text-amber-200 px-2 py-0.5 rounded-full mt-0.5">
                    ✓ चयनित
                  </span>
                )}
              </button>
            </div>

            {isCustomDakshina && (
              <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5 animate-in fade-in">
                <label className="block text-xs font-bold text-[#872e18]">
                  कृपया अपनी इच्छानुसार दक्षिणा सहयोग राशि (₹) दर्ज करें:
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    placeholder="उदा. 11000, 21000, 51000..."
                    value={customAmountText}
                    onChange={(e) => setCustomAmountText(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border-2 border-amber-400 rounded-xl text-stone-900 font-bold text-sm"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 pt-5 space-y-4">
            <h3 className="text-sm sm:text-base font-bold font-serif text-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>महायज्ञ तिथि, समय (9:00 AM) एवं 108 हवन कुंड चयन</span>
              <span className="text-xs font-bold text-[#872e18] bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 self-start sm:self-auto">
                1 मोबाइल = 1 कुंड
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
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
                  2. यज्ञ सत्र समय <span className="text-emerald-700 font-bold">(प्रातः 09:00 AM)</span>
                </label>
                <div className="w-full px-3 py-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-[#8a1523] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-4 h-4 text-[#8a1523] shrink-0" />
                    <span>09:00 AM सत्र</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-md font-bold shrink-0">
                    मुख्य सत्र
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  3. हवन कुंड आरक्षण नियम <span className="text-emerald-700 font-bold">(एकल आरक्षण)</span>
                </label>
                <div className="w-full px-3 py-2.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs sm:text-sm font-bold text-[#8a1523] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Flame className="w-4 h-4 text-[#8a1523] shrink-0" />
                    <span>1 मोबाइल = 1 हवन कुंड</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-950 border border-amber-400 px-2 py-0.5 rounded-md font-bold shrink-0">
                    नियत 1 कुंड
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-serif text-stone-900 flex items-center gap-1.5 sm:gap-2">
                  <Flame className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>अपना एक हवन कुंड चुनें (10 से 108)</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500">
                  कुंड 1 से 9 संतों व वेदाचार्यों के लिए आरक्षित हैं। नीचे से उपलब्ध कुंड पर क्लिक करके चुनें।
                </p>
              </div>

              <div className="inline-flex flex-wrap items-center gap-1.5 bg-amber-100 text-amber-950 font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs border border-amber-300 max-w-full">
                <Flame className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  चयनित हवन कुंड:{' '}
                  {selectedKunds.length > 0 ? `#${String(selectedKunds[0]).padStart(3, '0')}` : 'कोई नहीं'}
                </span>
              </div>
            </div>

            <div className="bg-[#faf5eb] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200">
              <div className="grid grid-cols-4 min-[360px]:grid-cols-5 min-[420px]:grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 sm:gap-2 max-h-56 overflow-y-auto p-1">
                {(liveKunds.length > 0
                  ? liveKunds
                  : kundSummary.list.map((k) => ({
                      kundNumber: k.kundNumber,
                      formattedNumber: k.formattedNumber,
                      status: k.isReserved
                        ? ('RESERVED' as const)
                        : k.bookedCount > 0
                        ? ('BOOKED' as const)
                        : ('AVAILABLE' as const),
                      isSantReserved: k.isReserved,
                    }))
                ).map((k) => {
                  const isSant = k.status === 'RESERVED';
                  const isBooked = k.status === 'BOOKED';
                  const isLocked = k.status === 'LOCKED';
                  const isLockedSelf = Boolean((k as any).isLockedBySelf);
                  const isSelected = selectedKunds.includes(k.kundNumber);

                  let disabled = false;
                  let cardStyle = 'bg-white hover:bg-amber-100 text-stone-800 border border-stone-300';
                  let statusText = 'मुक्त';

                  if (isSant) {
                    disabled = true;
                    cardStyle = 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed';
                    statusText = 'संत';
                  } else if (isBooked) {
                    disabled = true;
                    cardStyle = 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed';
                    statusText = 'आरक्षित';
                  } else if (isLocked && !isLockedSelf) {
                    disabled = true;
                    cardStyle =
                      'bg-amber-100 text-amber-900 border-2 border-dashed border-amber-400 cursor-not-allowed animate-pulse';
                    statusText = '🔒 लॉक्ड';
                  } else if (isSelected) {
                    cardStyle = 'bg-[#8a1523] text-white shadow-md scale-105 border-2 border-amber-400 font-black';
                    statusText = '✓ चयनित';
                  } else if (isLockedSelf) {
                    cardStyle = 'bg-amber-50 text-amber-950 border-2 border-amber-500 font-bold';
                    statusText = 'आपका लॉक';
                  }

                  return (
                    <button
                      key={k.kundNumber}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectKund(k.kundNumber)}
                      className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${cardStyle}`}
                      title={
                        isSant
                          ? 'संतों व आचार्यों हेतु आरक्षित'
                          : isBooked
                          ? 'यह कुंड आरक्षित है'
                          : isLocked && !isLockedSelf
                          ? 'यह कुंड 5 मिनट के लिए अस्थायी लॉक्ड है'
                          : `हवन कुंड #${k.formattedNumber} चुनें`
                      }
                    >
                      <span className="text-[9px] opacity-70">#</span>
                      <span className="text-xs font-black">{k.formattedNumber}</span>
                      <span className="text-[8px] mt-0.5 font-bold truncate max-w-full">
                        {statusText}
                      </span>
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

          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 sm:p-3.5 text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
            <span className="text-base sm:text-lg leading-none shrink-0">📲</span>
            <div className="leading-relaxed">
              <span className="font-bold text-emerald-900 block mb-0.5">WhatsApp स्वचालित विवरण सेवा:</span>
              दक्षिणा UTR जमा करने के उपरांत, आश्रम के व्यवस्थापक (Admin) द्वारा बैंक सत्यापन होते ही आपका <strong>आधिकारिक टोकन नंबर, हवन कुंड संख्या एवं सभी विवरण आपके पंजीकृत मोबाइल नंबर (+91 {mobile || 'XXXXXXXXXX'}) पर WhatsApp द्वारा</strong> भेज दिए जाएंगे।
            </div>
          </div>

          <div className="border-t border-stone-200 pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500 font-bold uppercase tracking-wider block">
                कुल सहयोग दक्षिणा (Selected Dakshina)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#872e18]">
                ₹ {totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-stone-600 ml-2">
                (1 हवन कुंड • एकल यजमान आरक्षण • 5 मिनट सुरक्षित लॉक)
              </span>
            </div>

            <button
              type="submit"
              disabled={isLocking}
              className="w-full sm:w-auto px-6 sm:px-7 py-3.5 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>हवन कुंड लॉक हो रहा है...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>हवन कुंड लॉक करें व दक्षिणा जमा करें (5m)</span>
                  <ChevronRight className="w-4 h-4 text-white shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
