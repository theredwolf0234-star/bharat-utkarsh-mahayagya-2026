import nodemailer from 'nodemailer';

export interface DeliveryStatus {
  success: boolean;
  deliveryConfigured: boolean;
  channel?: 'email' | 'sms' | 'none';
  message: string;
  debugCode?: string; // Only provided in development/test mode
}

/**
 * Check if SMTP email delivery is configured in environment variables
 */
export function isEmailConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  return Boolean(host && user && pass);
}

/**
 * Check if SMS delivery is configured in environment variables (Fast2SMS or Twilio)
 */
export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.FAST2SMS_API_KEY ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
  );
}

/**
 * Technical explanation of required environment variables for deployment
 */
export function getRequiredConfigurationNotice(): {
  email: { configured: boolean; requiredVars: string[] };
  sms: { configured: boolean; requiredVars: string[] };
} {
  return {
    email: {
      configured: isEmailConfigured(),
      requiredVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'],
    },
    sms: {
      configured: isSmsConfigured(),
      requiredVars: ['FAST2SMS_API_KEY (or TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)'],
    },
  };
}

/**
 * Create nodemailer transporter from environment variables
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

/**
 * Send Password Reset OTP Email
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  otp: string,
  userName: string = 'यजमान'
): Promise<DeliveryStatus> {
  if (!isEmailConfigured()) {
    console.warn(
      `[AUTH NOTICE] SMTP is not configured. Reset OTP for ${toEmail}: ${otp} (Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable live email delivery)`
    );
    const isDev = process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true';
    return {
      success: false,
      deliveryConfigured: false,
      channel: 'none',
      message: 'सर्वर पर ईमेल सेवा (SMTP) अभी कॉन्फ़िगर नहीं है।',
      debugCode: isDev ? otp : undefined,
    };
  }

  try {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"भारत उत्कर्ष महायज्ञ 2026" <noreply@bharatutkarsh.org>`;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `[गोपनीय] पासवर्ड रीसेट सुरक्षा कोड - भारत उत्कर्ष महायज्ञ 2026`,
      text: `नमस्ते ${userName},\n\nआपके भारत उत्कर्ष महायज्ञ 2026 खाते का पासवर्ड रीसेट करने हेतु सुरक्षा OTP कोड है:\n\n${otp}\n\nयह कोड अगले 10 मिनट के लिए वैध है। यदि आपने यह अनुरोध नहीं किया था, तो कृपया इसे अनदेखा करें।\n\nमहर्षि भारत उत्कर्ष महायज्ञ आयोजन समिति`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 2px solid #e07a14; border-radius: 16px; overflow: hidden; background: #fffcf7;">
          <div style="background: linear-gradient(135deg, #240608 0%, #872e18 100%); padding: 24px; text-align: center; color: #ffea79;">
            <h1 style="margin: 0; font-size: 22px;">भारत उत्कर्ष महायज्ञ 2026</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #fde68a;">खाता सुरक्षा एवं पासवर्ड रीसेट</p>
          </div>
          <div style="padding: 28px; color: #292524;">
            <p style="font-size: 15px; margin-top: 0;">सादर प्रणाम <strong>${userName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6;">
              आपके पंजीकृत खाते के लिए पासवर्ड रीसेट अनुरोध प्राप्त हुआ है। अपना नया पासवर्ड निर्धारित करने हेतु नीचे दिए गए 6-अंकों के एकमुश्त सुरक्षा कोड (OTP) का उपयोग करें:
            </p>
            <div style="background: #fef3c7; border: 2px dashed #d97706; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #92400e; font-family: monospace;">${otp}</span>
              <p style="margin: 8px 0 0; font-size: 12px; color: #b45309; font-weight: 600;">⏱️ यह कोड केवल 10 मिनट के लिए वैध है</p>
            </div>
            <p style="font-size: 12px; color: #78716c; line-height: 1.5;">
              सुरक्षा चेतावनी: यह कोड किसी के साथ साझा न करें। महायज्ञ समिति का कोई भी प्रतिनिधि आपसे कभी भी पासवर्ड या OTP नहीं मांगता है।
            </p>
          </div>
          <div style="background: #f5f5f4; padding: 16px; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4;">
            रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return {
      success: true,
      deliveryConfigured: true,
      channel: 'email',
      message: 'सत्यापन कोड आपके पंजीकृत ईमेल पते पर भेज दिया गया है।',
    };
  } catch (error: any) {
    console.error('SMTP Email dispatch failed:', error);
    return {
      success: false,
      deliveryConfigured: true,
      channel: 'email',
      message: `ईमेल प्रेषण में त्रुटि: ${error.message}`,
    };
  }
}

/**
 * Send Admin Recovery Alert Email
 */
export async function sendAdminRecoveryAlertEmail(
  toEmail: string,
  recoveryCode: string,
  adminUsername: string = 'maharishi_admin'
): Promise<DeliveryStatus> {
  if (!isEmailConfigured()) {
    console.warn(
      `[ADMIN SECURITY NOTICE] SMTP not configured. Admin Recovery Code for ${adminUsername}: ${recoveryCode}`
    );
    const isDev = process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true';
    return {
      success: false,
      deliveryConfigured: false,
      channel: 'none',
      message: 'सर्वर पर प्रशासक ईमेल सेवा कॉन्फ़िगर नहीं है।',
      debugCode: isDev ? recoveryCode : undefined,
    };
  }

  try {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"सुरक्षा प्रकोष्ठ - महायज्ञ 2026" <security@bharatutkarsh.org>`;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `[अति-संवेदनशील] प्रशासक पासवर्ड रीसेट कोड - भारत उत्कर्ष महायज्ञ`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 2px solid #b91c1c; border-radius: 16px; overflow: hidden; background: #fffcf7;">
          <div style="background: #450a0a; padding: 20px; text-align: center; color: #fecaca;">
            <h2 style="margin: 0; font-size: 18px;">⚠️ मुख्य व्यवस्थापक खाता पुनर्प्राप्ति</h2>
          </div>
          <div style="padding: 24px; color: #1c1917;">
            <p>व्यवस्थापक यूज़रनेम: <strong>${adminUsername}</strong></p>
            <p>प्रशासक पासवर्ड रीसेट करने हेतु आधिकारिक 6-अंकों का सुरक्षा कोड:</p>
            <div style="background: #fee2e2; border: 2px dashed #dc2626; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #991b1b; font-family: monospace;">${recoveryCode}</span>
              <p style="margin: 6px 0 0; font-size: 11px; color: #b91c1c;">वैधता: 10 मिनट (केवल 1 बार प्रयोग)</p>
            </div>
            <p style="font-size: 12px; color: #7f1d1d;">यदि यह अनुरोध आपने नहीं किया था, तो तुरंत सर्वर के क्रेडेंशियल और SSH कुंजी की जांच करें।</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return {
      success: true,
      deliveryConfigured: true,
      channel: 'email',
      message: 'प्रशासक पुनर्प्राप्ति कोड अधिकृत ईमेल पते पर भेज दिया गया है।',
    };
  } catch (error: any) {
    return {
      success: false,
      deliveryConfigured: true,
      channel: 'email',
      message: error.message,
    };
  }
}

/**
 * Send Account Registration Verification OTP Email
 */
export async function sendAccountVerificationEmail(
  toEmail: string,
  otp: string,
  userName: string = 'यजमान'
): Promise<DeliveryStatus> {
  if (!isEmailConfigured()) {
    console.warn(
      `[AUTH NOTICE] SMTP is not configured. Verification OTP for ${toEmail}: ${otp} (Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable live email delivery)`
    );
    const isDev = process.env.NODE_ENV !== 'production' || process.env.TEST_MODE === 'true';
    return {
      success: false,
      deliveryConfigured: false,
      channel: 'none',
      message: 'सर्वर पर ईमेल सेवा (SMTP) अभी सक्रिय नहीं है।',
      debugCode: isDev ? otp : undefined,
    };
  }

  try {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"भारत उत्कर्ष महायज्ञ 2026" <noreply@bharatutkarsh.org>`;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `[सत्यापन कोड] खाता सक्रियण OTP - भारत उत्कर्ष महायज्ञ 2026`,
      text: `सादर प्रणाम ${userName} जी,\n\nभारत उत्कर्ष महायज्ञ 2026 में यजमान खाता सक्रिय करने हेतु आपका सुरक्षा सत्यापन कोड है:\n\n${otp}\n\nयह कोड 15 मिनट के लिए मान्य है।\n\nसादर,\nआश्रम व्यवस्थापक मण्डल`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 2px solid #e07a14; border-radius: 16px; overflow: hidden; background: #fffcf7;">
          <div style="background: linear-gradient(135deg, #240608 0%, #872e18 100%); padding: 24px; text-align: center; color: #ffea79;">
            <h1 style="margin: 0; font-size: 22px;">भारत उत्कर्ष महायज्ञ 2026</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #fde68a;">खाता सत्यापन एवं सक्रियण</p>
          </div>
          <div style="padding: 28px; color: #292524;">
            <p style="font-size: 15px; margin-top: 0;">सादर प्रणाम <strong>${userName} जी</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6;">
              भारत उत्कर्ष महायज्ञ 2026 पोर्टल पर आपका साधक खाता सक्रिय करने हेतु 6-अंकों का सुरक्षा सत्यापन कोड नीचे दिया गया है:
            </p>
            <div style="background: #fef3c7; border: 2px dashed #d97706; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #92400e; font-family: monospace;">${otp}</span>
              <p style="margin: 8px 0 0; font-size: 12px; color: #b45309; font-weight: 600;">⏱️ यह कोड 15 मिनट के लिए मान्य है</p>
            </div>
            <p style="font-size: 12px; color: #78716c; line-height: 1.5;">
              सुरक्षा चेतावनी: यह कोड किसी के साथ साझा न करें। महायज्ञ समिति का कोई भी प्रतिनिधि आपसे OTP नहीं मांगता है।
            </p>
          </div>
          <div style="background: #f5f5f4; padding: 16px; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4;">
            रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return {
      success: true,
      deliveryConfigured: true,
      channel: 'email',
      message: 'सत्यापन कोड आपके पंजीकृत ईमेल पते पर भेज दिया गया है।',
    };
  } catch (error: any) {
    console.error('SMTP Email dispatch failed:', error);
    return {
      success: false,
      deliveryConfigured: true,
      channel: 'email',
      message: `ईमेल प्रेषण में त्रुटि: ${error.message || 'Unknown error'}`,
    };
  }
}

