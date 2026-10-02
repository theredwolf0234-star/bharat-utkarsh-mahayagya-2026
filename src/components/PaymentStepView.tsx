import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Printer,
  Clock,
  ShieldCheck,
  RefreshCw,
  Download,
  Copy,
  Check,
  FileText,
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
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotData, setScreenshotData] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeReg, setActiveReg] = useState<Registration | null>(pendingReg);
  const [zoomQr, setZoomQr] = useState(false);

  useEffect(() => {
    if (pendingReg) {
      const liveMatch = allRegistrations.find((r) => r.token === pendingReg.token);
      setActiveReg(liveMatch || pendingReg);
    }
  }, [pendingReg, allRegistrations]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(systemSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('फ़ाइल का आकार 5MB से कम होना चाहिए।');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setScreenshotData(uploadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = (isCounter = false) => {
    if (!activeReg) return;
    setErrorMsg('');
    if (!isCounter) {
      const cleanUtr = utrNumber.trim();
      if (cleanUtr.length !== 12 || !/^\d+$/.test(cleanUtr)) {
        setErrorMsg('कृपया सही 12 अंकों का बैंक UPI Ref / UTR नंबर दर्ज करें।');
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

    // Synchronize to backend server database so it appears in Admin Portal on all devices
    try {
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
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.registration) {
            setActiveReg(data.registration);
            setRegistrations((prev) =>
              prev.map((r) => (r.token === data.registration.token ? data.registration : r))
            );
          }
        })
        .catch((err) => console.warn('Submit-proof background sync warning:', err));
    } catch (e) {
      console.warn('Network sync note:', e);
    }

    setAuditLogs((prev) => [
      {
        id: `audit-${Date.now()}`,
        admin: 'SYSTEM',
        action: isCounter ? 'COUNTER_PAY' : 'SUBMIT_PROOF',
        token: updatedReg.token,
        kund: updatedReg.kundNumber,
        timestamp: new Date().toISOString(),
        reason: isCounter ? 'यज्ञ स्थल काउंटर नकद विकल्प' : `UTR ${utrNumber.trim()} प्रस्तुत किया गया`,
      },
      ...prev,
    ]);
  };

  // CASE 1: APPROVED BY ADMIN (PAYMENT VERIFIED)
  if (activeReg && (activeReg.paymentStatus === 'paid' as any)) {
    const kundFormatted =
      activeReg.kundNumbers && activeReg.kundNumbers.length > 0
        ? activeReg.kundNumbers.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')
        : `#${String(activeReg.kundNumber).padStart(3, '0')}`;

    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 text-center">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border-2 border-emerald-400 p-4 sm:p-8 animate-in fade-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-2xl sm:text-3xl mx-auto mb-3 shadow-inner">
            ✓
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase font-extrabold text-emerald-800 bg-emerald-50 px-3 sm:px-4 py-1.5 rounded-full border border-emerald-300 mb-2 max-w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Payment Verified (भुगतान सत्यापित एवं पुष्ट)</span>
          </div>
          <h2 className="text-lg min-[360px]:text-xl sm:text-3xl font-bold font-serif text-stone-900 mt-2 mb-1 leading-snug">
            बधाई हो! आपकी हवन कुंड बुकिंग पूर्णतः स्वीकृत हो चुकी है
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto mb-5 sm:mb-6">
            महर्षि आश्रम प्रशासन द्वारा आपका भुगतान सत्यापित कर दिया गया है। आपकी आधिकारिक रसीद एवं टोकन पास सक्रिय हो गया है।
          </p>

          <div className="max-w-md mx-auto bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 text-center shadow-xs">
            <div className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
              आधिकारिक सत्यापित टोकन संख्या
            </div>
            <div className="font-mono font-black text-xl min-[360px]:text-2xl sm:text-3xl text-[#872e18] break-all">
              {activeReg.token}
            </div>
            <div className="mt-2 text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 inline-block max-w-full">
              {activeReg.kundCount || 1} कुंड ({kundFormatted}) • {activeReg.date} • प्रातः 09:00 AM
            </div>
          </div>

          <div className="my-5 sm:my-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-stone-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200 text-left text-xs">
            <div>
              <span className="text-stone-500 font-bold block text-[10px] min-[360px]:text-[11px]">यजमान</span>
              <span className="font-bold text-stone-900 break-words">{activeReg.fullName || activeReg.husbandName}</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[10px] min-[360px]:text-[11px]">WhatsApp / मोबाइल</span>
              <span className="font-mono font-bold text-stone-900">+91 {activeReg.mobile}</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[10px] min-[360px]:text-[11px]">सत्यापित दक्षिणा</span>
              <span className="font-bold text-[#872e18]">₹ {Number(activeReg.amount).toLocaleString('en-IN')} (सहयोग दक्षिणा)</span>
            </div>
            <div>
              <span className="text-stone-500 font-bold block text-[10px] min-[360px]:text-[11px]">बैंक UTR</span>
              <span className="font-mono font-bold text-stone-900 break-all">{activeReg.utrNumber || 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onOpenSlip(activeReg)}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-white shrink-0" />
              <span>आधिकारिक रसीद व प्रवेश पास देखें / PDF प्रिंट करें</span>
            </button>
            <a
              href={getWhatsAppSendUrl(activeReg.mobile, activeReg)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              title="पंजीकृत मोबाइल पर WhatsApp संदेश प्राप्त करें"
            >
              <span className="text-base leading-none">📲</span>
              <span>WhatsApp पर पास प्राप्त करें</span>
            </a>
            <button
              onClick={onGoHome}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              मुख्य पृष्ठ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 2: REJECTED BY ADMIN (PAYMENT REJECTED)
  if (activeReg && (activeReg.paymentStatus === 'rejected' as any)) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 text-center">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border-2 border-rose-400 p-4 sm:p-8 animate-in fade-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 mx-auto mb-3 shadow-inner">
            <span className="text-xl sm:text-2xl font-bold">✕</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider text-rose-900 bg-rose-100 px-3.5 py-1.5 rounded-full border border-rose-300 mb-2">
            <span>Payment Rejected (भुगतान अस्वीकृत)</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-900 mt-2 mb-2 leading-snug">
            भुगतान सत्यापन अस्वीकृत कर दिया गया है
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-5">
            आश्रम व्यवस्थापक द्वारा बैंक खाते से मिलान करने पर आपका UTR अथवा दक्षिणा विवरण अमान्य पाया गया है। अतः यह पंजीकरण स्थायी नहीं हो सका है।
          </p>

          <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-300 rounded-xl sm:rounded-2xl text-xs text-rose-950 mb-5 sm:mb-6 text-left space-y-1">
            <div className="font-bold text-rose-900">अस्वीकृति का कारण:</div>
            <div>{activeReg.rejectionReason || 'बैंक खाते में दक्षिणा राशि अप्राप्त अथवा अमान्य UTR नंबर।'}</div>
            <div className="text-[11px] text-stone-500 pt-1 font-mono break-all">
              जमा UTR: {activeReg.utrNumber || 'N/A'} • संदर्भ: {activeReg.token}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                setActiveReg({
                  ...activeReg,
                  paymentStatus: 'temp_hold',
                });
              }}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer"
            >
              सही UTR व स्क्रीनशॉट पुनः प्रस्तुत करें
            </button>
            <button
              onClick={onGoBooking}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              नया आरक्षण करें
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 3: PENDING ADMIN APPROVAL (PAYMENT PENDING VERIFICATION)
  if (activeReg && (activeReg.paymentStatus === 'pending' as any)) {
    const kundFormatted =
      activeReg.kundNumbers && activeReg.kundNumbers.length > 0
        ? activeReg.kundNumbers.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')
        : `#${String(activeReg.kundNumber).padStart(3, '0')}`;

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border-2 border-amber-400 p-4 sm:p-8 animate-in fade-in">
          <div className="text-center space-y-2.5 sm:space-y-3 pb-5 sm:pb-6 border-b border-stone-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 mx-auto shadow-inner">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-amber-700" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-900 bg-amber-100 px-3 sm:px-4 py-1.5 rounded-full border border-amber-300 max-w-full">
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="truncate">Payment Pending Verification (भुगतान सत्यापन लंबित)</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-900 leading-snug">
              भुगतान विवरण प्राप्त हुआ • व्यवस्थापक सत्यापन प्रतीक्षित
            </h2>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-xs text-amber-950 font-medium max-w-lg mx-auto leading-relaxed text-left sm:text-center">
              ⚠️ <strong>महत्वपूर्ण निर्देश:</strong> आपका पंजीकरण संदर्भ सुरक्षित हो चुका है। <strong>आश्रम व्यवस्थापक (Admin) द्वारा बैंक खाते से UTR मिलान करने के बाद ही यह आधिकारिक रूप से पुष्ट (CONFIRMED) होगा। तब तक यह टोकन अंतिम प्रवेश पास नहीं है।</strong>
            </div>
          </div>

          <div className="my-5 sm:my-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#fdfaf4] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-200 text-xs">
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">पंजीकरण संदर्भ सं. (Reference ID)</span>
              <span className="font-mono font-bold text-sm sm:text-base text-[#872e18] break-all">{activeReg.token}</span>
              <span className="text-[10px] text-amber-800 font-bold block">(सत्यापन उपरांत अंतिम टोकन पुष्ट होगा)</span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">यज्ञ तिथि एवं समय</span>
              <span className="font-bold text-stone-900 text-xs sm:text-sm">{activeReg.date} • 9:00 AM (प्रातः 09:00 AM)</span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">मुख्य यजमान</span>
              <span className="font-bold text-stone-900 text-xs sm:text-sm break-words">{activeReg.fullName || activeReg.husbandName}</span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">पंजीकृत WhatsApp/मोबाइल</span>
              <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">+91 {activeReg.mobile}</span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">हवन कुंड संख्या एवं मात्रा</span>
              <span className="font-bold text-stone-900 text-xs sm:text-sm">
                {activeReg.kundCount || 1} कुंड ({kundFormatted})
              </span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">कुल देय दक्षिणा (Total Amount)</span>
              <span className="font-bold text-[#872e18] text-xs sm:text-sm">
                ₹ {Number(activeReg.amount).toLocaleString('en-IN')} ({activeReg.kundCount || 1} कुंड • सहयोग दक्षिणा)
              </span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">प्रस्तुत बैंक UTR नंबर</span>
              <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm break-all">{activeReg.utrNumber}</span>
            </div>
            <div>
              <span className="font-bold text-stone-500 uppercase block text-[10px] min-[360px]:text-[11px]">सत्यापन स्थिति (Status)</span>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] min-[360px]:text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                ⏳ Payment Pending Verification
              </span>
            </div>
          </div>

          {activeReg.paymentProofUrl && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <img
                  src={activeReg.paymentProofUrl}
                  alt="Payment Receipt"
                  className="w-12 h-12 object-cover rounded-lg border border-stone-300 shrink-0"
                />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-stone-900 block truncate">भुगतान स्क्रीनशॉट संलग्न है</span>
                  <span className="text-[11px] text-stone-500 block truncate">व्यवस्थापक मिलान हेतु उपलब्ध</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const win = window.open();
                  if (win && activeReg.paymentProofUrl) win.document.write(`<img src="${activeReg.paymentProofUrl}" style="max-width:100%; height:auto;" />`);
                }}
                className="text-xs font-bold text-[#8a1523] hover:underline cursor-pointer shrink-0"
              >
                बड़ा करके देखें 🔍
              </button>
            </div>
          )}

          {/* DEDICATED WHATSAPP NOTIFICATION BOX */}
          <div className="p-3.5 sm:p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl sm:rounded-2xl text-xs text-emerald-950 space-y-1.5 mb-5 sm:mb-6 shadow-2xs">
            <div className="font-bold flex items-center gap-2 text-emerald-900 text-xs sm:text-sm">
              <span className="text-base sm:text-lg">📲</span>
              <span>WhatsApp पर स्वचालित टोकन एवं विवरण प्रेषण:</span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-900/90 leading-relaxed">
              जैसे ही आश्रम व्यवस्थापक द्वारा बैंक खाते से आपके UTR का मिलान पूर्ण होगा, आपका <strong>पुष्ट आधिकारिक टोकन नंबर, हवन कुंड संख्या ({kundFormatted}), समय (9:00 AM) एवं सम्पूर्ण प्रवेश विवरण आपके पंजीकृत मोबाइल नंबर (+91 {activeReg.mobile}) पर WhatsApp द्वारा स्वतः भेज दिए जाएंगे।</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/registrations/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: activeReg.token, mobile: activeReg.mobile }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data && data.result) {
                      setActiveReg(data.result);
                      setRegistrations((prev) =>
                        prev.map((r) => (r.token === data.result.token ? data.result : r))
                      );
                      return;
                    }
                  }
                } catch (e) {}
                const refreshed = allRegistrations.find((r) => r.token === activeReg.token);
                if (refreshed) setActiveReg(refreshed);
              }}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4 text-white shrink-0" />
              <span>सत्यापन स्थिति जांचें (रिफ्रेश)</span>
            </button>
            <button
              onClick={onGoHome}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              मुख्य पृष्ठ पर लौटें
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 4: COUNTER PAY OPTION
  if (activeReg && activeReg.paymentStatus === 'counter_pay') {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 text-center">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border-2 border-blue-400 p-4 sm:p-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-900 mb-2 leading-snug">
            काउंटर भुगतान आरक्षण सुरक्षित
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mb-5 sm:mb-6">
            आपका संदर्भ <strong className="break-all">{activeReg.token}</strong> आरक्षित है। कृपया यज्ञ दिवस पर आश्रम गेट सं. 5 के काउंटर पर नकद दक्षिणा देकर अंतिम रसीद प्राप्त करें।
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onOpenSlip(activeReg)}
              className="w-full sm:w-auto px-6 py-3 bg-[#8a1523] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer"
            >
              काउंटर पर्ची देखें / प्रिंट करें
            </button>
            <button
              onClick={onGoHome}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl border border-stone-300 cursor-pointer"
            >
              मुख्य पृष्ठ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CASE 5: PAYMENT SUBMISSION FORM (Showing official SBI QR.jpg image)
  const kundCount = activeReg?.kundCount || 1;
  const amount = activeReg?.amount || 2100;
  const kundFormatted =
    activeReg?.kundNumbers && activeReg.kundNumbers.length > 0
      ? activeReg.kundNumbers.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')
      : `#${String(activeReg?.kundNumber || 10).padStart(3, '0')}`;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#e8ddcb] p-4 sm:p-8">
        <div className="border-b border-stone-200 pb-4 mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex flex-wrap items-center gap-1 text-[10px] min-[360px]:text-[11px] font-bold text-[#8a1523] bg-amber-100 px-2.5 py-1 rounded-xl mb-1 border border-amber-300 max-w-full">
              <span>यज्ञ तिथि: {activeReg?.date}</span>
              <span>•</span>
              <span>समय: 9:00 AM नियत</span>
              <span>•</span>
              <span>{kundCount} हवन कुंड ({kundFormatted})</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold font-serif text-stone-900 leading-snug">
              सुरक्षित यू.पी.आई. दक्षिणा भुगतान (QR Scan & Pay)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              आधिकारिक SBI QR कोड स्कैन करें और भुगतान उपरांत 12 अंकों का UTR नंबर दर्ज करें।
            </p>
          </div>
          <div className="text-left sm:text-right bg-amber-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-amber-200">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              कुल देय दक्षिणा
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#872e18]">₹ {Number(amount).toLocaleString('en-IN')}</span>
            <span className="text-[11px] font-bold text-stone-600 block">
              ({kundCount} हवन कुंड • सहयोग दक्षिणा)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-start">
          {/* Left: Official QR.jpg Display */}
          <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-[#faf5eb] rounded-2xl sm:rounded-3xl border-2 border-amber-300 text-center shadow-xs w-full">
            <div 
              className="relative max-w-[240px] sm:max-w-[280px] w-full bg-white p-2 rounded-2xl border-2 border-stone-300 shadow-lg cursor-pointer hover:shadow-xl transition-all group overflow-hidden"
              onClick={() => setZoomQr(true)}
              title="बड़ा करके देखने हेतु क्लिक करें"
            >
              <img
                src="QR.jpg"
                alt="श्री महर्षि वेदविज्ञान संस्थान आधिकारिक SBI UPI QR कोड"
                className="w-full h-auto object-contain rounded-xl mx-auto block"
              />
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                <span>🔍 बड़ा करके देखें (Click to Zoom)</span>
              </div>
            </div>

            <div className="text-xs font-bold text-stone-900 mt-3 mb-1">
              आधिकारिक SBI UPI QR कोड (Scan & Pay)
            </div>

            <div className="flex items-center justify-center gap-2 mt-1 bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-mono font-bold text-stone-800 shadow-2xs max-w-full">
              <span className="truncate max-w-[190px] min-[360px]:max-w-none">{systemSettings.upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 hover:bg-stone-100 rounded text-amber-800 cursor-pointer shrink-0"
                title="UPI ID कॉपी करें"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedUpi && <span className="text-[11px] font-bold text-emerald-700 mt-1">कॉपी हो गया!</span>}
            
            <div className="mt-2.5 flex items-center gap-2">
              <a
                href="QR.jpg"
                download="Maharishi_Yagya_SBI_QR.jpg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-300 shadow-2xs transition-colors"
                title="QR कोड पोस्टर डाउनलोड करें"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>QR पोस्टर डाउनलोड करें</span>
              </a>
            </div>

            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs text-emerald-900 w-full shadow-2xs">
              <span className="font-bold flex items-center justify-center gap-1.5 text-emerald-950 mb-0.5">
                <span>📲</span>
                <span>WhatsApp सूचना सेवा</span>
              </span>
              <p className="text-[11px] leading-tight">
                व्यवस्थापक सत्यापन उपरांत टोकन व सभी विवरण आपके WhatsApp नंबर पर स्वतः प्रेषित होंगे।
              </p>
            </div>

            <span className="text-[10px] min-[360px]:text-[11px] text-stone-500 mt-2">
              PhonePe • Google Pay • Paytm • BHIM • YONO SBI • WhatsApp Pay
            </span>
          </div>

          {/* Right: UTR Input & Screenshot */}
          <div className="space-y-4 w-full">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                12 अंकों का बैंक UPI Ref / UTR नंबर <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="उदा. 428512345678"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border-2 border-stone-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-stone-900 focus:outline-hidden focus:border-amber-600"
              />
              <p className="text-[11px] text-stone-500 mt-1.5">
                PhonePe, Google Pay, Paytm अथवा BHIM से भुगतान के बाद प्राप्त 12 अंकों का Ref/UTR नंबर भरें।
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                भुगतान का स्क्रीनशॉट संलग्न करें (वैकल्पिक परंतु अनुशंसित)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="w-full text-xs text-stone-600 file:mr-2 sm:file:mr-3 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
              />

              {screenshotData && (
                <div className="mt-2.5 p-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <img
                      src={screenshotData}
                      alt="Uploaded Receipt Preview"
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-stone-300 shadow-2xs shrink-0"
                    />
                    <div className="text-xs min-w-0">
                      <span className="font-bold text-stone-800 block truncate">स्क्रीनशॉट संलग्न हो गया</span>
                      <span className="text-[11px] text-emerald-700 font-semibold block truncate">सत्यापन हेतु तैयार</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreenshotData('')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-md hover:bg-rose-50 cursor-pointer shrink-0"
                  >
                    हटाएं (Remove)
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl sm:rounded-2xl text-xs text-amber-950 space-y-1">
              <span className="font-bold block text-amber-900">
                🔒 व्यवस्थापक सत्यापन नियम (Admin Verification Policy):
              </span>
              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                यह विवरण सबमिट करने पर आपकी स्थिति तुरंत <strong>“Payment Pending Verification” (भुगतान सत्यापन लंबित)</strong> हो जाएगी। <strong>केवल विवरण भरने से बुकिंग स्वतः कन्फर्म नहीं होगी।</strong> आश्रम व्यवस्थापक द्वारा बैंक खाते से UTR का मिलान करने के बाद ही आधिकारिक टोकन कन्फर्म होगा और WhatsApp पर भेजा जाएगा।
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmitProof(false)}
                className="w-full py-3.5 px-4 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-white shrink-0" />
                <span>भुगतान विवरण जमा करें (Submit for Verification)</span>
              </button>

              <div className="pt-2 border-t border-stone-200 text-center">
                <button
                  type="button"
                  onClick={() => handleSubmitProof(true)}
                  className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
                >
                  अथवा यज्ञ स्थल काउंटर पर नकद दक्षिणा देने का विकल्प चुनें
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {zoomQr && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 cursor-pointer animate-in fade-in"
          onClick={() => setZoomQr(false)}
        >
          <div className="relative max-w-sm w-full max-h-[92vh] overflow-y-auto bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-200 text-xs font-bold text-stone-800">
              <span>आधिकारिक SBI UPI QR कोड</span>
              <button onClick={() => setZoomQr(false)} className="text-stone-500 hover:text-stone-900 text-base font-bold cursor-pointer p-1">✕</button>
            </div>
            <img
              src="QR.jpg"
              alt="श्री महर्षि वेदविज्ञान संस्थान आधिकारिक SBI UPI QR कोड"
              className="w-full max-h-[55vh] object-contain rounded-xl mx-auto shadow-sm"
            />
            <div className="mt-3 flex flex-col min-[360px]:flex-row items-center justify-center gap-2">
              <span className="text-xs font-mono font-bold text-stone-800 bg-stone-100 py-1.5 px-2.5 rounded-xl border border-stone-300 truncate max-w-full">
                UPI ID: {systemSettings.upiId}
              </span>
              <a
                href="QR.jpg"
                download="Maharishi_Yagya_SBI_QR.jpg"
                target="_blank"
                rel="noreferrer"
                className="w-full min-[360px]:w-auto justify-center px-3 py-1.5 bg-[#8a1523] hover:bg-[#70101b] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
                <span>QR सहेजें</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
