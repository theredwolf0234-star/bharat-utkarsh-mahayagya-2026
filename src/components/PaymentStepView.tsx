import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Printer,
  Clock,
  RefreshCw,
  Download,
  Copy,
  Check,
  FileText,
  ArrowLeft,
  CreditCard,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Registration, SystemSettings, AuditLog } from '../types/yagya';
import { getWhatsAppSendUrl } from '../utils/whatsapp';

interface PaymentStepViewProps {
  pendingReg: Registration | null;
  systemSettings: SystemSettings;
  allRegistrations: Registration[];
  setRegistrations: React.Dispatch<React.SetStateAction<Registration[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  onOpenSlip: (reg: Registration) => void;
  onGoHome: () => void;
  onGoBooking: () => void;
}

export const PaymentStepView: React.FC<PaymentStepViewProps> = ({
  pendingReg,
  systemSettings,
  allRegistrations,
  setRegistrations,
  setAuditLogs,
  onOpenSlip,
  onGoHome,
  onGoBooking,
}) => {
  // View mode: 'checkout' | 'verifying' | 'success' | 'failed' | 'counter'
  const [viewMode, setViewMode] = useState<'checkout' | 'verifying' | 'success' | 'failed' | 'counter'>('checkout');
  const [activeReg, setActiveReg] = useState<Registration | null>(pendingReg);
  const [confirmedData, setConfirmedData] = useState<any>(null);
  const [failureMsg, setFailureMsg] = useState<string>('');

  // Payment creation & gateway state
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [verificationText, setVerificationText] = useState<string>('भुगतान सत्यापित किया जा रहा है...');

  // Legacy manual UTR states
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotData, setScreenshotData] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showManualQr, setShowManualQr] = useState(false);
  const [zoomQr, setZoomQr] = useState(false);

  // Success QR canvas ref
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 5-minute temporary lock countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!pendingReg?.expiresAt) return 300;
    const diff = Math.floor((new Date(pendingReg.expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, Math.min(diff, 300));
  });
  const [isLockExpired, setIsLockExpired] = useState<boolean>(false);

  // Timer countdown
  useEffect(() => {
    if (viewMode === 'success' || !activeReg) return;

    const interval = setInterval(() => {
      if (!activeReg.expiresAt) return;
      const diff = Math.floor((new Date(activeReg.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSeconds(0);
        setIsLockExpired(true);
        clearInterval(interval);
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReg, viewMode]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (pendingReg) {
      const liveMatch = allRegistrations.find((r) => r.token === pendingReg.token);
      setActiveReg(liveMatch || pendingReg);
      if (liveMatch && liveMatch.paymentStatus === 'paid') {
        setViewMode('success');
      }
    }
  }, [pendingReg, allRegistrations]);

  // Generate QR code onto canvas when entering success mode
  useEffect(() => {
    if (viewMode === 'success' && qrCanvasRef.current && confirmedData) {
      const qrData =
        confirmedData.qrCode ||
        `BU2026|${confirmedData.bookingId || confirmedData.id}|${confirmedData.tokenNumber || confirmedData.token}|${confirmedData.eventDate || confirmedData.date}|KUND${confirmedData.kundNumber}|${confirmedData.mobile}`;

      QRCode.toCanvas(
        qrCanvasRef.current,
        qrData,
        {
          width: 160,
          margin: 1,
          color: {
            dark: '#4a0e17',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('QR code generation error:', err);
        }
      );
    }
  }, [viewMode, confirmedData]);

  // ----------------------------------------------------------------------
  // Production Step 2: "भुगतान करें" click handler -> POST /api/payment/create-order
  // ----------------------------------------------------------------------
  const handleInitiatePayment = async () => {
    if (!activeReg) return;
    if (isLockExpired) {
      alert('कुंड लॉक की समय सीमा (5 मिनट) समाप्त हो चुकी है। कृपया पुनः हवन कुंड चुनें।');
      onGoBooking();
      return;
    }

    setIsCreatingOrder(true);
    setFailureMsg('');

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: activeReg.fullName || activeReg.husbandName,
          husbandName: activeReg.husbandName,
          wifeName: activeReg.wifeName,
          mobile: activeReg.mobile,
          email: activeReg.email,
          city: activeReg.city || 'नोएडा',
          kundNumber: activeReg.kundNumber,
          date: activeReg.date,
          amount: activeReg.amount,
          address: activeReg.address,
          gotra: activeReg.gotra,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        setFailureMsg(orderData.error || 'ऑर्डर बनाने में त्रुटि हुई।');
        setIsCreatingOrder(false);
        return;
      }

      setCurrentOrder(orderData);

      // If in Sandbox Test Mode (gateway keys not yet configured in .env)
      if (orderData.isTestMode) {
        setIsCreatingOrder(false);
        setTestModalOpen(true);
        return;
      }

      // Live Razorpay Gateway Mode
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('पेमेंट गेटवे SDK लोड नहीं हो सका। कृपया पृष्ठ को रीलोड करें।');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency || 'INR',
        name: 'श्री महर्षि वेदविज्ञान संस्थान',
        description: `भारत उत्कर्ष महायज्ञ 2026 • कुंड #${activeReg.kundNumber} दक्षिणा`,
        image: '/MUMY LOGO 2.png',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customer?.name || activeReg.fullName,
          contact: orderData.customer?.mobile || activeReg.mobile,
          email: orderData.customer?.email || activeReg.email || 'devotee@bharatutkarsh.org',
        },
        theme: {
          color: '#8a1523',
        },
        modal: {
          ondismiss: () => {
            fetch('/api/payment/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId: orderData.bookingId }),
            }).catch(() => {});
            setIsCreatingOrder(false);
          },
        },
        handler: async (paymentResponse: any) => {
          // Never trust frontend success directly! Transition to verification mode
          verifyPaymentOnBackend({
            bookingId: orderData.bookingId,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            isTestMode: false,
          });
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on('payment.failed', (failResp: any) => {
        handlePaymentFailure(failResp?.error?.description || 'भुगतान असफल रहा');
      });
      rzpInstance.open();
      setIsCreatingOrder(false);
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      setFailureMsg(err.message || 'भुगतान प्रारंभ करने में त्रुटि।');
      setIsCreatingOrder(false);
    }
  };

  // ----------------------------------------------------------------------
  // Step 4 & 5: Backend Payment Verification (Never Trust Frontend Alone)
  // ----------------------------------------------------------------------
  const verifyPaymentOnBackend = async (payload: {
    bookingId: string;
    razorpay_order_id?: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    isTestMode: boolean;
  }) => {
    setViewMode('verifying');
    setVerificationText('भुगतान सत्यापित किया जा रहा है...');

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        handlePaymentFailure(data.error || 'भुगतान सत्यापन असफल रहा।');
        return;
      }

      // Success: Booking CONFIRMED, Token Generated, QR ready!
      const confirmed = data.booking || activeReg;
      setConfirmedData(confirmed);

      // Synchronize into frontend registrations list
      setRegistrations((prev) => {
        const updatedItem: Registration = {
          id: confirmed.bookingId || confirmed.id,
          token: data.tokenNumber || confirmed.tokenNumber,
          userId: confirmed.userId,
          fullName: confirmed.name || confirmed.fullName,
          husbandName: confirmed.name || confirmed.husbandName,
          wifeName: confirmed.wifeName,
          mobile: confirmed.mobile,
          email: confirmed.email,
          city: confirmed.city || 'नोएडा',
          gotra: confirmed.gotra,
          kundNumber: confirmed.kundNumber,
          kundNumbers: [confirmed.kundNumber],
          kundCount: 1,
          date: confirmed.eventDate || confirmed.date,
          timeSlot: 'प्रातः 09:00 AM',
          participationType: 'दंपति',
          personCount: 2,
          amount: confirmed.amount,
          paymentStatus: 'paid',
          utrNumber: confirmed.paymentId || payload.razorpay_payment_id,
          paymentDate: new Date().toISOString().slice(0, 10),
          createdAt: confirmed.createdAt || new Date().toISOString(),
          verificationHash: `GATEWAY-UPI-${confirmed.paymentId || payload.razorpay_payment_id}`,
        };
        const exists = prev.some((r) => r.token === updatedItem.token);
        if (exists) {
          return prev.map((r) => (r.token === updatedItem.token ? updatedItem : r));
        }
        return [updatedItem, ...prev];
      });

      setActiveReg({
        ...activeReg!,
        token: data.tokenNumber || confirmed.tokenNumber,
        paymentStatus: 'paid',
        utrNumber: confirmed.paymentId || payload.razorpay_payment_id,
      });

      setViewMode('success');
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      // Poll payment status as fallback before failing
      pollPaymentStatus(payload.bookingId, payload.razorpay_order_id);
    }
  };

  // Safe polling if network dropped during verification
  const pollPaymentStatus = async (bookingId: string, orderId?: string) => {
    setVerificationText('नेटवर्क जांच हो रही है... बैंक से अंतिम स्थिति प्राप्त की जा रही है...');
    try {
      const pollId = orderId || bookingId;
      const res = await fetch(`/api/payment/status/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.bookingStatus === 'CONFIRMED' || data.paymentStatus === 'SUCCESS') {
          setConfirmedData(data.booking);
          setViewMode('success');
          return;
        }
      }
    } catch (e) {}

    handlePaymentFailure('भुगतान सत्यापन का समय समाप्त हो गया। कृपया अपने बैंक खाते की जांच करें।');
  };

  const handlePaymentFailure = (reason: string) => {
    setFailureMsg(reason);
    setViewMode('failed');
    if (currentOrder?.bookingId) {
      fetch('/api/payment/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: currentOrder.bookingId }),
      }).catch(() => {});
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(systemSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFailureMsg('फ़ाइल का आकार 5MB से कम होना चाहिए।');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setScreenshotData(uploadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Legacy manual proof submit
  const handleManualProofSubmit = (isCounter = false) => {
    if (!activeReg) return;
    setFailureMsg('');
    if (!isCounter) {
      const cleanUtr = utrNumber.trim();
      if (cleanUtr.length !== 12 || !/^\d+$/.test(cleanUtr)) {
        setFailureMsg('कृपया सही 12 अंकों का बैंक UPI Ref / UTR नंबर दर्ज करें।');
        return;
      }
    }

    const updatedReg: Registration = {
      ...activeReg,
      paymentStatus: isCounter ? 'counter_pay' : 'pending',
      utrNumber: isCounter ? 'COUNTER-PAY-ON-DAY' : utrNumber.trim(),
      paymentProofUrl: screenshotData || undefined,
      paymentDate: new Date().toISOString().slice(0, 10),
    };

    setActiveReg(updatedReg);
    setRegistrations((prev) => {
      const exists = prev.some((r) => r.token === updatedReg.token);
      if (exists) {
        return prev.map((r) => (r.token === updatedReg.token ? updatedReg : r));
      }
      return [updatedReg, ...prev];
    });

    fetch('/api/payment/submit-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId: updatedReg.id,
        token: updatedReg.token,
        registration: updatedReg,
        utrNumber: updatedReg.utrNumber,
        paymentProofUrl: screenshotData || undefined,
        isCounterPay: isCounter,
      }),
    }).catch(() => {});

    if (isCounter) {
      setViewMode('counter');
    } else {
      setViewMode('checkout');
    }
  };

  const amount = activeReg?.amount || 2100;
  const kundNumber = activeReg?.kundNumber || 10;
  const formattedKund = `#${String(kundNumber).padStart(3, '0')}`;

  // ======================================================================
  // VIEW: 1. VERIFYING PAYMENT STATE
  // ======================================================================
  if (viewMode === 'verifying') {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-8 pb-12 text-center animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-400 p-6 sm:p-10 space-y-5">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-[#8a1523] animate-spin" />
            <Clock className="w-8 h-8 text-[#8a1523] animate-pulse" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-amber-900 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-300">
              सुरक्षित सत्यापन प्रक्रिया
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 mt-3 mb-1">
              {verificationText}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              कृपया इस विंडो को बंद अथवा रीफ्रेश न करें। पेमेंट गेटवे एवं बैंक द्वारा आपकी दक्षिणा का डिजिटल सत्यापन किया जा रहा है।
            </p>
          </div>
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium">
            🔒 आपका हवन कुंड <strong className="text-[#8a1523]">{formattedKund}</strong> सुरक्षित लॉक है। सत्यापन पूर्ण होते ही आधिकारिक टोकन पास जारी होगा।
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // VIEW: 2. PAYMENT FAILURE STATE (Requirement 11)
  // ======================================================================
  if (viewMode === 'failed') {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-6 pb-12 text-center animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-rose-400 p-6 sm:p-10 space-y-5">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-700 shadow-inner">
            <XCircle className="w-10 h-10 text-rose-600" />
          </div>
          <div>
            <span className="text-xs uppercase font-extrabold text-rose-900 bg-rose-100 px-3.5 py-1 rounded-full border border-rose-300">
              Payment Failed
            </span>
            <h2 className="text-xl sm:text-3xl font-bold font-serif text-rose-800 mt-2 mb-1">
              भुगतान असफल
            </h2>
            <p className="text-sm sm:text-base font-semibold text-stone-700 mt-1">
              आपका भुगतान पूरा नहीं हुआ। कृपया पुनः प्रयास करें।
            </p>
          </div>

          {failureMsg && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-950 text-left font-medium">
              <strong>त्रुटि विवरण:</strong> {failureMsg}
            </div>
          )}

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
            हवन कुंड की सुरक्षा हेतु लॉक मुक्त कर दिया गया है। यदि आपके बैंक खाते से राशि कट गई है, तो वह बैंक नियमानुसार स्वतः वापस आ जाएगी अथवा आश्रम से संपर्क करें।
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setViewMode('checkout');
                setFailureMsg('');
              }}
              className="w-full sm:w-auto px-6 py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all"
            >
              पुनः भुगतान का प्रयास करें
            </button>
            <button
              onClick={onGoBooking}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              दूसरा कुंड चुनें
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // VIEW: 3. PAYMENT SUCCESS STATE (Requirement 10)
  // ======================================================================
  if (viewMode === 'success' && (confirmedData || activeReg)) {
    const data = confirmedData || activeReg;
    const token = data.tokenNumber || data.token || 'BU2026-CONFIRMED';
    const devoteeName = data.name || data.fullName || data.husbandName;
    const bookingId = data.bookingId || data.id || 'BU2026-BKG';
    const paymentId = data.paymentId || data.utrNumber || 'GATEWAY-UPI';
    const eventDate = data.eventDate || data.date;
    const totalPaid = data.amount || amount;

    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-12 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-400 p-5 sm:p-8">
          <div className="text-center space-y-2 pb-5 border-b border-stone-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-3xl mx-auto shadow-inner">
              ✓
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>भुगतान सफल (Payment Verified & Confirmed)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-serif text-stone-900">
              बधाई हो! आपका हवन कुंड सफलतापूर्वक आरक्षित हो गया है
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
              गेटवे एवं बैंक द्वारा आपका भुगतान पूर्णतः सत्यापित हो गया है। आपका आधिकारिक टोकन व प्रवेश पास सक्रिय हो चुका है।
            </p>
          </div>

          {/* Golden Token & QR Section */}
          <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="md:col-span-2 space-y-2 text-center md:text-left">
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                आधिकारिक डिजिटल टोकन संख्या (Token Number)
              </div>
              <div className="font-mono font-black text-2xl sm:text-4xl text-[#872e18] break-all">
                {token}
              </div>
              <div className="inline-flex items-center gap-2 mt-1 text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                <span>हवन कुंड {formattedKund}</span>
                <span>•</span>
                <span>{eventDate}</span>
                <span>•</span>
                <span>प्रातः 09:00 AM</span>
              </div>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl border-2 border-stone-200 shadow-sm">
              <canvas ref={qrCanvasRef} className="rounded-lg max-w-[140px] max-h-[140px]" />
              <span className="text-[10px] font-bold text-stone-500 mt-1 uppercase tracking-wider">
                स्कैन सत्यापन कोड (Scan QR)
              </span>
            </div>
          </div>

          {/* Complete Booking Details Grid (Requirement 10) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200 text-xs">
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">पंजीकरण नाम (Name)</span>
              <span className="font-bold text-stone-900 text-sm break-words">{devoteeName}</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">मोबाइल नंबर (Mobile)</span>
              <span className="font-mono font-bold text-stone-900 text-sm">+91 {data.mobile}</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">कार्यक्रम की तारीख (Date)</span>
              <span className="font-bold text-stone-900 text-sm">{eventDate} (प्रातः 09:00 AM)</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">कुंड संख्या (Kund #)</span>
              <span className="font-bold text-[#8a1523] text-sm">{formattedKund} (1 कुंड)</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">Booking ID</span>
              <span className="font-mono font-bold text-stone-900 break-all text-[11px] sm:text-xs">{bookingId}</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">Payment ID / UTR</span>
              <span className="font-mono font-bold text-emerald-800 break-all text-[11px] sm:text-xs">{paymentId}</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">भुगतान राशि (Amount)</span>
              <span className="font-bold text-[#872e18] text-sm">₹ {Number(totalPaid).toLocaleString('en-IN')} (सफल)</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">बुकिंग स्थिति (Status)</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px]">
                ✓ CONFIRMED (पुष्ट)
              </span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[11px]">यज्ञ स्थल</span>
              <span className="font-semibold text-stone-700 text-[11px]">रामलीला मैदान, महर्षि आश्रम, सेक्टर-110, नोएडा</span>
            </div>
          </div>

          {/* Action Buttons (Requirement 10) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenSlip(activeReg || data)}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4 text-white shrink-0" />
              <span>[ टिकट / रसीद देखें ]</span>
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-3.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-white shrink-0" />
              <span>[ प्रिंट करें ]</span>
            </button>
            <a
              href={getWhatsAppSendUrl(data.mobile, activeReg || data)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>📲 WhatsApp पर पास प्राप्त करें</span>
            </a>
            <button
              onClick={onGoHome}
              className="w-full sm:w-auto px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              मुख्य पृष्ठ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // VIEW: 4. COUNTER PAY SCREEN
  // ======================================================================
  if (viewMode === 'counter' && activeReg) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-6 pb-12 text-center animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-blue-400 p-6 sm:p-10 space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 mx-auto">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
            काउंटर भुगतान आरक्षण सुरक्षित
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            आपका संदर्भ <strong className="font-mono text-[#8a1523]">{activeReg.token}</strong> आरक्षित है। कृपया यज्ञ दिवस पर आश्रम गेट सं. 5 के काउंटर पर नकद दक्षिणा देकर अंतिम रसीद प्राप्त करें।
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenSlip(activeReg)}
              className="px-6 py-3 bg-[#8a1523] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer"
            >
              काउंटर पर्ची देखें / प्रिंट करें
            </button>
            <button
              onClick={onGoHome}
              className="px-5 py-3 bg-stone-100 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              मुख्य पृष्ठ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // VIEW: 5. MAIN PRODUCTION PAYMENT FLOW (CHECKOUT)
  // ======================================================================
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-12">
      {/* Previous Arrow Navigation */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onGoBooking}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-amber-100 text-[#872e18] border border-amber-300 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-[#8a1523] group-hover:-translate-x-1 transition-transform" />
          <span>← पिछला चरण (हवन कुंड या विवरण बदलें)</span>
        </button>
        <button
          type="button"
          onClick={onGoHome}
          className="text-xs text-stone-600 hover:text-[#8a1523] font-semibold underline cursor-pointer"
        >
          मुख्य पृष्ठ पर जाएं
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-[#e8ddcb] p-4 sm:p-8">
        {/* Header Summary */}
        <div className="border-b border-stone-200 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#8a1523] bg-amber-100 px-3 py-1 rounded-xl mb-1.5 border border-amber-300">
              <span>यज्ञ तिथि: {activeReg?.date}</span>
              <span>•</span>
              <span>समय: प्रातः 09:00 AM</span>
              <span>•</span>
              <span>हवन कुंड {formattedKund}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 leading-snug">
              सुरक्षित UPI ऑनलाइन भुगतान एवं कुंड आरक्षण
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Google Pay, PhonePe, Paytm, BHIM अथवा किसी भी UPI ऐप से तुरंत भुगतान करें।
            </p>
          </div>
          <div className="bg-amber-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-amber-200 text-left sm:text-right">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              कुल देय दक्षिणा
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#872e18]">
              ₹ {Number(amount).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-stone-600 block">
              (1 हवन कुंड • सहयोग दक्षिणा)
            </span>
          </div>
        </div>

        {/* 5-MINUTE REAL-TIME LOCK COUNTDOWN BANNER (Section 1 in prompt) */}
        <div
          className={`p-4 rounded-2xl border-2 mb-6 transition-all shadow-xs ${
            isLockExpired
              ? 'bg-rose-50 border-rose-400 text-rose-950'
              : remainingSeconds <= 60
              ? 'bg-amber-100 border-amber-500 text-amber-950 animate-pulse'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-stone-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${
                  isLockExpired ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-900'
                }`}
              >
                {isLockExpired ? '⏱️' : '🔒'}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <span>रियल-टाइम कुंड आरक्षण लॉक (Temporary Kund Lock)</span>
                  {!isLockExpired && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-emerald-300">
                      सुरक्षित
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-semibold mt-0.5">
                  {isLockExpired ? (
                    <span className="text-rose-700 font-bold">
                      समय समाप्त! 5 मिनट पूर्ण होने पर यह हवन कुंड स्वतः अनलॉक हो गया है।
                    </span>
                  ) : (
                    <span>
                      हवन कुंड <strong className="text-[#8a1523]">{formattedKund}</strong> आपके भुगतान सत्र हेतु 5 मिनट के लिए सुरक्षित लॉक है।
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-2xs shrink-0 self-start sm:self-auto">
              <div className="text-[10px] font-bold text-stone-500 uppercase">शेष समय (Lock Expires In)</div>
              <div
                className={`font-mono text-2xl font-black ${
                  isLockExpired
                    ? 'text-rose-600'
                    : remainingSeconds <= 60
                    ? 'text-rose-600 animate-pulse'
                    : 'text-[#872e18]'
                }`}
              >
                {formatTime(remainingSeconds)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!isLockExpired && (
            <div className="w-full bg-stone-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-[#8a1523] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (remainingSeconds / 300) * 100))}%` }}
              />
            </div>
          )}

          {isLockExpired && (
            <div className="mt-3 pt-3 border-t border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-rose-800 font-medium">
                अन्य यजमान अब इस कुंड को बुक कर सकते हैं। कृपया पुनः अपना कुंड चुनें।
              </span>
              <button
                type="button"
                onClick={onGoBooking}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg cursor-pointer"
              >
                पुनः हवन कुंड चुनें
              </button>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {failureMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium mb-5">
            ⚠️ {failureMsg}
          </div>
        )}

        {/* Main Production Call to Action: "भुगतान करें" (Requirement 2 & 3) */}
        <div className="bg-gradient-to-br from-[#fffdfa] to-[#fbf6ee] border-2 border-amber-300/80 rounded-2xl p-5 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            <CreditCard className="w-3.5 h-3.5 text-[#8a1523]" />
            <span>ऑनलाइन UPI गेटवे भुगतान (Google Pay • PhonePe • Paytm • BHIM)</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
            हवन कुंड {formattedKund} के लिए दक्षिणा भुगतान करें
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
            बटन पर क्लिक करते ही सुरक्षित पेमेंट गेटवे खुलेगा जहाँ आप अपने मोबाइल में उपलब्ध किसी भी UPI ऐप अथवा QR कोड द्वारा सीधे भुगतान कर सकते हैं।
          </p>

          <div className="py-2">
            <button
              type="button"
              disabled={isCreatingOrder || isLockExpired}
              onClick={handleInitiatePayment}
              className={`w-full max-w-md mx-auto py-4 px-6 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer ${
                isCreatingOrder || isLockExpired
                  ? 'bg-stone-400 cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-[#8a1523] to-[#a31a2c] hover:from-[#70101b] hover:to-[#8a1523] hover:shadow-2xl transform active:scale-98'
              }`}
            >
              {isCreatingOrder ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>ऑर्डर तैयार हो रहा है...</span>
                </>
              ) : (
                <>
                  <span>भुगतान करें (Pay ₹{Number(amount).toLocaleString('en-IN')})</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
            <span>🛡️ 256-बिट SSL सुरक्षित एन्क्रिप्शन</span>
            <span>•</span>
            <span>बैंक द्वारा प्रत्यक्ष सत्यापन</span>
            <span>•</span>
            <span>तात्कालिक टोकन व QR पास निर्माण</span>
          </div>

          {/* Toggle for manual fallback scan */}
          <div className="pt-3 border-t border-amber-200">
            <button
              type="button"
              onClick={() => setShowManualQr(!showManualQr)}
              className="text-xs font-bold text-amber-900 hover:text-[#8a1523] underline cursor-pointer"
            >
              {showManualQr
                ? '▲ प्रत्यक्ष SBI QR पोस्टर विवरण छिपाएं'
                : '▼ आश्रम के प्रत्यक्ष SBI QR पोस्टर या UTR द्वारा भुगतान करना चाहते हैं? यहाँ क्लिक करें'}
            </button>
          </div>
        </div>

        {/* Optional Manual Fallback Display */}
        {showManualQr && (
          <div className="mt-6 pt-6 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-in fade-in">
            {/* Left: Official SBI QR */}
            <div className="flex flex-col items-center p-4 bg-[#faf5eb] rounded-2xl border border-amber-300 text-center">
              <img
                src="QR.jpg"
                alt="SBI QR"
                className="w-48 h-auto object-contain rounded-xl border border-stone-300 shadow-sm cursor-pointer"
                onClick={() => setZoomQr(true)}
              />
              <span className="text-xs font-bold text-stone-900 mt-2">आधिकारिक SBI UPI QR पोस्टर</span>
              <div className="flex items-center gap-2 mt-1 bg-white px-3 py-1 rounded-lg border border-stone-300 text-xs font-mono font-bold">
                <span>{systemSettings.upiId}</span>
                <button type="button" onClick={handleCopyUpi} className="p-1 cursor-pointer">
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Right: Manual UTR form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  12 अंकों का बैंक UPI Ref / UTR नंबर दर्ज करें
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="उदा. 428512345678"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  स्क्रीनशॉट संलग्न करें (वैकल्पिक)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="w-full text-xs text-stone-600 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleManualProofSubmit(false)}
                  className="w-full py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  मैन्युअल प्रमाण सबमिट करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Counter Cash Option */}
        <div className="mt-5 pt-4 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={() => handleManualProofSubmit(true)}
            className="text-xs font-bold text-amber-900 hover:text-[#8a1523] underline cursor-pointer"
          >
            अथवा यज्ञ स्थल काउंटर पर नकद दक्षिणा देने का विकल्प चुनें
          </button>
        </div>
      </div>

      {/* ======================================================================
          SANDBOX / TEST PAYMENT MODE MODAL (Requirement 17)
          ====================================================================== */}
      {testModalOpen && currentOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border-2 border-amber-400 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-950 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>TEST PAYMENT MODE (परीक्षण मोड)</span>
            </div>

            <h3 className="text-xl font-bold font-serif text-stone-900">
              UPI भुगतान सिम्युलेटर
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              वर्तमान में सर्वर वातावरण में वास्तविक पेमेंट गेटवे की लाइव कुंजियां (Razorpay Key ID / Secret) प्रदान नहीं की गई हैं। अतः यह विकास/परीक्षण सिम्युलेटर सक्रिय है।
            </p>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID:</span>
                <span className="font-bold text-stone-800 break-all">{currentOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">यजमान:</span>
                <span className="font-bold text-stone-800">{activeReg?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">हवन कुंड:</span>
                <span className="font-bold text-[#8a1523]">{formattedKund}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">राशि:</span>
                <span className="font-bold text-[#872e18]">₹ {Number(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTestModalOpen(false);
                  verifyPaymentOnBackend({
                    bookingId: currentOrder.bookingId,
                    razorpay_order_id: currentOrder.orderId,
                    razorpay_payment_id: `pay_test_${Date.now()}`,
                    isTestMode: true,
                  });
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>✓ सफल UPI भुगतान का परीक्षण करें (Simulate Success)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTestModalOpen(false);
                  handlePaymentFailure('परीक्षण मोड में भुगतान निरस्त किया गया (Simulated Cancel / Failure)');
                }}
                className="w-full py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                ✕ भुगतान विफलता का परीक्षण करें (Simulate Failure)
              </button>

              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                वापस जाएं
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomQr && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 cursor-pointer"
          onClick={() => setZoomQr(false)}
        >
          <div className="bg-white p-4 rounded-2xl max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <img src="QR.jpg" alt="SBI QR" className="w-full max-h-[60vh] object-contain rounded-xl" />
            <button
              onClick={() => setZoomQr(false)}
              className="mt-3 px-4 py-1.5 bg-[#8a1523] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
