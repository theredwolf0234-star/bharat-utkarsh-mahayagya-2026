import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Registration, PaymentStatus } from '../types/yagya';
import { validateUpiUtr } from '../utils/utrValidator';
import { saveLatestUserBooking } from '../utils/storage';
import { saveRegistrationToSupabase, uploadScreenshotToStorage } from '../utils/supabase';
import { Language, translations } from '../utils/i18n';
import { 
  Copy, 
  Check, 
  ShieldCheck, 
  Flame, 
  AlertCircle, 
  Printer, 
  RefreshCw, 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Beaker, 
  ArrowLeft,
  Eye,
  FileCheck
} from 'lucide-react';

interface Props {
  pendingData: any | null;
  confirmedRegistration: Registration | null;
  allRegistrations: Registration[];
  onPaymentSuccess: (confirmedReg: Registration) => void;
  onGoToRegistration: () => void;
  onOpenSlip: (reg: Registration) => void;
  lang: Language;
  isTestMode?: boolean;
}

export const PaymentTab: React.FC<Props> = ({
  pendingData,
  confirmedRegistration,
  allRegistrations,
  onPaymentSuccess,
  onGoToRegistration,
  onOpenSlip,
  lang,
  isTestMode = false,
}) => {
  const t = translations[lang] || translations.hi;

  const [utrNumber, setUtrNumber] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewZoom, setPreviewZoom] = useState(false);

  // Active registration tracking
  const [activeReg, setActiveReg] = useState<Registration | null>(confirmedRegistration || pendingData);

  // Countdown timer for temporary hold (e.g. 15 mins)
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (confirmedRegistration) {
      setActiveReg(confirmedRegistration);
    } else if (pendingData) {
      setActiveReg(pendingData);
    }
  }, [confirmedRegistration, pendingData]);

  // Reservation hold countdown timer
  useEffect(() => {
    if (!activeReg?.expiresAt || activeReg.paymentStatus === 'paid') {
      setTimeLeftSec(null);
      return;
    }

    const calculateRemaining = () => {
      const expTime = new Date(activeReg.expiresAt!).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((expTime - now) / 1000));
      setTimeLeftSec(diffSec);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [activeReg?.expiresAt, activeReg?.paymentStatus]);

  const upiId = 'maharishivedvigyan@sbi';
  const amount = activeReg ? activeReg.amount : 2200;
  const kundNumber = activeReg ? activeReg.kundNumber : 10;
  const formattedKund = String(kundNumber).padStart(3, '0');

  // Real-time UTR Validation evaluation
  const cleanUtrInput = utrNumber.trim();
  const existingUtrs = allRegistrations
    .map((r) => r.utrNumber)
    .filter((u): u is string => Boolean(u && u !== 'COUNTER-PAY-ON-DAY' && u !== activeReg?.utrNumber));

  const liveUtrValidation = cleanUtrInput.length >= 10
    ? validateUpiUtr(cleanUtrInput, existingUtrs)
    : null;

  // Standard UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    'Maharishi Vedvigyan Sansthan'
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Yagya-Kund${formattedKund}`)}`;

  // Generate SBI QR code
  useEffect(() => {
    if (qrCanvasRef.current && activeReg && activeReg.paymentStatus !== 'paid') {
      QRCode.toCanvas(
        qrCanvasRef.current,
        upiUri,
        {
          width: 220,
          margin: 1,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [upiUri, activeReg?.paymentStatus]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Handle screenshot upload as payment proof
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('फाइल आकार 5MB से कम होना चाहिए। / File must be less than 5MB');
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const base64 = uploadEvt.target?.result as string;
      setPaymentProofUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Check live status from server (polling/refresh) with strict privacy
  const handleCheckStatus = async () => {
    if (!activeReg?.token || !activeReg?.mobile) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/registrations/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeReg.token,
          mobile: activeReg.mobile,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const fresh = data.result as Registration;
          setActiveReg(fresh);
          saveLatestUserBooking(fresh);

          if (fresh.paymentStatus === 'paid') {
            try {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } catch (e) {}
            onPaymentSuccess(fresh);
          }
        }
      }
    } catch (e) {
      console.warn('Status check notice:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Core Submit for Verification (Fixing the Instant Approval bug)
  const handleSubmitVerification = async (isCounterPay: boolean = false, forceTestApprove: boolean = false) => {
    if (!activeReg) {
      setErrorMsg(t.fillAllRequired);
      return;
    }

    if (!isCounterPay && !forceTestApprove) {
      const cleanUtr = utrNumber.trim();
      const validation = validateUpiUtr(cleanUtr, existingUtrs);
      if (!validation.isValid) {
        setErrorMsg(validation.error || t.utrHelpText);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Upload screenshot to Supabase Storage if file exists
      let uploadedUrl = paymentProofUrl;
      if (screenshotFile && activeReg.token) {
        const storageResult = await uploadScreenshotToStorage(screenshotFile, activeReg.token);
        if (storageResult.url) {
          uploadedUrl = storageResult.url;
        }
      }

      // 2. Call backend verification endpoint with auth header
      const userToken = localStorage.getItem('yagya_devotee_token');
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userToken) reqHeaders['Authorization'] = `Bearer ${userToken}`;

      const res = await fetch('/api/payment/submit-proof', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          registrationId: activeReg.id,
          token: activeReg.token,
          utrNumber: isCounterPay ? undefined : utrNumber.trim(),
          paymentProofUrl: uploadedUrl || undefined,
          isCounterPay,
          forceTestModeApprove: forceTestApprove,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsSubmitting(false);
        setErrorMsg(data.error || 'सत्यापन अनुरोध विफल रहा। कृपया सही UTR दर्ज करें।');
        return;
      }

      const updatedReg: Registration = data.registration;
      setActiveReg(updatedReg);
      saveLatestUserBooking(updatedReg);

      // Save directly to Supabase as well
      saveRegistrationToSupabase(updatedReg).catch((err) =>
        console.warn('Client-side Supabase sync note:', err)
      );

      if (updatedReg.paymentStatus === 'paid') {
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
        onPaymentSuccess(updatedReg);
      }

      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Payment submit error:', err);
      setIsSubmitting(false);
      setErrorMsg('सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW 1: BOOKING CONFIRMED & APPROVED (Step 4: Token & Pass)
  // =========================================================================
  if (activeReg && activeReg.paymentStatus === 'paid') {
    return (
      <div className="w-full pb-14 font-sans bg-[#faf5eb] min-h-screen">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-3xl shadow-md border-2 border-emerald-300 p-6 sm:p-8 animate-in fade-in duration-200 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-3xl mx-auto mb-3 shadow-inner">
              ✓
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-widest text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-300 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t.statusPaid}</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-bold font-heading text-stone-900 mt-2 mb-1">
              {t.confirmedTitle}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto mb-6">
              {t.confirmedSubtitle}
            </p>

            {/* Token Badge */}
            <div className="max-w-md mx-auto bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                {t.tokenNo}
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-[#872e18] tracking-wider select-all">
                {activeReg.token}
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-100/70 inline-block px-3 py-0.5 rounded-md">
                हवन कुंड #{String(activeReg.kundNumber).padStart(3, '0')} • {activeReg.date}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenSlip(activeReg)}
                className="w-full sm:w-auto px-6 py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>{t.printReceipt}</span>
              </button>

              <button
                type="button"
                onClick={onGoToRegistration}
                className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-xl border border-stone-300 cursor-pointer transition-all"
              >
                {t.backToHome}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PENDING ADMIN VERIFICATION (The Solution to Random 12-Digit bug)
  // =========================================================================
  if (activeReg && activeReg.paymentStatus === 'pending') {
    return (
      <div className="w-full pb-14 font-sans bg-[#faf5eb] min-h-screen">
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-3xl shadow-md border-2 border-amber-400 p-6 sm:p-8 animate-in fade-in duration-200">
            {/* Header Status */}
            <div className="text-center space-y-3 pb-6 border-b border-stone-200">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 mx-auto shadow-inner">
                <Clock className="w-8 h-8 animate-pulse text-amber-700" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider text-amber-900 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>{t.statusPending}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-heading text-stone-900">
                {t.pendingVerificationTitle}
              </h2>

              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
                {t.pendingVerificationDesc}
              </p>
            </div>

            {/* Information Grid */}
            <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fdfaf4] p-5 rounded-2xl border border-amber-200">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {t.tokenNo}
                </span>
                <span className="font-mono font-bold text-base text-[#872e18]">
                  {activeReg.token}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {t.kundNumber}
                </span>
                <span className="font-bold text-stone-900 text-sm">
                  अग्नि कुंड #{String(activeReg.kundNumber).padStart(3, '0')} (अस्थायी रोक)
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {t.husbandName}
                </span>
                <span className="font-bold text-stone-900 text-sm">
                  {activeReg.husbandName} {activeReg.wifeName ? `• सह: ${activeReg.wifeName}` : ''}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  दर्ज किया गया UTR संदर्भ
                </span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {activeReg.utrNumber || utrNumber || '-'}
                </span>
              </div>
            </div>

            {/* Uploaded Screenshot Proof Preview */}
            {(activeReg.paymentProofUrl || paymentProofUrl) && (
              <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                <span className="text-xs font-bold text-stone-700 block mb-2">
                  जमा किया गया भुगतान स्क्रीनशॉट प्रमाण
                </span>
                <div className="relative inline-block max-w-xs">
                  <img
                    src={activeReg.paymentProofUrl || paymentProofUrl}
                    alt="Payment Proof"
                    className="max-h-48 rounded-xl border border-stone-300 shadow-xs cursor-pointer hover:opacity-90"
                    onClick={() => setPreviewZoom(true)}
                  />
                  <div className="text-[10px] text-stone-500 mt-1 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3 text-stone-400" />
                    <span>क्लिक कर ज़ूम देखें</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notice Box */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1 mb-6">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>सुरक्षा एवं बैंक मिलान प्रक्रिया:</span>
              </div>
              <p className="text-[11px] text-amber-900/90 pl-5">
                {t.pendingNoticeWhy}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-white ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{t.checkStatusBtn}</span>
              </button>

              <button
                type="button"
                onClick={onGoToRegistration}
                className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
              >
                {t.backToHome}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: REJECTED NOTICE
  // =========================================================================
  if (activeReg && activeReg.paymentStatus === 'rejected') {
    return (
      <div className="w-full pb-14 font-sans bg-[#faf5eb] min-h-screen">
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <div className="bg-white rounded-3xl shadow-md border-2 border-rose-400 p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 mx-auto">
              <XCircle className="w-8 h-8 text-rose-600" />
            </div>

            <div className="inline-block text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-300">
              {t.statusRejected}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-heading text-stone-900">
              भुगतान सत्यापन अस्वीकृत
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              {activeReg.rejectionReason || 'दर्ज किया गया UTR बैंक खाते में प्राप्त नहीं हुआ अथवा स्क्रीनशॉट अमान्य पाया गया। कुंड अन्य यजमानों हेतु मुक्त कर दिया गया है।'}
            </p>

            <div className="pt-4">
              <button
                type="button"
                onClick={onGoToRegistration}
                className="px-6 py-3 bg-[#8a1523] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer"
              >
                {t.restartReservationBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: PAYMENT SUBMISSION FORM (Step 3: UTR + Screenshot Upload)
  // =========================================================================
  return (
    <div className="w-full pb-14 font-sans bg-[#faf5eb] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Temporary Reservation Banner & Timer */}
        <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0 font-bold">
              #{formattedKund}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-amber-950">
                {t.tempReservationNotice}
              </div>
              <div className="text-[11px] text-amber-800/80">
                हवन कुंड #{formattedKund} • {activeReg?.date} • {activeReg?.timeSlot || 'प्रातः सत्र'}
              </div>
            </div>
          </div>

          {timeLeftSec !== null && (
            <div className="flex items-center gap-1.5 bg-amber-200/70 border border-amber-400/60 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-black text-amber-950 shrink-0">
              <Clock className="w-4 h-4 text-amber-800" />
              <span>{t.reservationTimerText} {formatTimer(timeLeftSec)}</span>
            </div>
          )}
        </div>

        {/* Free Test Mode Sandbox Banner */}
        {isTestMode && (
          <div className="mb-5 bg-purple-50 border-2 border-purple-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-purple-900 font-medium">
              <Beaker className="w-5 h-5 text-purple-700 shrink-0" />
              <span>{t.testModeBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => handleSubmitVerification(false, true)}
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition-all"
            >
              {t.testModeInstantApproveBtn}
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-[#e8ddcb] p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="border-b border-stone-200 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-stone-900">
                {t.paymentTitle}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                {t.scanAndPay}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                {t.payableAmount}
              </span>
              <span className="text-2xl font-black text-[#872e18]">
                ₹{amount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: SBI UPI QR Code */}
            <div className="flex flex-col items-center justify-center p-5 bg-[#faf5eb] rounded-2xl border border-amber-200 text-center">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-stone-300 mb-3">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>

              <div className="text-xs font-bold text-stone-800 mb-1">
                आधिकारिक SBI UPI QR कोड
              </div>

              {/* UPI ID Copy Field */}
              <div className="flex items-center gap-2 mt-2 bg-white px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono font-bold text-stone-800 shadow-2xs">
                <span>{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 hover:bg-stone-100 rounded text-amber-800 cursor-pointer"
                  title={t.copyUpiBtn}
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {copiedUpi && <span className="text-[11px] font-bold text-emerald-700 mt-1">{t.upiCopied}</span>}
            </div>

            {/* Right: UTR Entry & Screenshot Upload */}
            <div className="space-y-4">
              {/* UTR Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.enterUtr} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={t.utrPlaceholder}
                  className="w-full px-4 py-3 bg-white border-2 border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
                />

                {/* Real-time UTR Validation Feedback */}
                {liveUtrValidation && (
                  <div
                    className={`mt-2 p-2 rounded-xl text-xs flex items-start gap-1.5 ${
                      liveUtrValidation.isValid
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {liveUtrValidation.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">वैध NPCI UTR प्रारूप</div>
                          <div className="text-[11px] text-emerald-700">
                            {liveUtrValidation.bankNameHint}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-[11px]">{liveUtrValidation.error}</div>
                      </>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-stone-500 mt-1.5">
                  {t.utrHelpText}
                </p>
              </div>

              {/* Payment Proof Screenshot Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {t.uploadScreenshotTitle}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic"
                  onChange={handleProofUpload}
                  className="hidden"
                />

                {!paymentProofUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl bg-stone-50/50 hover:bg-amber-50/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 text-stone-400" />
                    <span className="text-xs font-bold text-stone-700">
                      स्क्रीनशॉट फ़ाइल चुनें
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {t.uploadScreenshotHint}
                    </span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900">
                          {t.screenshotUploaded}
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          {screenshotFile?.name || 'receipt-proof.png'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofUrl('');
                        setScreenshotFile(null);
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      हटाएं / बदलें
                    </button>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSubmitVerification(false, false)}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-[#8a1523] hover:bg-[#70101b] disabled:bg-stone-300 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{t.verifyingText}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 text-white" />
                      <span>{t.submitForVerificationBtn}</span>
                    </>
                  )}
                </button>

                <div className="text-center text-[11px] text-stone-500">
                  जमा करने पर आपकी बुकिंग आश्रम व्यवस्थापक के सत्यापन हेतु कतार में सुरक्षित हो जाएगी।
                </div>

                {/* Counter Pay Alternative Option */}
                <div className="pt-3 border-t border-stone-200 text-center">
                  <button
                    type="button"
                    onClick={() => handleSubmitVerification(true, false)}
                    className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
                  >
                    या {t.counterPay} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Zoomed Screenshot Preview */}
      {previewZoom && (paymentProofUrl || activeReg?.paymentProofUrl) && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewZoom(false)}
        >
          <img
            src={activeReg?.paymentProofUrl || paymentProofUrl}
            alt="Payment Proof Full"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
