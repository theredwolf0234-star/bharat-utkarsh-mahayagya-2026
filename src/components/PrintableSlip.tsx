import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Registration, YAGYA_LOCATION_MAP_URL } from '../types/yagya';
import { Language, translations } from '../utils/i18n';
import { MaharishiPortrait } from './MaharishiPortrait';
import { MaharishiEmblem } from './MaharishiEmblem';
import { Printer, X, CheckCircle, ShieldCheck, Flame, Download, MapPin, Navigation, ExternalLink } from 'lucide-react';

interface Props {
  registration: Registration;
  onClose: () => void;
  lang?: Language;
}

export const PrintableSlip: React.FC<Props> = ({ registration, onClose, lang = 'hi' }) => {
  const t = translations[lang] || translations.hi;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const verificationPayload = JSON.stringify({
        event: 'Bharat Utkarsh Maha Yagya 2026',
        token: registration.token,
        kund: String(registration.kundNumber).padStart(3, '0'),
        date: registration.date,
        slot: registration.timeSlot || 'प्रातः 08:00 AM से 11:00 AM',
        yajman: registration.fullName || registration.husbandName,
        mobile: registration.mobile,
        amount: registration.amount,
        status: registration.paymentStatus,
        hash: registration.verificationHash || 'VERIFIED',
      });

      QRCode.toCanvas(
        canvasRef.current,
        verificationPayload,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#4a0e17',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error(err);
        }
      );

      // Generate Data URL for isolated iframe printing & download
      QRCode.toDataURL(
        verificationPayload,
        {
          width: 180,
          margin: 1,
          color: { dark: '#4a0e17', light: '#ffffff' },
        },
        (err, url) => {
          if (!err && url) setQrDataUrl(url);
        }
      );
    }
  }, [registration]);

  // Robust print execution with isolated styling and direct browser printing
  const handlePrint = () => {
    setIsPrinting(true);
    // Short timeout to ensure state and DOM are synchronized
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('Direct print error:', err);
      } finally {
        setIsPrinting(false);
      }
    }, 150);
  };

  // Direct offline ticket download
  const handleDownloadOfflineSlip = () => {
    const slipElement = document.getElementById('printable-slip-area');
    if (!slipElement) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <title>यजमान प्रवेश पत्र - ${registration.token}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif; }
    body { background: #faf5eb; margin: 0; padding: 16px; color: #1c1917; display: flex; flex-direction: column; align-items: center; }
    .slip-container { background: #ffffff; border: 4px solid #872e18; border-radius: 16px; padding: 24px; max-width: 780px; width: 100%; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .print-btn { background: #d97706; color: white; border: none; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-bottom: 16px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .print-btn { display: none; }
      .slip-container { border: 2px solid #872e18; box-shadow: none; padding: 10px; width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ यह प्रवेश पत्र प्रिंट करें (Print Ticket)</button>
  <div class="slip-container">
    ${slipElement.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Yagya-Pass-${registration.token}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedKund = String(registration.kundNumber).padStart(3, '0');

  return (
    <div id="printable-modal-wrapper" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-4 border-[#872e18] my-auto overflow-hidden animate-in fade-in">
        {/* Top Control Bar */}
        <div className="no-print bg-[#240608] text-amber-200 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-xs sm:text-base">
              {t.slipHeading}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'प्रिंटिंग...' : t.printReceipt}</span>
            </button>

            <button
              onClick={handleDownloadOfflineSlip}
              className="bg-white/10 hover:bg-white/20 text-amber-200 font-semibold text-xs px-3 py-1.5 rounded-xl border border-amber-400/40 hidden sm:flex items-center gap-1.5 cursor-pointer"
              title="ऑफलाइन पास डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>डाउनलोड</span>
            </button>

            <button
              onClick={onClose}
              className="text-amber-200 hover:text-white p-1 rounded-md text-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Pass Content */}
        <div id="printable-slip-area" className="p-4 sm:p-6 bg-[#fffdf8] relative text-stone-900">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-[180px] font-serif font-black text-[#872e18]">
            ॐ
          </div>

          <div className="border-2 border-[#872e18] rounded-2xl p-4 sm:p-6 relative bg-white/95 shadow-sm">
            <span className="absolute top-1.5 left-2 text-amber-700 text-lg">卐</span>
            <span className="absolute top-1.5 right-2 text-amber-700 text-lg">ॐ</span>
            <span className="absolute bottom-1.5 left-2 text-amber-700 text-lg">ॐ</span>
            <span className="absolute bottom-1.5 right-2 text-amber-700 text-lg">卐</span>

            {/* Header with Holy Images & Official Emblem */}
            <div className="border-b-2 border-amber-300 pb-3 mb-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Maharishi Mahesh Yogi Ji Oval Portrait */}
                <div className="shrink-0">
                  <MaharishiPortrait size="sm" showBlessing={false} />
                </div>

                {/* Center: Maha Yagya Headings */}
                <div className="text-center flex-1 space-y-0.5">
                  <div className="text-xs font-semibold text-[#872e18]">
                    🌸 जय गुरुदेव • परम पूज्य महर्षि महेश योगी जी 🌸
                  </div>
                  <h2 className="text-xl sm:text-2xl font-heading font-black text-[#872e18]">
                    श्री सिद्धेश्वर धाम • महर्षि आश्रम
                  </h2>
                  <h3 className="text-base sm:text-lg font-bold text-[#b31b2c]">
                    १०८ कुण्डीय भारत उत्कर्ष महायज्ञ २०२६
                  </h3>
                  <p className="text-[11px] text-stone-600 italic">
                    "{t.tagline}" — अधिकृत यजमान प्रवेश पत्र व रसीद
                  </p>
                </div>

                {/* Right: Bharat Utkarsh Maha Yagya Emblem */}
                <div className="shrink-0">
                  <MaharishiEmblem size="sm" showSubtitle={false} />
                </div>
              </div>
            </div>

            {/* Token & Kund Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fcf5e9] border border-[#e8d8be] rounded-xl p-3.5 mb-4 items-center">
              <div className="text-center sm:text-left">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  {t.tokenNo}
                </span>
                <span className="font-mono font-black text-lg sm:text-xl text-[#872e18] tracking-wide select-all">
                  {registration.token}
                </span>
              </div>

              <div className="text-center bg-[#872e18] text-white py-2 px-3 rounded-lg shadow-xs border border-amber-400">
                <span className="text-[10px] text-amber-300 uppercase block font-medium">
                  {t.kundNumber}
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-200 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-400" />
                  #{formattedKund}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                  {t.yagyaDateText}
                </span>
                <span className="font-bold text-sm text-stone-900 block">
                  {registration.date}
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  {registration.timeSlot || 'प्रातः 08:00 AM से 11:00 AM'}
                </span>
              </div>
            </div>

            {/* Yajman Details & Verification QR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-start">
              <div className="sm:col-span-2 space-y-2 text-xs sm:text-sm">
                <div className="grid grid-cols-3 gap-1 py-1 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">{t.husbandName}:</span>
                  <span className="col-span-2 font-bold text-stone-900">
                    {registration.fullName || registration.husbandName}
                  </span>
                </div>

                {registration.wifeName && (
                  <div className="grid grid-cols-3 gap-1 py-1 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">{t.wifeName}:</span>
                    <span className="col-span-2 font-bold text-stone-900">
                      {registration.wifeName}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1 py-1 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">{t.mobileNumber}:</span>
                  <span className="col-span-2 font-mono font-semibold text-stone-800">
                    +91 {registration.mobile}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 py-1 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">समर्पण दक्षिणा:</span>
                  <span className="col-span-2 font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>
                      ₹{registration.amount} ({registration.paymentStatus === 'paid' ? t.statusPaid : t.statusCounterPay})
                    </span>
                  </span>
                </div>

                {registration.utrNumber && registration.utrNumber !== 'COUNTER-PAY-ON-DAY' && (
                  <div className="grid grid-cols-3 gap-1 py-1 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">बैंक UTR:</span>
                    <span className="col-span-2 font-mono text-xs text-stone-800 font-bold">
                      {registration.utrNumber}
                    </span>
                  </div>
                )}

                {registration.verificationHash && (
                  <div className="grid grid-cols-3 gap-1 py-1 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">{t.verificationHashText}</span>
                    <span className="col-span-2 font-mono text-[11px] text-stone-700">
                      {registration.verificationHash}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1 py-1">
                  <span className="text-stone-500 font-medium">{t.venueTitle}:</span>
                  <div className="col-span-2 text-stone-800 text-xs">
                    <div>{t.venueAddress}</div>
                    <a
                      href={YAGYA_LOCATION_MAP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-800 font-bold inline-flex items-center gap-1 hover:underline mt-0.5 no-print"
                    >
                      <MapPin className="w-3 h-3 text-rose-600" />
                      <span>गूगल मैप्स लोकेशन खोलें (Live GPS)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* QR Code with Verified Badge */}
              <div className="flex flex-col items-center justify-center p-3 bg-amber-50/70 border border-amber-300 rounded-xl text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="गेट स्कैनिंग QR कोड"
                    className="w-[140px] h-[140px] shadow-xs rounded-lg object-contain bg-white p-1"
                  />
                ) : (
                  <canvas ref={canvasRef} className="shadow-xs rounded-lg" />
                )}
                <span className="text-[10px] text-stone-600 font-mono mt-1">
                  गेट स्कैनिंग QR कोड
                </span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase mt-0.5 bg-emerald-100 px-2 py-0.5 rounded">
                  ✓ VERIFIED PASS
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-[11px] text-stone-700 space-y-1 mb-4">
              <div className="font-bold text-stone-900">
                📋 यजमान हेतु आवश्यक निर्देश:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>कृपया अपने निर्धारित सत्र से ३० मिनट पूर्व {t.gateNumber} पर उपस्थित हों।</li>
                <li>स्थान जीपीएस नेविगेशन: <span className="font-mono text-amber-900 font-bold">https://maps.app.goo.gl/aFmMAF5gFHR46gBGA</span></li>
                <li>प्रवेश के समय यह रसीद / डिजिटल टोकन प्रवेश द्वार पर दिखाना अनिवार्य है।</li>
                <li>पारंपरिक भारतीय परिधान में पधारने की कृपा करें। हवन सामग्री आश्रम द्वारा उपलब्ध कराई जाएगी।</li>
              </ul>
            </div>

            {/* Footer with Signatures & Seal */}
            <div className="flex items-end justify-between pt-3 border-t border-stone-300 text-xs text-stone-600">
              <div className="text-left space-y-0.5">
                <div className="text-[11px] text-stone-500">आयोजक:</div>
                <div className="font-bold text-stone-800">भारत उत्कर्ष सेवा समिति</div>
                <div className="text-[10px] text-stone-500">महर्षि नगर, सेक्टर-110, नोएडा</div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#872e18] flex items-center justify-center text-[9px] font-bold text-[#872e18] uppercase tracking-tighter mx-auto leading-tight rotate-[-12deg] bg-amber-50/50">
                  आधिकारिक<br />सील व मुहर<br />२०२६
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[11px] text-stone-500">{t.authorizedSign}:</div>
                <div className="font-heading font-bold text-stone-800 italic">यज्ञ समिति प्रबंधक</div>
                <div className="text-[10px] text-emerald-700 font-bold">डिजिटल प्रमाणित</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
