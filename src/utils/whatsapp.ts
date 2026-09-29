import { Registration } from '../types/yagya';
import { VENUE_ADDRESS } from '../constants/yagya';

/**
 * Generates an official WhatsApp notification message containing confirmed token number and complete registration details
 */
export const formatYagyaWhatsAppMessage = (reg: Registration): string => {
  const kundFormatted =
    reg.kundNumbers && reg.kundNumbers.length > 0
      ? reg.kundNumbers.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')
      : `#${String(reg.kundNumber).padStart(3, '0')}`;

  const kundCountText = reg.kundCount && reg.kundCount > 1 ? `${reg.kundCount} हवन कुंड (${kundFormatted})` : `1 हवन कुंड (${kundFormatted})`;

  return `🚩 *श्री महर्षि वेदविज्ञान संस्थान* 🚩
*भारत उत्कर्ष महायज्ञ 2026*
-----------------------------------------
सादर प्रणाम *${reg.fullName || reg.husbandName || 'यजमान'}* जी,

आपकी 108 हवन कुंड महायज्ञ दक्षिणा आश्रम व्यवस्थापक (Admin) द्वारा *सत्यापित एवं स्वीकृत (PAYMENT VERIFIED)* कर दी गई है! आपकी बुकिंग स्थायी रूप से पुष्ट (CONFIRMED) हो चुकी है।

📋 *आधिकारिक पंजीकरण एवं प्रवेश विवरण:*
• *आधिकारिक टोकन संख्या:* *${reg.token}*
• *मुख्य यजमान:* ${reg.fullName || reg.husbandName}
${reg.wifeName ? `• *सह-यजमान / धर्मपत्नी:* ${reg.wifeName}\n` : ''}• *पंजीकृत WhatsApp/मोबाइल:* +91 ${reg.mobile}
• *यज्ञ तिथि:* ${reg.date}
• *यज्ञ समय:* 9:00 AM (प्रातः 09:00 AM)
• *हवन कुंड संख्या:* ${kundCountText}
• *कुल दक्षिणा राशि:* ₹ ${reg.amount} (₹1,100 प्रति कुंड - सत्यापित)
• *बैंक UTR संदर्भ:* ${reg.utrNumber || 'N/A'}
• *सत्यापन स्थिति:* ✅ भुगतान सत्यापित (Payment Verified)
• *यज्ञ स्थल:* ${VENUE_ADDRESS}

⚠️ *महत्वपूर्ण आगमन निर्देश:*
कृपया यज्ञ दिवस पर *प्रातः 08:30 AM* तक आश्रम के गेट सं. 5 पर यह आधिकारिक टोकन नंबर दिखाकर अपना प्रवेश पास प्राप्त करें।

"राष्ट्र के उत्कर्ष में ही आपका उत्कर्ष"
- *महर्षि आश्रम प्रशासन एवं यज्ञ समिति, नोएडा*
-----------------------------------------`;
};

/**
 * Builds direct WhatsApp Web / App link for sending confirmation message
 */
export const getWhatsAppSendUrl = (mobile: string, reg: Registration): string => {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const msg = formatYagyaWhatsAppMessage(reg);
  return `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(msg)}`;
};

/**
 * Message generator for Payment Rejection notification
 */
export const formatRejectionWhatsAppMessage = (reg: Registration, reason?: string): string => {
  return `🚩 *श्री महर्षि वेदविज्ञान संस्थान* 🚩
*भारत उत्कर्ष महायज्ञ 2026*
-----------------------------------------
सादर प्रणाम *${reg.fullName || reg.husbandName || 'यजमान'}* जी,

आपके द्वारा प्रस्तुत हवन कुंड आरक्षण दक्षिणा (UTR: ${reg.utrNumber || 'N/A'}) का बैंक खाते से मिलान नहीं हो सका है।
अतः आपकी यह बुकिंग *अस्वीकृत (Payment Rejected)* कर दी गई है।

⚠️ *अस्वीकृति कारण:*
${reason || reg.rejectionReason || 'बैंक खाते में दक्षिणा अप्राप्त अथवा अमान्य UTR नंबर।'}

कृपया सही बैंक UTR व स्क्रीनशॉट के साथ पुनः पंजीकरण करें अथवा आश्रम कार्यालय से संपर्क करें।
हेल्पलाइन: +91 9876543210
- *महर्षि आश्रम प्रशासन, नोएडा*
-----------------------------------------`;
};

export const getRejectionWhatsAppSendUrl = (mobile: string, reg: Registration, reason?: string): string => {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const msg = formatRejectionWhatsAppMessage(reg, reason);
  return `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(msg)}`;
};
