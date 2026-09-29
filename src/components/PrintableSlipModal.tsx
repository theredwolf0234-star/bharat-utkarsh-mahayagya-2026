import React, { useState } from 'react';
import {
  ShieldCheck,
  Printer,
  Download,
  X,
  Flame,
} from 'lucide-react';
import { Registration } from '../types/yagya';
import { VENUE_ADDRESS } from '../constants/yagya';

interface PrintableSlipModalProps {
  registration: Registration;
  onClose: () => void;
}

export const PrintableSlipModal: React.FC<PrintableSlipModalProps> = ({
  registration,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="utf-8">
        <title>प्रवेश पास एवं रसीद - ${registration.token}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; background: #faf5eb; margin: 0; padding: 20px; color: #1c1917; }
          .container { max-width: 760px; margin: 0 auto; background: #fff; border: 4px solid #872e18; border-radius: 18px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #eab308; padding-bottom: 12px; margin-bottom: 18px; }
          .header h1 { margin: 4px 0; color: #872e18; font-size: 26px; }
          .header .org { color: #872e18; font-size: 13px; font-weight: bold; letter-spacing: 1px; }
          .header .subtitle { color: #57534e; font-style: italic; font-size: 13px; }
          .banner { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #fcf5e9; border: 1px solid #e8d8be; border-radius: 12px; padding: 12px; margin-bottom: 20px; text-align: center; }
          .banner-item-label { font-size: 11px; font-weight: bold; color: #78716c; text-transform: uppercase; }
          .token-val { font-family: monospace; font-size: 20px; font-weight: 900; color: #872e18; }
          .kund-box { background: #872e18; color: #fff; padding: 8px; border-radius: 8px; font-size: 22px; font-weight: bold; }
          .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
          .details-table td { padding: 9px 6px; border-bottom: 1px solid #e7e5e4; }
          .details-table td.label { color: #78716c; width: 35%; font-weight: 600; }
          .details-table td.value { font-weight: 700; color: #1c1917; }
          .status-paid { color: #166534; background: #dcfce7; padding: 3px 8px; border-radius: 6px; display: inline-block; font-size: 12px; font-weight: bold; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #d6d3d1; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #57534e; }
          .seal-box { border: 2px dashed #872e18; width: 85px; height: 85px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: bold; color: #872e18; font-size: 10px; margin: 0 auto; transform: rotate(-8deg); }
          .no-print-bar { text-align: center; margin-bottom: 20px; }
          .btn { background: #872e18; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; }
          @media print {
            body { background: #fff; padding: 0; }
            .no-print-bar { display: none; }
            .container { border: 2px solid #872e18; box-shadow: none; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <button class="btn" onclick="window.print()">🖨️ PDF के रूप में सहेजें या प्रिंट करें (Save as PDF / Print)</button>
        </div>
        <div class="container">
          <div class="header">
            <div class="org">श्री महर्षि वेदविज्ञान संस्थान</div>
            <h1>भारत उत्कर्ष महायज्ञ 2026</h1>
            <div class="subtitle">"राष्ट्र के उत्कर्ष में ही आपका उत्कर्ष" • 108 हवन कुंड महायज्ञ</div>
          </div>
          <div class="banner">
            <div>
              <div class="banner-item-label">टोकन संख्या</div>
              <div class="token-val">${registration.token}</div>
            </div>
            <div style="padding: 0 10px;">
              <div class="kund-box">हवन कुंड #${registration.kundNumbers && registration.kundNumbers.length > 0 ? registration.kundNumbers.map((n) => String(n).padStart(3, '0')).join(', #') : String(registration.kundNumber).padStart(3, '0')}</div>
              <div style="font-size: 11px; margin-top: 4px; color: #872e18; font-weight: bold;">कुल कुंड: ${registration.kundCount || 1}</div>
            </div>
            <div>
              <div class="banner-item-label">यज्ञ दिवस व तिथि</div>
              <div style="font-weight: 700; color: #1c1917;">${registration.date}</div>
              <div style="font-size: 12px; color: #872e18; font-weight: bold;">प्रातः 09:00 AM सत्र</div>
            </div>
          </div>
          ${registration.paymentStatus !== 'paid' ? `
          <div style="background: #fef2f2; border: 2px dashed #dc2626; color: #991b1b; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 15px; font-weight: bold;">
            ⚠️ अपुष्ट / सत्यापन लंबित - UNCONFIRMED BOOKING (भुगतान सत्यापन लंबित)
            <div style="font-size: 11px; font-weight: normal; margin-top: 4px;">यह आधिकारिक प्रवेश पास नहीं है। आश्रम व्यवस्थापक द्वारा UTR एवं बैंक सत्यापन के उपरांत ही यह पास मान्य होगा।</div>
          </div>` : ''}
          <table class="details-table">
            <tr>
              <td class="label">मुख्य यजमान का नाम:</td>
              <td class="value">${registration.fullName || registration.husbandName}</td>
            </tr>
            ${registration.wifeName ? `
            <tr>
              <td class="label">सह-यजमान / धर्मपत्नी:</td>
              <td class="value">${registration.wifeName}</td>
            </tr>` : ''}
            <tr>
              <td class="label">पंजीकृत मोबाइल नंबर:</td>
              <td class="value">+91 ${registration.mobile}</td>
            </tr>
            ${registration.city ? `
            <tr>
              <td class="label">नगर / शहर:</td>
              <td class="value">${registration.city}</td>
            </tr>` : ''}
            ${registration.gotra ? `
            <tr>
              <td class="label">गोत्र:</td>
              <td class="value">${registration.gotra}</td>
            </tr>` : ''}
            <tr>
              <td class="label">आरक्षित कुंड संख्या:</td>
              <td class="value">${registration.kundCount || 1} कुंड (₹1,100 प्रति कुंड)</td>
            </tr>
            <tr>
              <td class="label">दक्षिणा स्थिति:</td>
              <td class="value">
                ${registration.paymentStatus === 'paid' ? `
                  <span class="status-paid">₹ ${registration.amount} (सत्यापित व स्वीकृत - Payment Verified)</span>
                ` : `
                  <span style="color: #991b1b; background: #fee2e2; padding: 3px 8px; border-radius: 6px; display: inline-block; font-size: 12px; font-weight: bold;">
                    ₹ ${registration.amount} (भुगतान सत्यापन लंबित - Payment Pending Verification)
                  </span>
                `}
              </td>
            </tr>
            ${registration.utrNumber ? `
            <tr>
              <td class="label">बैंक UPI Ref / UTR संदर्भ:</td>
              <td class="value" style="font-family: monospace;">${registration.utrNumber}</td>
            </tr>` : ''}
            <tr>
              <td class="label">यज्ञ स्थल व आगमन:</td>
              <td class="value">${VENUE_ADDRESS}</td>
            </tr>
          </table>
          <div class="footer">
            <div>
              <div style="font-weight: bold; color: #1c1917;">आश्रम कार्यालय मुहर</div>
              <div>महर्षि नगर, सेक्टर-110, नोएडा 201304</div>
            </div>
            <div>
              <div class="seal-box">${registration.paymentStatus === 'paid' ? 'महर्षि आश्रम<br/>सत्यापित मुहर<br/>2026' : 'लंबित सत्यापन<br/>अपुष्ट पास<br/>2026'}</div>
            </div>
            <div style="text-align: right;">
              <div>सत्यापित अधिकृत व्यवस्थापक:</div>
              <div style="font-weight: bold; font-style: italic; color: #1c1917;">${registration.verifiedBy || 'व्यवस्थापक'}</div>
              <div style="font-size: 10px; color: ${registration.paymentStatus === 'paid' ? '#166534' : '#991b1b'}; font-weight: bold;">
                ${registration.paymentStatus === 'paid' ? 'सत्यापन पूर्ण (VERIFIED PASS)' : 'सत्यापन लंबित (PENDING VERIFICATION)'}
              </div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadOfflineSlip = () => {
    const slipElement = document.getElementById('printable-slip-area');
    if (!slipElement) return;

    const fullHtml = `<!DOCTYPE html>
      <html lang="hi">
      <head>
        <meta charset="utf-8">
        <title>प्रवेश पास एवं रसीद - ${registration.token}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif; background: #faf5eb; margin: 0; padding: 20px; color: #1c1917; }
          .container { background: #fff; border: 4px solid #872e18; border-radius: 16px; padding: 24px; max-width: 780px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
          .print-btn-bar { text-align: center; margin-bottom: 20px; }
          .print-btn { background: #872e18; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; }
          @media print {
            body { background: #fff; padding: 0; }
            .print-btn-bar { display: none; }
            .container { border: 2px solid #872e18; box-shadow: none; padding: 10px; width: 100%; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="print-btn" onclick="window.print()">🖨️ PDF के रूप में सहेजें या प्रिंट करें (Save as PDF / Print)</button>
        </div>
        <div class="container">
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
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-4 border-[#872e18] my-auto overflow-hidden animate-in fade-in">
        <div className="bg-[#240608] text-amber-200 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-xs sm:text-base font-serif">
              आधिकारिक प्रवेश पास व रसीद
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPreview}
              className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="प्रिंट प्रीव्यू खोलें एवं PDF के रूप में सहेजें"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिंट प्रीव्यू / PDF सहेजें</span>
            </button>
            <button
              onClick={handleDownloadOfflineSlip}
              className="bg-white/10 hover:bg-white/20 text-amber-200 font-semibold text-xs px-3 py-1.5 rounded-xl border border-amber-400/40 flex items-center gap-1.5 cursor-pointer"
              title="PDF/HTML फ़ाइल डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'डाउनलोड हुआ!' : 'PDF डाउनलोड'}</span>
            </button>
            <button onClick={onClose} className="text-amber-200 hover:text-white p-1 rounded-md text-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="printable-slip-area" className="p-4 sm:p-6 bg-[#fffdf8] relative text-stone-900">
          <div className="border-2 border-[#872e18] rounded-2xl p-4 sm:p-6 relative bg-white shadow-sm space-y-4">
            <div className="text-center border-b-2 border-amber-300 pb-3">
              <div className="text-xs font-bold text-[#872e18] uppercase tracking-wider">
                श्री महर्षि वेदविज्ञान संस्थान
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#872e18]">
                भारत उत्कर्ष महायज्ञ 2026
              </h2>
              <div className="text-xs text-stone-600 italic">
                "राष्ट्र के उत्कर्ष में ही आपका उत्कर्ष" • 108 हवन कुंड महायज्ञ
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fcf5e9] border border-[#e8d8be] rounded-xl p-3.5 items-center text-center sm:text-left">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase block">टोकन संख्या</span>
                <span className="font-mono font-black text-lg text-[#872e18]">{registration.token}</span>
              </div>
              <div className="bg-[#872e18] text-white py-2 px-3 rounded-lg shadow-xs border border-amber-400 text-center">
                <span className="text-[10px] text-amber-300 uppercase block font-medium">हवन कुंड सं.</span>
                <span className="text-xl font-black text-amber-200 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  #{registration.kundNumbers && registration.kundNumbers.length > 0 ? registration.kundNumbers.map((n) => String(n).padStart(3, '0')).join(', #') : String(registration.kundNumber).padStart(3, '0')}
                </span>
                <span className="text-[10px] text-amber-200 font-bold block mt-0.5">कुल कुंड: {registration.kundCount || 1}</span>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-[11px] font-bold text-stone-500 uppercase block">यज्ञ तिथि व समय</span>
                <span className="font-bold text-xs text-stone-900 block">{registration.date}</span>
                <span className="text-[11px] text-amber-900 font-bold">प्रातः 09:00 AM सत्र</span>
              </div>
            </div>

            {registration.paymentStatus !== 'paid' && (
              <div className="bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl p-3 text-center text-rose-800 text-xs">
                <div className="font-bold text-rose-900">⚠️ अपुष्ट / सत्यापन लंबित - UNCONFIRMED BOOKING (Payment Pending Verification)</div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  यह आधिकारिक प्रवेश पास नहीं है। आश्रम व्यवस्थापक द्वारा बैंक में राशि व UTR सत्यापन के बाद ही यह टोकन मान्य होगा।
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs sm:text-sm bg-stone-50/60 p-4 rounded-xl border border-stone-200">
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-500 font-medium">मुख्य यजमान:</span>
                <span className="font-bold text-stone-900">{registration.fullName || registration.husbandName}</span>
              </div>
              {registration.wifeName && (
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">सह-यजमान / धर्मपत्नी:</span>
                  <span className="font-bold text-stone-900">{registration.wifeName}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-500 font-medium">पंजीकृत मोबाइल:</span>
                <span className="font-mono font-bold text-stone-900">+91 {registration.mobile}</span>
              </div>
              {registration.city && (
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">नगर / शहर:</span>
                  <span className="font-bold text-stone-900">{registration.city}</span>
                </div>
              )}
              {registration.gotra && (
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">गोत्र:</span>
                  <span className="font-bold text-stone-900">{registration.gotra}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-500 font-medium">आरक्षित कुंड:</span>
                <span className="font-bold text-stone-900">{registration.kundCount || 1} कुंड (₹1,100 प्रति कुंड)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-200">
                <span className="text-stone-500 font-medium">दक्षिणा स्थिति:</span>
                {registration.paymentStatus === 'paid' ? (
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ₹ {registration.amount} (सत्यापित व स्वीकृत - Payment Verified)
                  </span>
                ) : (
                  <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    ₹ {registration.amount} (भुगतान सत्यापन लंबित - Payment Pending Verification)
                  </span>
                )}
              </div>
              {registration.utrNumber && (
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">बैंक UTR संदर्भ:</span>
                  <span className="font-mono font-bold text-stone-900">{registration.utrNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-stone-500 font-medium">यज्ञ स्थल:</span>
                <span className="text-right text-stone-800 font-bold">{VENUE_ADDRESS}</span>
              </div>
            </div>

            <div className="flex items-end justify-between pt-3 border-t border-stone-300 text-xs text-stone-600">
              <div>
                <div className="font-bold text-stone-800">आश्रम कार्यालय मुहर</div>
                <div className="text-[10px] text-stone-500">सेक्टर-110, नोएडा 201304</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#872e18] flex items-center justify-center text-[9px] font-bold text-[#872e18] uppercase tracking-tighter mx-auto leading-tight rotate-[-10deg] bg-amber-50">
                  {registration.paymentStatus === 'paid' ? (
                    <>महर्षि आश्रम<br />सत्यापित मुहर<br />2026</>
                  ) : (
                    <>लंबित सत्यापन<br />अपुष्ट पास<br />2026</>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-stone-500">सत्यापित अधिकृत व्यवस्थापक:</div>
                <div className="font-serif font-bold text-stone-900 italic text-sm">
                  {registration.verifiedBy || 'व्यवस्थापक'}
                </div>
                <div className={`text-[10px] font-bold ${registration.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {registration.paymentStatus === 'paid' ? '✓ VERIFIED PASS' : '⏳ UNCONFIRMED / PENDING'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
