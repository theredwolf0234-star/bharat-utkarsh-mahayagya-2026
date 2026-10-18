import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Phone, 
  KeyRound, 
  ShieldCheck, 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Printer, 
  RefreshCw, 
  LogOut, 
  Flame, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  EyeOff,
  AlertCircle,
  Mail,
  ArrowLeft,
  Send
} from 'lucide-react';
import { Registration, DevoteeUser } from '../types/yagya';
import { Language, translations } from '../utils/i18n';
import { MaharishiPortrait } from './MaharishiPortrait';

interface Props {
  lang: Language;
  onOpenPrintSlip: (reg: Registration) => void;
  onBookNewKund: () => void;
  onSelectPaymentReg?: (reg: Registration) => void;
  currentUser: DevoteeUser | null;
  onUserLogin: (user: DevoteeUser, token: string) => void;
  onUserLogout: () => void;
}

export const DevoteePortal: React.FC<Props> = ({
  lang,
  onOpenPrintSlip,
  onBookNewKund,
  onSelectPaymentReg,
  currentUser,
  onUserLogin,
  onUserLogout,
}) => {
  const t = translations[lang] || translations.hi;

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'search' | 'forgot'>('login');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('नोएडा');
  const [gotra, setGotra] = useState('');
  const [email, setEmail] = useState('');

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [resetAuthToken, setResetAuthToken] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');
  const [forgotDebugCode, setForgotDebugCode] = useState('');

  // Lookup state
  const [searchToken, setSearchToken] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResult, setSearchResult] = useState<Registration | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Devotee tickets state
  const [myTickets, setMyTickets] = useState<Registration[]>([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);

  // Fetch logged in devotee's tickets
  const fetchMyTickets = async () => {
    const token = localStorage.getItem('yagya_devotee_token');
    if (!token) return;

    setIsFetchingTickets(true);
    try {
      const res = await fetch('/api/user/my-tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tickets && Array.isArray(data.tickets)) {
          setMyTickets(data.tickets);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch user tickets:', e);
    } finally {
      setIsFetchingTickets(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMyTickets();
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!password) {
      setErrorMsg('कृपया पासवर्ड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'लॉगिन विफल रहा।');
        return;
      }

      localStorage.setItem('yagya_devotee_token', data.token);
      localStorage.setItem('yagya_devotee_user', JSON.stringify(data.user));
      onUserLogin(data.user, data.token);
      setSuccessMsg('स्वागत है! आपका खाता सफलतापूर्वक लॉगिन हुआ।');
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि।');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Request OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setForgotNotice('');
    setForgotDebugCode('');

    const cleanIdent = forgotIdentifier.trim();
    if (!cleanIdent) {
      setErrorMsg('कृपया अपना पंजीकृत मोबाइल नंबर या ईमेल आईडी दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'अनुरोध विफल रहा।');
        return;
      }

      setSuccessMsg(data.message || 'सत्यापन कोड भेज दिया गया है।');
      if (data.requiredConfigNotice) {
        setForgotNotice(data.requiredConfigNotice);
      }
      if (data.debugCode) {
        setForgotDebugCode(data.debugCode);
      }
      setForgotStep('verify');
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि।');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMsg('कृपया 6 अंकों का OTP सत्यापन कोड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim(), otp: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'OTP सत्यापन विफल रहा।');
        return;
      }

      setResetAuthToken(data.resetAuthToken);
      setSuccessMsg(data.message || 'सत्यापन सफल! अब नया पासवर्ड बनाएं।');
      setForgotStep('reset');
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि।');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (forgotNewPassword.length < 6) {
      setErrorMsg('सुरक्षा नियम: नया पासवर्ड न्यूनतम 6 अक्षरों का होना आवश्यक है।');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetAuthToken,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'पासवर्ड रीसेट विफल रहा।');
        return;
      }

      setSuccessMsg('🎉 पासवर्ड सफलतापूर्वक बदल दिया गया है! कृपया नए पासवर्ड से लॉगिन करें।');
      setAuthMode('login');
      setPassword('');
      setForgotStep('request');
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setResetAuthToken('');
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क त्रुटि।');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (!fullName.trim()) {
      setErrorMsg('कृपया अपना पूरा नाम दर्ज करें।');
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('पासवर्ड न्यूनतम 4 अक्षरों का होना चाहिए।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: cleanMobile,
          password,
          city: city.trim(),
          gotra: gotra.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'पंजीकरण विफल रहा।');
        return;
      }

      localStorage.setItem('yagya_devotee_token', data.token);
      localStorage.setItem('yagya_devotee_user', JSON.stringify(data.user));
      onUserLogin(data.user, data.token);
      setSuccessMsg('खाता सफलतापूर्वक निर्मित हुआ!');
    } catch (err: any) {
      setErrorMsg(err.message || 'पंजीकरण में त्रुटि।');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single pass search by Token & Mobile (strict privacy)
  const handleDirectSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSearchResult(null);

    const cleanToken = searchToken.trim().toUpperCase();
    const cleanMob = searchMobile.replace(/\D/g, '').slice(-10);

    if (!cleanToken || cleanMob.length !== 10) {
      setErrorMsg('सुरक्षा नियम: पास खोजने हेतु टोकन संख्या एवं पंजीकृत 10 अंकों का मोबाइल नंबर दोनों आवश्यक हैं।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/registrations/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken, mobile: cleanMob }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'प्रवेश पत्र नहीं मिला। कृपया दोनों विवरण पुनः जाँचें।');
        return;
      }
      setSearchResult(data.result);
    } catch (e: any) {
      setErrorMsg(e.message || 'खोज में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW: LOGGED IN DEVOTEE TICKETS DASHBOARD
  // -------------------------------------------------------------
  if (currentUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Devotee Profile Header */}
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] text-white rounded-3xl p-5 sm:p-7 shadow-xl border-2 border-amber-500/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none text-9xl font-serif">
            ॐ
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-[#4a0e17] flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-amber-200">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'य'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-amber-200">
                    {currentUser.fullName}
                  </h2>
                  <span className="text-[10px] bg-emerald-800/80 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                    ✓ अधिकृत यजमान
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-100/80 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-300" />
                    +91 {currentUser.mobile}
                  </span>
                  {currentUser.city && (
                    <span>• {currentUser.city}</span>
                  )}
                  {currentUser.gotra && (
                    <span>• गोत्र: {currentUser.gotra}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchMyTickets}
                disabled={isFetchingTickets}
                className="bg-white/10 hover:bg-white/20 text-amber-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-amber-400/30 cursor-pointer"
                title="अपडेट चेक करें"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTickets ? 'animate-spin' : ''}`} />
                <span>अपडेट जांचें</span>
              </button>

              <button
                onClick={onBookNewKund}
                className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-700" />
                <span>नया कुंड बुक करें</span>
              </button>

              <button
                onClick={onUserLogout}
                className="bg-rose-950/60 hover:bg-rose-900 text-rose-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 border border-rose-400/30 transition-all cursor-pointer"
                title="लॉगआउट"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">लॉगआउट</span>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Shield Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-stone-800">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-[#872e18]">पूर्ण गोपनीयता सक्रिय:</span> केवल आपके द्वारा बुक किए गए हवन कुंड प्रवेश पत्र और उनकी स्थिति ही इस डैशबोर्ड पर दिख रही है। अन्य किसी भी यजमान का विवरण आपके समक्ष प्रकट नहीं होता और न ही कोई दूसरा व्यक्ति आपके पास देख सकता है।
          </div>
        </div>

        {/* My Tickets List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#872e18] flex items-center gap-2 font-heading">
              <Ticket className="w-5 h-5 text-amber-600" />
              <span>मेरे महायज्ञ प्रवेश पत्र ({myTickets.length})</span>
            </h3>
            <span className="text-xs text-stone-500">
              यज्ञ स्थल: रामलीला मैदान, महर्षि नगर, सेक्टर-110, नोएडा
            </span>
          </div>

          {myTickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-amber-300 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
                <Ticket className="w-8 h-8 opacity-60" />
              </div>
              <h4 className="text-base font-bold text-stone-800">
                आपके खाते में अभी तक कोई प्रवेश पत्र नहीं है
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                १०८ कुण्डीय भारत उत्कर्ष महायज्ञ में अपनी पवित्र उपस्थिति सुनिश्चित करने हेतु अपना पावन हवन कुंड आरक्षित करें।
              </p>
              <button
                onClick={onBookNewKund}
                className="bg-[#872e18] hover:bg-[#6b2210] text-amber-100 font-bold px-6 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 text-sm cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>अभी हवन कुंड चुनें एवं आरक्षित करें</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myTickets.map((ticket) => {
                const isPaid = ticket.paymentStatus === 'paid';
                const isPending = ticket.paymentStatus === 'pending';
                const isHold = ticket.paymentStatus === 'temp_hold';
                const isRejected = ticket.paymentStatus === 'rejected';
                const isCounter = ticket.paymentStatus === 'counter_pay';

                return (
                  <div
                    key={ticket.id || ticket.token}
                    className="bg-white rounded-2xl border-2 border-stone-200 hover:border-amber-400 p-5 shadow-sm transition-all overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#872e18] text-amber-200 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 shadow-xs">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span>कुंड #{String(ticket.kundNumber).padStart(3, '0')}</span>
                        </div>
                        <div>
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            टोकन: {ticket.token}
                          </span>
                          <div className="text-[11px] text-stone-500">
                            {ticket.participationType || 'दंपति यजमान'} • {ticket.personCount || 2} व्यक्ति
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {isPaid && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>स्वीकृत एवं स्थायी आरक्षित</span>
                          </span>
                        )}

                        {isPending && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>व्यवस्थापक सत्यापन लंबित</span>
                          </span>
                        )}

                        {isHold && (
                          <span className="bg-orange-100 text-orange-900 border border-orange-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-orange-600" />
                            <span>अस्थायी आरक्षण (भुगतान शेष)</span>
                          </span>
                        )}

                        {isCounter && (
                          <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                            <span>काउंटर देय आरक्षित</span>
                          </span>
                        )}

                        {isRejected && (
                          <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>अस्वीकृत</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs border-b border-stone-100">
                      <div>
                        <span className="text-stone-500 block">तिथि:</span>
                        <span className="font-bold text-stone-900 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-amber-700" />
                          {ticket.date}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">सत्र:</span>
                        <span className="font-medium text-stone-800 block mt-0.5">
                          {ticket.timeSlot || 'प्रातः 08:00 AM से 11:00 AM'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">दक्षिणा:</span>
                        <span className="font-bold text-stone-900 block mt-0.5">
                          ₹{ticket.amount}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">बैंक UTR:</span>
                        <span className="font-mono font-bold text-stone-800 block mt-0.5">
                          {ticket.utrNumber || 'लंबित'}
                        </span>
                      </div>
                    </div>

                    {/* Pending Verification Notice */}
                    {isPending && (
                      <div className="mt-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">सत्यापन प्रक्रिया जारी है:</span> आपका 12 अंकों का UTR ({ticket.utrNumber}) एवं भुगतान स्क्रीनशॉट आश्रम कार्यालय को प्राप्त हो चुका है। बैंक खाते में राशि की पुष्टि होते ही यहाँ स्वतः 'स्वीकृत' चिन्ह प्रकट हो जाएगा और आप अपना आधिकारिक प्रवेश पत्र प्रिंट कर सकेंगे।
                        </div>
                      </div>
                    )}

                    {/* Rejection Notice */}
                    {isRejected && (
                      <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-950 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold">अस्वीकृति का कारण:</span> {ticket.rejectionReason || 'बैंक खाते में दक्षिणा राशि प्राप्त नहीं हुई या अमान्य UTR संख्या।'}
                          <div className="mt-2">
                            <button
                              onClick={onBookNewKund}
                              className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                            >
                              पुनः नया हवन कुंड चुनें
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-1">
                      <span className="text-[11px] text-stone-500">
                        यजमान: {ticket.fullName || ticket.husbandName} {ticket.wifeName ? `एवं ${ticket.wifeName}` : ''}
                      </span>

                      <div className="flex items-center gap-2">
                        {isHold && onSelectPaymentReg && (
                          <button
                            onClick={() => onSelectPaymentReg(ticket)}
                            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span>भुगतान प्रमाण जमा करें</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {(isPaid || isCounter) && (
                          <button
                            onClick={() => onOpenPrintSlip(ticket)}
                            className="bg-[#872e18] hover:bg-[#6b2210] text-amber-200 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>प्रवेश पत्र देखें व प्रिंट करें</span>
                          </button>
                        )}
                      </div>
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

  // -------------------------------------------------------------
  // VIEW: LOGIN / SIGNUP / TICKET LOOKUP PORTAL
  // -------------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto py-4 px-2 sm:px-4">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-200 overflow-hidden">
        {/* Vedic Banner Header */}
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 left-4 text-amber-400 opacity-20 text-3xl font-serif">ॐ</div>
          <div className="absolute top-2 right-4 text-amber-400 opacity-20 text-3xl font-serif">卐</div>

          <div className="flex justify-center mb-3">
            <MaharishiPortrait size="sm" showBlessing={false} />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-heading text-amber-200">
            यजमान टिकट एवं प्रवेश पत्र पोर्टल
          </h2>
          <p className="text-xs text-amber-100/80 mt-1">
            श्री सिद्धेश्वर धाम • १०८ कुण्डीय भारत उत्कर्ष महायज्ञ २०२६
          </p>

          {/* Privacy Guarantee Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-black/40 border border-amber-400/30 px-3 py-1 rounded-full text-[11px] text-amber-200">
            <Lock className="w-3 h-3 text-amber-300" />
            <span>गोपनीयता नियम: किसी अन्य यजमान का पास आपको नहीं दिखेगा</span>
          </div>
        </div>

        {/* Tab Switcher */}
        {authMode === 'forgot' ? (
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 bg-amber-50/70">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-xs font-bold text-[#872e18] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>लॉगिन पेज पर वापस जाएं</span>
            </button>
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              सुरक्षित खाता रिकवरी
            </span>
          </div>
        ) : (
          <div className="flex border-b border-stone-200 bg-stone-50">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'border-[#872e18] text-[#872e18] bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              लॉगिन करें (Login)
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'border-[#872e18] text-[#872e18] bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              नया खाता बनाएं (Sign Up)
            </button>
            <button
              onClick={() => { setAuthMode('search'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-all cursor-pointer ${
                authMode === 'search'
                  ? 'border-[#872e18] text-[#872e18] bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              टोकन पास खोजें
            </button>
          </div>
        )}

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  पंजीकृत १० अंकों का मोबाइल नंबर:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  पासवर्ड:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="अपना गुप्त पासवर्ड दर्ज करें"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                      setForgotNotice('');
                      setForgotDebugCode('');
                      setForgotStep('request');
                      setForgotIdentifier(mobile || '');
                    }}
                    className="text-xs text-[#872e18] hover:text-[#5e190b] font-bold hover:underline cursor-pointer"
                  >
                    पासवर्ड भूल गए? (Forgot Password?)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#872e18] hover:bg-[#6b2210] text-amber-200 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 text-amber-300" />
                )}
                <span>लॉगिन करें एवं अपने पास देखें</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-600">खाता नहीं है? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-xs font-bold text-[#872e18] hover:underline cursor-pointer"
                >
                  यहाँ नया खाता बनाएं
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD FLOW */}
          {authMode === 'forgot' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold pb-2 border-b border-stone-200">
                <span className={`flex items-center gap-1 ${forgotStep === 'request' ? 'text-[#872e18]' : 'text-stone-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${forgotStep === 'request' ? 'bg-[#872e18] text-white' : 'bg-stone-100'}`}>1</span>
                  पहचान सत्यापन
                </span>
                <span className="text-stone-300">→</span>
                <span className={`flex items-center gap-1 ${forgotStep === 'verify' ? 'text-[#872e18]' : 'text-stone-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${forgotStep === 'verify' ? 'bg-[#872e18] text-white' : 'bg-stone-100'}`}>2</span>
                  OTP कोड
                </span>
                <span className="text-stone-300">→</span>
                <span className={`flex items-center gap-1 ${forgotStep === 'reset' ? 'text-[#872e18]' : 'text-stone-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${forgotStep === 'reset' ? 'bg-[#872e18] text-white' : 'bg-stone-100'}`}>3</span>
                  नया पासवर्ड
                </span>
              </div>

              {/* Informational Notice if server delivery requires configuration */}
              {forgotNotice && (
                <div className="bg-amber-50 border border-amber-300 text-stone-800 text-xs p-3 rounded-xl space-y-1">
                  <div className="font-bold text-[#872e18] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>सर्वर सूचना (Delivery Status)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-600 whitespace-pre-line">
                    {forgotNotice}
                  </p>
                </div>
              )}

              {/* Debug Testing Code Badge if available in testing mode */}
              {forgotDebugCode && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold">सत्यापन परीक्षण कोड: </span>
                    <span className="font-mono text-base font-extrabold tracking-widest text-[#872e18] ml-1">
                      {forgotDebugCode}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    परीक्षण मोड
                  </span>
                </div>
              )}

              {/* STEP 1: Request OTP */}
              {forgotStep === 'request' && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      पंजीकृत मोबाइल नंबर अथवा ईमेल आईडी:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="10 अंकों का मोबाइल नंबर या email@domain.com"
                        className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      सुरक्षा नियम: आपके खाते की पहचान गोपनीय रखी जाएगी।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#872e18] hover:bg-[#6b2210] text-amber-200 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-amber-300" />
                    )}
                    <span>सत्यापन OTP कोड प्राप्त करें</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-xs font-bold text-stone-600 hover:text-[#872e18] hover:underline cursor-pointer"
                    >
                      लॉगिन पेज पर वापस जाएं
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify OTP */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                    <span className="text-stone-500">पहचानकर्ता: </span>
                    <span className="font-bold text-stone-800">{forgotIdentifier}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      6-अंकों का OTP कोड दर्ज करें:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18]"
                      required
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      यह कोड 10 मिनट के लिए मान्य है एवं केवल 1 बार उपयोग किया जा सकता है।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#872e18] hover:bg-[#6b2210] text-amber-200 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-amber-300" />
                    )}
                    <span>OTP सत्यापित करें</span>
                  </button>

                  <div className="flex justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => { setForgotStep('request'); setErrorMsg(''); }}
                      className="text-stone-500 hover:text-stone-800 hover:underline cursor-pointer"
                    >
                      पहचान बदलें
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestReset}
                      disabled={isLoading}
                      className="text-[#872e18] font-bold hover:underline cursor-pointer"
                    >
                      पुनः कोड भेजें
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Set New Password */}
              {forgotStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      नया गुप्त पासवर्ड (न्यूनतम 6 अक्षर):
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="कम से कम 6 अक्षरों का नया पासवर्ड"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      नए पासवर्ड की पुष्टि करें:
                    </label>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="वही पासवर्ड पुनः दर्ज करें"
                      className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    )}
                    <span>पासवर्ड बदलें और सुरक्षित करें</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. SIGNUP FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पूरा नाम (Full Name): *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="उदा: राम प्रसाद शर्मा"
                  className="w-full px-3.5 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  १० अंकों का मोबाइल नंबर: *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पासवर्ड (Password): *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="न्यूनतम 4 अक्षर या अंक"
                  className="w-full px-3.5 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    शहर / नगर (City):
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="उदा: नोएडा"
                    className="w-full px-3.5 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    गोत्र (Gotra):
                  </label>
                  <input
                    type="text"
                    value={gotra}
                    onChange={(e) => setGotra(e.target.value)}
                    placeholder="उदा: भारद्वाज"
                    className="w-full px-3.5 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ईमेल (वैकल्पिक):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="devotee@example.com"
                  className="w-full px-3.5 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#872e18] hover:bg-[#6b2210] text-amber-200 font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>खाता बनाएं एवं पास सुरक्षित करें</span>
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-stone-600">पहले से खाता है? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-[#872e18] hover:underline cursor-pointer"
                >
                  यहाँ लॉगिन करें
                </button>
              </div>
            </form>
          )}

          {/* 3. STRICT PRIVACY TOKEN LOOKUP FORM */}
          {authMode === 'search' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-700">
                <span className="font-bold text-[#872e18]">सुरक्षा नियम:</span> अन्य यजमानों के पास सुरक्षित रखने के लिए पास केवल तभी दिखेगा जब टोकन संख्या और पंजीकृत मोबाइल नंबर दोनों सही होंगे।
              </div>

              <form onSubmit={handleDirectSearch} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    प्रवेश पत्र टोकन संख्या (Token ID): *
                  </label>
                  <input
                    type="text"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    placeholder="उदा: MUMY-26-K15-99A1B2"
                    className="w-full px-3.5 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पंजीकृत मोबाइल नंबर (Registered Mobile): *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono text-sm">
                      +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={searchMobile}
                      onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-2.2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#872e18] text-sm font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#872e18] hover:bg-[#6b2210] text-amber-200 font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                  )}
                  <span>प्रवेश पत्र खोजें (Verify & Find)</span>
                </button>
              </form>

              {/* Search Result Card */}
              {searchResult && (
                <div className="mt-4 p-4 border-2 border-emerald-500 bg-emerald-50/50 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>प्रवेश पत्र पाया गया</span>
                    </span>
                    <span className="font-mono text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      {searchResult.token}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                    <div>
                      <span className="text-stone-500">यजमान:</span>{' '}
                      <span className="font-bold">{searchResult.fullName || searchResult.husbandName}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">कुंड:</span>{' '}
                      <span className="font-bold">#{String(searchResult.kundNumber).padStart(3, '0')}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">तिथि:</span>{' '}
                      <span className="font-bold">{searchResult.date}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">स्थिति:</span>{' '}
                      <span className="font-bold capitalize">{searchResult.paymentStatus}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPrintSlip(searchResult)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>प्रवेश पत्र खोलें व प्रिंट करें</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
