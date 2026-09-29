export type Language = 'hi' | 'en' | 'sa' | 'gu';

export interface Translations {
  // Navigation & Branding
  appName: string;
  tagline: string;
  eventDates: string;
  homeTab: string;
  regTab: string;
  payTab: string;
  mapTab: string;
  databaseTab: string;
  adminPortal: string;
  lookupTab: string;
  testModeBadge: string;
  testModeBanner: string;

  // Stepper
  step1: string;
  step2: string;
  step3: string;
  step4: string;

  // Home Page
  heroTitle: string;
  heroSubtitle: string;
  pricePerPerson: string;
  totalKunds: string;
  availableKunds: string;
  bookedKunds: string;
  reservedNotice: string;
  registerNowBtn: string;
  findMyPassBtn: string;
  sacredYagyaHeading: string;
  kundAllocationRulesTitle: string;
  rule1: string;
  rule2: string;
  rule3: string;

  // Registration Form
  personalInfoTitle: string;
  husbandName: string;
  husbandNamePlaceholder: string;
  wifeName: string;
  wifeNamePlaceholder: string;
  mobileNumber: string;
  mobilePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  city: string;
  cityPlaceholder: string;
  gotra: string;
  gotraPlaceholder: string;
  address: string;
  addressPlaceholder: string;
  participationType: string;
  personCount: string;
  sessionTimeSlot: string;
  selectDate: string;
  selectKund: string;
  kundNumber: string;
  tokenNo: string;
  proceedToPayment: string;
  fillAllRequired: string;
  invalidMobile: string;

  // Hawan Kund Tracker
  kundTrackerTitle: string;
  legendAvailable: string;
  legendOccupied: string;
  legendPending: string;
  legendReserved: string;
  selectKundPrompt: string;
  kundCapacityFull: string;
  kundAlreadyBooked: string;

  // Payment & Verification (The Core Flow)
  paymentTitle: string;
  tempReservationNotice: string;
  reservationTimerText: string;
  reservationExpiredTitle: string;
  reservationExpiredDesc: string;
  restartReservationBtn: string;
  scanAndPay: string;
  upiId: string;
  copyUpiBtn: string;
  upiCopied: string;
  payableAmount: string;
  enterUtr: string;
  utrPlaceholder: string;
  utrHelpText: string;
  uploadScreenshotTitle: string;
  uploadScreenshotHint: string;
  screenshotUploaded: string;
  submitForVerificationBtn: string;
  verifyingText: string;
  pendingVerificationTitle: string;
  pendingVerificationDesc: string;
  pendingNoticeWhy: string;
  checkStatusBtn: string;
  counterPay: string;
  counterPayDesc: string;
  testModeInstantApproveBtn: string;
  testModeNote: string;

  // Status Badges
  statusPaid: string;
  statusPending: string;
  statusRejected: string;
  statusCounterPay: string;
  statusExpired: string;
  statusTempHold: string;

  // Confirmation & Token Generated (Step 4)
  confirmedTitle: string;
  confirmedSubtitle: string;
  officialTokenIssued: string;
  printReceipt: string;
  printAllSlips: string;
  downloadPass: string;
  backToHome: string;
  verificationHashText: string;

  // Admin Portal
  adminTitle: string;
  adminSubtitle: string;
  adminLoginTitle: string;
  adminSetupTitle: string;
  adminUsername: string;
  adminPassword: string;
  adminConfirmPassword: string;
  loginBtn: string;
  logoutBtn: string;
  pendingQueueTab: string;
  allBookingsTab: string;
  auditLogsTab: string;
  settingsTab: string;
  approveBookingBtn: string;
  rejectBookingBtn: string;
  viewScreenshotBtn: string;
  noScreenshot: string;
  rejectReasonPrompt: string;
  rejectionReasonPlaceholder: string;
  confirmRejectBtn: string;
  cancelBtn: string;
  auditActionApproved: string;
  auditActionRejected: string;
  reservationExpirySetting: string;
  testModeToggle: string;
  saveSettingsBtn: string;
  exportExcel: string;
  exportBackup: string;
  importBackup: string;

  // Lookup View
  lookupTitle: string;
  lookupSubtitle: string;
  lookupPlaceholder: string;
  noReceiptFound: string;
  receiptsFound: string;

  // Venue & Slip
  venueTitle: string;
  venueAddress: string;
  gateNumber: string;
  directions: string;
  slipHeading: string;
  authorizedSign: string;
  yagyaDateText: string;
  sessionText: string;
}

export const translations: Record<Language, Translations> = {
  hi: {
    appName: 'भारत उत्कर्ष महायज्ञ',
    tagline: 'राष्ट्र की समृद्धि में आपकी समृद्धि',
    eventDates: '16 से 25 नवम्बर 2026',
    homeTab: 'मुख्य पृष्ठ',
    regTab: 'यजमान पंजीकरण',
    payTab: 'सुरक्षित भुगतान',
    mapTab: 'यज्ञ स्थल व मानचित्र',
    databaseTab: 'डेटाबेस',
    adminPortal: 'व्यवस्थापक पोर्टल',
    lookupTab: 'पंजीकरण खोजें',
    testModeBadge: 'परीक्षण मोड (TEST)',
    testModeBanner: '🧪 निःशुल्क परीक्षण मोड सक्रिय: बिना वास्तविक UPI भुगतान के त्वरित परीक्षण बुकिंग संभव है।',

    step1: '१. यजमान विवरण',
    step2: '२. कुंड व सत्र चयन',
    step3: '३. भुगतान व सत्यापन',
    step4: '४. आधिकारिक टोकन व पास',

    heroTitle: 'महर्षि भारत उत्कर्ष महायज्ञ २०२६',
    heroSubtitle: '१०८ भव्य हवन कुंडों में राष्ट्र कल्याण एवं व्यक्तिगत सुख-समृद्धि हेतु आहुति दें।',
    pricePerPerson: '₹1100 प्रति यजमान',
    totalKunds: '१०८ हवन कुंड',
    availableKunds: 'उपलब्ध कुंड',
    bookedKunds: 'आरक्षित कुंड',
    reservedNotice: 'कुंड १ से ९ पूज्य संत एवं यज्ञाचार्य गण हेतु आरक्षित हैं।',
    registerNowBtn: 'हवन कुंड बुक करें',
    findMyPassBtn: 'अपना टोकन / रसीद खोजें',
    sacredYagyaHeading: 'पवित्र यज्ञ व्यवस्था एवं नियम',
    kundAllocationRulesTitle: 'हवन कुंड आवंटन नियम',
    rule1: 'कुंड 1 से 9 केवल पूज्य संतों, शंकराचार्यों एवं मुख्य आचार्यों के लिए आरक्षित हैं।',
    rule2: 'कुंड 10 से 108 आम यजमानों हेतु उपलब्ध हैं।',
    rule3: 'प्रत्येक कुंड पर केवल 1 दंपति/परिवार रहेगा। जब तक सभी कुंडों में 1-1 यजमान न हों, कोई दूसरा यजमान साझा नहीं होगा।',

    personalInfoTitle: 'यजमान की व्यक्तिगत जानकारी',
    husbandName: 'मुख्य यजमान / पति का नाम',
    husbandNamePlaceholder: 'उदा. राम प्रसाद शर्मा',
    wifeName: 'सह-यजमान / पत्नी का नाम',
    wifeNamePlaceholder: 'उदा. श्रीमती सीता शर्मा',
    mobileNumber: 'मोबाइल नंबर (10 अंक)',
    mobilePlaceholder: '9876543210',
    email: 'ईमेल पता (वैकल्पिक)',
    emailPlaceholder: 'devotee@example.com',
    city: 'शहर / नगर',
    cityPlaceholder: 'उदा. नोएडा / दिल्ली',
    gotra: 'गोत्र (वैकल्पिक)',
    gotraPlaceholder: 'उदा. कश्यप / भारद्वाज',
    address: 'निवास का पता',
    addressPlaceholder: 'उदा. सेक्टर 110, नोएडा',
    participationType: 'यज्ञ सहभागिता प्रकार',
    personCount: 'कुल आहुति देने वाले व्यक्ति',
    sessionTimeSlot: 'यज्ञ सत्र (समय स्लॉट)',
    selectDate: 'महायज्ञ की तिथि चुनें',
    selectKund: 'हवन कुंड संख्या चुनें (10 से 108)',
    kundNumber: 'हवन कुंड संख्या',
    tokenNo: 'विशिष्ट टोकन संख्या',
    proceedToPayment: 'कुंड अस्थायी आरक्षित करें एवं भुगतान पर जाएं →',
    fillAllRequired: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
    invalidMobile: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।',

    kundTrackerTitle: '१०८ हवन कुंड लाइव उपलब्धता व स्थिति',
    legendAvailable: 'रिक्त व उपलब्ध',
    legendOccupied: 'सत्यापित / बुक',
    legendPending: 'अस्थायी रोक (सत्यापन लंबित)',
    legendReserved: 'पूज्य संतों हेतु आरक्षित (1-9)',
    selectKundPrompt: 'कृपया ऊपर दिए गए ग्रिड से उपलब्ध कुंड पर क्लिक करें',
    kundCapacityFull: 'यह कुंड इस तिथि पर पूर्ण हो चुका है।',
    kundAlreadyBooked: 'यह कुंड पहले से ही बुक या आरक्षित है। कृपया दूसरा चुनें।',

    paymentTitle: 'सुरक्षित UPI भुगतान एवं सत्यापन प्रमाण',
    tempReservationNotice: 'आपका चयनित कुंड अस्थायी रूप से आरक्षित कर दिया गया है!',
    reservationTimerText: 'आरक्षण समाप्ति समय:',
    reservationExpiredTitle: 'अस्थायी आरक्षण समाप्त हो गया!',
    reservationExpiredDesc: 'समय सीमा समाप्त होने के कारण कुंड अन्य यजमानों हेतु मुक्त कर दिया गया है।',
    restartReservationBtn: 'पुनः बुकिंग शुरू करें',
    scanAndPay: 'SBI आधिकारिक UPI QR स्कैन कर भुगतान करें',
    upiId: 'आधिकारिक UPI ID: maharishivedvigyan@sbi',
    copyUpiBtn: 'UPI ID कॉपी करें',
    upiCopied: 'कॉपी हो गया!',
    payableAmount: 'कुल देय दक्षिणा राशि',
    enterUtr: '12 अंकों का बैंक UPI Ref / UTR नंबर दर्ज करें',
    utrPlaceholder: 'उदा. 428512345678',
    utrHelpText: 'अपने PhonePe, Google Pay, Paytm या BHIM ऐप की रसीद से 12 अंकों का UTR / UPI Transaction ID दर्ज करें। (कोई भी यादृच्छिक 12 अंक दर्ज करने पर भुगतान तुरंत स्वीकृत नहीं होगा; आश्रम व्यवस्थापक बैंक से मिलान करेंगे।)',
    uploadScreenshotTitle: 'भुगतान का स्क्रीनशॉट प्रमाण अपलोड करें',
    uploadScreenshotHint: 'PhonePe / GPay / Paytm सफलता स्क्रीन का स्क्रीनशॉट चुनें (PNG, JPG, WebP - अधिकतम 5MB)',
    screenshotUploaded: 'स्क्रीनशॉट सफलतापूर्वक चयनित!',
    submitForVerificationBtn: 'सत्यापन हेतु UTR व स्क्रीनशॉट जमा करें →',
    verifyingText: 'जमा किया जा रहा है...',
    pendingVerificationTitle: 'भुगतान प्रमाण जमा हुआ • सत्यापन लंबित (Pending Verification)',
    pendingVerificationDesc: 'आपका UTR और स्क्रीनशॉट प्राप्त हो चुका है। सुरक्षा एवं पारदर्शिता हेतु आश्रम व्यवस्थापक द्वारा बैंक खाते से मिलान के बाद ही बुकिंग स्थायी रूप से स्वीकृत की जाएगी।',
    pendingNoticeWhy: '⚠️ ध्यान दें: यादृच्छिक या अमान्य UTR दर्ज करने पर बुकिंग निरस्त कर दी जाएगी। व्यवस्थापक द्वारा स्वीकृति मिलते ही आपका पुष्ट QR प्रवेश पत्र सक्रिय हो जाएगा।',
    checkStatusBtn: 'वर्तमान स्थिति जांचें (Refresh Status)',
    counterPay: 'यज्ञ स्थल काउंटर पर नकद भुगतान विकल्प',
    counterPayDesc: 'आप यज्ञ के दिन काउंटर पर भी नकद दक्षिणा जमा कर सकते हैं।',
    testModeInstantApproveBtn: '🧪 परीक्षण मोड: त्वरित स्वीकृति (Demo Instant Approve)',
    testModeNote: 'परीक्षण मोड सक्रिय है: बिना वास्तविक UTR के सिस्टम का परीक्षण कर सकते हैं।',

    statusPaid: 'सत्यापित एवं स्वीकृत (Paid)',
    statusPending: 'व्यवस्थापक सत्यापन लंबित (Pending)',
    statusRejected: 'अस्वीकृत (Rejected)',
    statusCounterPay: 'काउंटर पर देय (Counter Pay)',
    statusExpired: 'समय समाप्त (Expired)',
    statusTempHold: 'अस्थायी आरक्षित (Hold)',

    confirmedTitle: 'बधाई हो! आपकी यजमान बुकिंग स्थायी रूप से स्वीकृत है',
    confirmedSubtitle: 'महर्षि भारत उत्कर्ष महायज्ञ २०२६ में आपका स्वागत है। आपका आधिकारिक प्रवेश पत्र जारी कर दिया गया है।',
    officialTokenIssued: 'आधिकारिक QR कोड व टोकन जारी',
    printReceipt: 'प्रवेश पत्र व रसीद प्रिंट करें',
    printAllSlips: 'सभी रसीदें प्रिंट करें',
    downloadPass: 'रसीद डाउनलोड करें',
    backToHome: 'मुख्य पृष्ठ पर लौटें',
    verificationHashText: 'डिजिटल सत्यापन मुहर:',

    adminTitle: 'यज्ञ नियंत्रण एवं व्यवस्थापक पैनल (Admin Portal)',
    adminSubtitle: 'श्री महर्षि वेदविज्ञान संस्थान • भारत उत्कर्ष महायज्ञ २०२६',
    adminLoginTitle: 'व्यवस्थापक सुरक्षित लॉगिन',
    adminSetupTitle: 'प्रथम एवं एकमात्र मुख्य व्यवस्थापक खाता सेटअप',
    adminUsername: 'व्यवस्थापक यूज़रनेम',
    adminPassword: 'सुरक्षित पासवर्ड',
    adminConfirmPassword: 'पासवर्ड की पुष्टि करें',
    loginBtn: 'लॉगिन करें',
    logoutBtn: 'लॉगआउट',
    pendingQueueTab: 'सत्यापन कतार (Pending)',
    allBookingsTab: 'सभी यजमान बुकिंग्स',
    auditLogsTab: 'ऑडिट लॉग (Audit Trail)',
    settingsTab: 'सिस्टम सेटिंग्स व टेस्ट मोड',
    approveBookingBtn: '✓ स्वीकृत करें (Mark Paid)',
    rejectBookingBtn: '✕ अस्वीकृत करें (Reject)',
    viewScreenshotBtn: 'स्क्रीनशॉट देखें',
    noScreenshot: 'स्क्रीनशॉट उपलब्ध नहीं',
    rejectReasonPrompt: 'अस्वीकृति का कारण दर्ज करें (उदा. अमान्य UTR, बैंक में राशि अप्राप्त):',
    rejectionReasonPlaceholder: 'अस्वीकृति का कारण...',
    confirmRejectBtn: 'अस्वीकृति की पुष्टि करें',
    cancelBtn: 'रद्द करें',
    auditActionApproved: 'बुकिंग स्वीकृत की गई',
    auditActionRejected: 'बुकिंग अस्वीकृत की गई',
    reservationExpirySetting: 'अस्थायी आरक्षण समय सीमा (मिनट में):',
    testModeToggle: 'निःशुल्क परीक्षण मोड (Free Test Mode):',
    saveSettingsBtn: 'सेटिंग्स सुरक्षित करें',
    exportExcel: 'Excel / CSV डाउनलोड',
    exportBackup: 'डेटा बैकअप लें',
    importBackup: 'बैकअप आयात करें',

    lookupTitle: 'अपना पंजीकरण व टोकन खोजें',
    lookupSubtitle: 'अपना 10 अंकों का पंजीकृत मोबाइल नंबर या विशिष्ट टोकन संख्या दर्ज करें।',
    lookupPlaceholder: 'उदा. 9876543210 अथवा MUMY-26-K010-...',
    noReceiptFound: 'दर्ज किए गए विवरण से कोई रसीद नहीं मिली। कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।',
    receiptsFound: 'यजमान रसीद मिली',

    venueTitle: 'यज्ञ स्थल एवं प्रवेश द्वार',
    venueAddress: 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
    gateNumber: 'गेट संख्या 5 (Gate No. 5) - मुख्य यजमान प्रवेश द्वार',
    directions: 'गूगल मैप्स पर दिशा-निर्देश प्राप्त करें',
    slipHeading: 'महर्षि भारत उत्कर्ष महायज्ञ २०२६ — आधिकारिक यजमान प्रवेश पत्र',
    authorizedSign: 'अधिकृत व्यवस्थापक हस्ताक्षर व मुहर',
    yagyaDateText: 'यज्ञ तिथि:',
    sessionText: 'सत्र समय:',
  },

  en: {
    appName: 'Bharat Utkarsh Maha Yagya',
    tagline: 'Your Prosperity in the Prosperity of the Nation',
    eventDates: '16 to 25 November 2026',
    homeTab: 'Home',
    regTab: 'Yajman Registration',
    payTab: 'Secure Payment',
    mapTab: 'Venue & Map',
    databaseTab: 'Database',
    adminPortal: 'Admin Portal',
    lookupTab: 'Find Booking',
    testModeBadge: 'TEST MODE',
    testModeBanner: '🧪 Free TEST Mode Active: Instant mock bookings enabled for demo/testing without real UPI transaction.',

    step1: '1. Yajman Details',
    step2: '2. Select Kund & Session',
    step3: '3. Pay & Verify',
    step4: '4. Official Token & Pass',

    heroTitle: 'Maharishi Bharat Utkarsh Maha Yagya 2026',
    heroSubtitle: 'Offer oblations across 108 grand Hawan Kunds for national prosperity and personal wellness.',
    pricePerPerson: '₹1100 per person',
    totalKunds: '108 Hawan Kunds',
    availableKunds: 'Available Kunds',
    bookedKunds: 'Confirmed Kunds',
    reservedNotice: 'Kunds 1 to 9 are reserved for revered Saints & Vedic Acharyas.',
    registerNowBtn: 'Book Hawan Kund Now',
    findMyPassBtn: 'Find My Token / Entry Pass',
    sacredYagyaHeading: 'Sacred Guidelines & Vedic Etiquette',
    kundAllocationRulesTitle: 'Hawan Kund Allocation Principles',
    rule1: 'Kunds 1 to 9 are strictly reserved for revered Sants, Shankaracharyas, and Head Acharyas.',
    rule2: 'Kunds 10 to 108 are open for booking by the general public.',
    rule3: 'Only 1 couple/family per Kund. A second yajman will share only after all other empty kunds have 1 yajman.',

    personalInfoTitle: 'Primary Yajman Information',
    husbandName: 'Primary Yajman / Husband Name',
    husbandNamePlaceholder: 'e.g. Ram Prasad Sharma',
    wifeName: 'Co-Yajman / Wife Name',
    wifeNamePlaceholder: 'e.g. Mrs. Sita Sharma',
    mobileNumber: 'Mobile Number (10 digits)',
    mobilePlaceholder: '9876543210',
    email: 'Email Address (Optional)',
    emailPlaceholder: 'devotee@example.com',
    city: 'City / Town',
    cityPlaceholder: 'e.g. Noida / New Delhi',
    gotra: 'Gotra (Optional)',
    gotraPlaceholder: 'e.g. Kashyap / Bharadwaj',
    address: 'Residential Address',
    addressPlaceholder: 'e.g. Sector 110, Noida',
    participationType: 'Participation Category',
    personCount: 'Total Persons Offering Ahuti',
    sessionTimeSlot: 'Yagya Session (Time Slot)',
    selectDate: 'Select Maha Yagya Date',
    selectKund: 'Select Hawan Kund Number (10 to 108)',
    kundNumber: 'Hawan Kund Number',
    tokenNo: 'Unique Token Number',
    proceedToPayment: 'Temporarily Hold Kund & Proceed to Pay →',
    fillAllRequired: 'Please fill in all mandatory fields.',
    invalidMobile: 'Please enter a valid 10-digit mobile number.',

    kundTrackerTitle: '108 Hawan Kunds Live Status & Availability',
    legendAvailable: 'Open & Available',
    legendOccupied: 'Confirmed / Paid',
    legendPending: 'Temporary Hold (Pending Verification)',
    legendReserved: 'Reserved for Acharyas (1-9)',
    selectKundPrompt: 'Click on any available Kund from the grid above',
    kundCapacityFull: 'This Hawan Kund is completely booked for this date.',
    kundAlreadyBooked: 'This Kund is already held or reserved. Please choose another.',

    paymentTitle: 'Secure UPI Payment & Proof Verification',
    tempReservationNotice: 'Your selected Hawan Kund is temporarily reserved!',
    reservationTimerText: 'Reservation Hold Expires In:',
    reservationExpiredTitle: 'Temporary Reservation Expired!',
    reservationExpiredDesc: 'Your hold time elapsed; the Kund has been released for other devotees.',
    restartReservationBtn: 'Restart Booking',
    scanAndPay: 'Scan SBI Official UPI QR to Pay',
    upiId: 'Official UPI ID: maharishivedvigyan@sbi',
    copyUpiBtn: 'Copy UPI ID',
    upiCopied: 'Copied!',
    payableAmount: 'Total Payable Dakshina',
    enterUtr: 'Enter 12-digit Bank UPI Ref / UTR Number',
    utrPlaceholder: 'e.g. 428512345678',
    utrHelpText: 'Enter the 12-digit UTR from your PhonePe, Google Pay, Paytm, or BHIM receipt. Entering a random number will NOT approve payment; an admin verifies it with bank statements.',
    uploadScreenshotTitle: 'Upload Payment Screenshot Proof',
    uploadScreenshotHint: 'Select screenshot of PhonePe / GPay success screen (PNG, JPG, WebP - max 5MB)',
    screenshotUploaded: 'Screenshot selected successfully!',
    submitForVerificationBtn: 'Submit UTR & Screenshot for Verification →',
    verifyingText: 'Submitting...',
    pendingVerificationTitle: 'Payment Proof Submitted • Pending Admin Verification',
    pendingVerificationDesc: 'Your UTR and payment screenshot have been submitted. For safety and accounting, your booking will be confirmed once the ashram admin checks bank records.',
    pendingNoticeWhy: '⚠️ Note: Random or fake UTR numbers are rejected. As soon as admin marks your payment paid, your official QR pass will unlock.',
    checkStatusBtn: 'Refresh / Check Verification Status',
    counterPay: 'Cash Payment at Venue Counter Option',
    counterPayDesc: 'You can also pay cash in person at the venue counter on the day of Yagya.',
    testModeInstantApproveBtn: '🧪 Test Mode: Instant Mock Approve (Demo)',
    testModeNote: 'Test Mode is active: Test booking and ticket issuance without real payment.',

    statusPaid: 'Confirmed & Paid',
    statusPending: 'Admin Verification Pending',
    statusRejected: 'Payment Rejected',
    statusCounterPay: 'Pay at Counter',
    statusExpired: 'Hold Expired',
    statusTempHold: 'Temporary Hold',

    confirmedTitle: 'Congratulations! Your Booking is Confirmed',
    confirmedSubtitle: 'Welcome to Maharishi Bharat Utkarsh Maha Yagya 2026. Your official Entry Pass has been issued.',
    officialTokenIssued: 'Official QR Code & Token Issued',
    printReceipt: 'Print Entry Pass & Receipt',
    printAllSlips: 'Print All Slips',
    downloadPass: 'Download Pass',
    backToHome: 'Return to Home',
    verificationHashText: 'Digital Cryptographic Seal:',

    adminTitle: 'Yagya Control & Admin Portal',
    adminSubtitle: 'Shree Maharishi Vedvigyan Sansthan • Bharat Utkarsh Maha Yagya 2026',
    adminLoginTitle: 'Admin Secure Login',
    adminSetupTitle: 'First & Only Master Admin Account Setup',
    adminUsername: 'Admin Username',
    adminPassword: 'Password',
    adminConfirmPassword: 'Confirm Password',
    loginBtn: 'Log In',
    logoutBtn: 'Log Out',
    pendingQueueTab: 'Pending Queue',
    allBookingsTab: 'All Registrations',
    auditLogsTab: 'Audit Trail',
    settingsTab: 'Settings & Test Mode',
    approveBookingBtn: '✓ Approve (Mark Paid)',
    rejectBookingBtn: '✕ Reject',
    viewScreenshotBtn: 'View Screenshot',
    noScreenshot: 'No screenshot uploaded',
    rejectReasonPrompt: 'Enter reason for rejection (e.g. Invalid UTR, funds not received):',
    rejectionReasonPlaceholder: 'Reason for rejection...',
    confirmRejectBtn: 'Confirm Rejection',
    cancelBtn: 'Cancel',
    auditActionApproved: 'Booking Approved',
    auditActionRejected: 'Booking Rejected',
    reservationExpirySetting: 'Temporary Reservation Hold Duration (Minutes):',
    testModeToggle: 'Free TEST Mode (Sandbox):',
    saveSettingsBtn: 'Save Settings',
    exportExcel: 'Download Excel / CSV',
    exportBackup: 'Backup Data',
    importBackup: 'Import Backup',

    lookupTitle: 'Find Your Registration & Pass',
    lookupSubtitle: 'Enter your registered 10-digit mobile number or unique token ID.',
    lookupPlaceholder: 'e.g. 9876543210 or MUMY-26-K010-...',
    noReceiptFound: 'No registration found for the entered details. Please verify your mobile number.',
    receiptsFound: 'Registration(s) Found',

    venueTitle: 'Yagya Venue & Entry Gate',
    venueAddress: 'Ramlila Maidan, Maharishi Ashram, Maharishi Nagar, Sector 110, Noida 201304',
    gateNumber: 'Gate No. 5 - Main Yajman Welcome Gate',
    directions: 'Get Directions on Google Maps',
    slipHeading: 'Maharishi Bharat Utkarsh Maha Yagya 2026 — Official Entry Pass',
    authorizedSign: 'Authorized Admin Signature & Seal',
    yagyaDateText: 'Yagya Date:',
    sessionText: 'Session Time:',
  },

  sa: {
    appName: 'भारत उत्कर्ष महायज्ञः',
    tagline: 'राष्ट्रस्य समृद्धौ भवतां समृद्धिः',
    eventDates: '१६ तः २५ नवम्बर २०२६',
    homeTab: 'मुख्यपृष्ठम्',
    regTab: 'यजमानपञ्जीकरणम्',
    payTab: 'शुल्कसमर्पणम्',
    mapTab: 'यज्ञस्थानम्',
    databaseTab: 'दत्तनिधिः (Database)',
    adminPortal: 'प्रशासकपटलम्',
    lookupTab: 'पञ्जीकरणान्वेषणम्',
    testModeBadge: 'परीक्षणरीतिः (TEST)',
    testModeBanner: '🧪 निःशुल्कपरीक्षणरीतिः सक्रिया: वास्तविकशुल्कं विना परीक्षणार्थम् अनुमतिः वर्तते।',

    step1: '१. यजमानविवरणम्',
    step2: '२. कुण्डसत्रचयनम्',
    step3: '३. समर्पणं प्रमाणनञ्च',
    step4: '४. अधिकृतसङ्केतः पत्रञ्च',

    heroTitle: 'महर्षि भारत उत्कर्ष महायज्ञः २०२६',
    heroSubtitle: '१०८ दिव्यहवनकुण्डेषु राष्ट्रकल्याणाय स्वाहाकारं कुर्वन्तु।',
    pricePerPerson: '₹११०० प्रति यजमानः',
    totalKunds: '१०८ हवनकुण्डानि',
    availableKunds: 'उपलब्धकुण्डानि',
    bookedKunds: 'आरक्षितकुण्डानि',
    reservedNotice: 'कुण्ड संख्या १ तः ९ पूज्यसन्तेभ्यः आचार्येभ्यश्च आरक्षिताः।',
    registerNowBtn: 'हवनकुण्डं पञ्जीकुरुत',
    findMyPassBtn: 'प्रवेशपत्रम् अन्विषतु',
    sacredYagyaHeading: 'पवित्रयज्ञव्यवस्था नियमाश्च',
    kundAllocationRulesTitle: 'हवनकुण्डआवंटननियमाः',
    rule1: 'कुण्ड संख्या १ तः ९ पूज्याचार्येभ्यः आरक्षिताः सन्ति।',
    rule2: 'कुण्ड संख्या १० तः १०८ सर्वसाधारणेभ्यः उपलब्धाः सन्ति।',
    rule3: 'प्रति कुण्डम् एकं दम्पती/परिवारः एव तिष्ठेत्।',

    personalInfoTitle: 'मुख्ययजमानविवरणम्',
    husbandName: 'मुख्ययजमानस्य / पत्युः नाम',
    husbandNamePlaceholder: 'उदा. रामप्रसादशर्मा',
    wifeName: 'सहयजमानायाः / पत्न्याः नाम',
    wifeNamePlaceholder: 'उदा. सीताशर्मा',
    mobileNumber: 'दूरभाषसङ्ख्या (१० अङ्काः)',
    mobilePlaceholder: '९८७६५४३२१०',
    email: 'विद्युत्पत्रम् (वैकल्पिकम्)',
    emailPlaceholder: 'devotee@example.com',
    city: 'नगरम्',
    cityPlaceholder: 'उदा. नोएडा',
    gotra: 'गोत्रम्',
    gotraPlaceholder: 'उदा. कश्यप / भारद्वाज',
    address: 'निवासस्थानम्',
    addressPlaceholder: 'उदा. सेक्टर ११०, नोएडा',
    participationType: 'सहभागिताप्रकारः',
    personCount: 'आहुतिकर्तॄणां सङ्ख्या',
    sessionTimeSlot: 'यज्ञसत्रसमयः',
    selectDate: 'यज्ञतिथिं चिनोतु',
    selectKund: 'हवनकुण्डसङ्ख्यां चिनोतु (१० तः १०८)',
    kundNumber: 'हवनकुण्डसङ्ख्या',
    tokenNo: 'विशिष्टसङ्केताङ्कः',
    proceedToPayment: 'अस्थायिरूपेण आरक्ष्य शुल्कं समर्पयतु →',
    fillAllRequired: 'कृपया सर्वाणि आवश्यकाङ्गानि पूरयतु।',
    invalidMobile: 'कृपया १० अङ्कानां शुद्धदूरभाषसङ्ख्यां लिखतु।',

    kundTrackerTitle: '१०८ हवनकुण्डानां प्रत्यक्षस्थितिः',
    legendAvailable: 'रिक्तम् उपलब्धञ्च',
    legendOccupied: 'प्रमाणीकृतं सम्पूजितम्',
    legendPending: 'अस्थायिरोधः (प्रमाणीकरणं प्रतीक्षते)',
    legendReserved: 'पूज्यसन्तेभ्यः आरक्षितम् (१-९)',
    selectKundPrompt: 'कृपया उपरितनजालात् उपलब्धं कुण्डं चिनोतु',
    kundCapacityFull: 'अस्मिन् दिने एतत् कुण्डं पूर्णम् अस्ति।',
    kundAlreadyBooked: 'एतत् कुण्डं पूर्वमेव आरक्षितम् अस्ति।',

    paymentTitle: 'सुरक्षितशुल्कसमर्पणं प्रमाणनञ्च',
    tempReservationNotice: 'भवता चयनितं कुण्डम् अल्पसमयार्थम् आरक्षितम्!',
    reservationTimerText: 'आरक्षणसमाप्तिसमयः:',
    reservationExpiredTitle: 'अस्थाय्यारक्षणं समाप्तम्!',
    reservationExpiredDesc: 'समयसीमा समाप्ता, कुण्डम् इतरेभ्यः मुक्तम् अस्ति।',
    restartReservationBtn: 'पुनः आरभताम्',
    scanAndPay: 'SBI आधिकारिक UPI QR स्कैन् कृत्वा समर्पयतु',
    upiId: 'आधिकारिक UPI ID: maharishivedvigyan@sbi',
    copyUpiBtn: 'UPI ID प्रतिलिखतु',
    upiCopied: 'प्रतिलिखितम्!',
    payableAmount: 'देयदक्षिणाराशिः',
    enterUtr: '१२ अङ्कीयं UPI Ref / UTR सङ्केतं लिखतु',
    utrPlaceholder: 'उदा. ४२८५१२३४५६७८',
    utrHelpText: 'स्वकीय PhonePe / GPay रसीदात् १२ अङ्कीयं UTR सङ्ख्यां लिखतु। यादृच्छिकाङ्केन स्वीकृतिः न भविष्यति, व्यवस्थापकाः प्रमाणीकरिष्यन्ति।',
    uploadScreenshotTitle: 'शुल्कसमर्पणचित्रं (Screenshot) आरोपयतु',
    uploadScreenshotHint: 'PhonePe / GPay सफलचित्रं चिनोतु (अधिकतमं 5MB)',
    screenshotUploaded: 'चित्रं सफलीकृतम्!',
    submitForVerificationBtn: 'प्रमाणीकरणार्थं UTR चित्रञ्च प्रेषयतु →',
    verifyingText: 'समर्प्यते...',
    pendingVerificationTitle: 'प्रमाणपत्रं प्रेषितम् • व्यवस्थापकप्रमाणीकरणं प्रतीक्षते',
    pendingVerificationDesc: 'भवतः UTR चित्रञ्च प्राप्तम्। वित्तकोषेण सह योजनं कृत्वा व्यवस्थापकेन स्वीकृतिः दीयते।',
    pendingNoticeWhy: '⚠️ अवधेयम्: अमान्य-UTR सङ्ख्या निरस्ता भविष्यति। अनुमत्यानन्तरं QR-प्रवेशपत्रं लप्स्यते।',
    checkStatusBtn: 'स्थितिं पश्यतु (Refresh)',
    counterPay: 'मण्डपे नकदसमर्पणम्',
    counterPayDesc: 'यज्ञदिने मण्डपे अपि नकदसमर्पणं कर्तुं शक्नुवन्ति।',
    testModeInstantApproveBtn: '🧪 परीक्षणरीतिः: झटिति स्वीकृतिः (Demo)',
    testModeNote: 'परीक्षणरीतिः सक्रिया अस्ति।',

    statusPaid: 'प्रमाणीकृतं स्वीकृतञ्च (Paid)',
    statusPending: 'प्रमाणीकरणं प्रतीक्षते (Pending)',
    statusRejected: 'निरस्तम् (Rejected)',
    statusCounterPay: 'मण्डपे देयम् (Counter Pay)',
    statusExpired: 'समाप्तम् (Expired)',
    statusTempHold: 'अस्थायिरोधः (Hold)',

    confirmedTitle: 'अभिनन्दनानि! भवतः पञ्जीकरणं स्वीकृतम्',
    confirmedSubtitle: 'महर्षि भारत उत्कर्ष महायज्ञे भवतां स्वागतम्। आधिकारिकप्रवेशपत्रं दत्तम्।',
    officialTokenIssued: 'आधिकारिक QR कोडः सङ्केताङ्कश्च निर्गतः',
    printReceipt: 'प्रवेशपत्रं मुद्रयतु',
    printAllSlips: 'सर्वपत्राणि मुद्रयतु',
    downloadPass: 'पत्रम् अवतरतु',
    backToHome: 'मुख्यपृष्ठं गच्छतु',
    verificationHashText: 'अङ्कीयप्रमाणीकरणमुद्रा:',

    adminTitle: 'यज्ञनियन्त्रणं प्रशासकपटलञ्च',
    adminSubtitle: 'श्री महर्षि वेदविज्ञान संस्थानम् • भारत उत्कर्ष महायज्ञः २०२६',
    adminLoginTitle: 'प्रशासकप्रवेशः',
    adminSetupTitle: 'एकमात्रप्रशासकखातासृजनम्',
    adminUsername: 'प्रशासकनाम',
    adminPassword: 'गुप्तपदम्',
    adminConfirmPassword: 'गुप्तपदपुष्टिः',
    loginBtn: 'प्रविशतु',
    logoutBtn: 'निर्गच्छतु',
    pendingQueueTab: 'प्रतीक्षापङ्क्तिः (Pending)',
    allBookingsTab: 'सर्वाणि पञ्जीकरणानि',
    auditLogsTab: 'ऑडिट-लॉग (Audit)',
    settingsTab: 'व्यवस्थापरीक्षणरीतिश्च',
    approveBookingBtn: '✓ स्वीकुरुतु (Approve)',
    rejectBookingBtn: '✕ निरस्यतु (Reject)',
    viewScreenshotBtn: 'चित्रं पश्यतु',
    noScreenshot: 'चित्रं नास्ति',
    rejectReasonPrompt: 'निरसनस्य कारणं लिखतु:',
    rejectionReasonPlaceholder: 'निरसनकारणम्...',
    confirmRejectBtn: 'निरसनं पुष्टीकुरुतु',
    cancelBtn: 'स्थगयतु',
    auditActionApproved: 'स्वीकृतम्',
    auditActionRejected: 'निरस्तम्',
    reservationExpirySetting: 'अस्थायिरोधसमयः (निमेषेषु):',
    testModeToggle: 'निःशुल्कपरीक्षणरीतिः:',
    saveSettingsBtn: 'रक्षतु',
    exportExcel: 'Excel पत्रकम्',
    exportBackup: 'दत्तं संरक्षतु',
    importBackup: 'आयातं कुरुतु',

    lookupTitle: 'पञ्जीकरणान्वेषणम्',
    lookupSubtitle: 'स्वकीयां १० अङ्कीयां दूरभाषसङ्ख्यां सङ्केताङ्कं वा लिखतु।',
    lookupPlaceholder: 'उदा. ९८७६५४३२१० अथवा MUMY-26-...',
    noReceiptFound: 'किमपि पत्रं न प्राप्तम्।',
    receiptsFound: 'पत्राणि प्राप्तानि',

    venueTitle: 'यज्ञस्थानम् एवं प्रवेशद्वारम्',
    venueAddress: 'रामलीला मैदानम्, महर्षि आश्रमः, महर्षि नगरम्, सेक्टर ११०, नोएडा',
    gateNumber: 'द्वार संख्या ५ - मुख्य यजमान प्रवेशद्वारम्',
    directions: 'मानचित्रे पश्यतु',
    slipHeading: 'महर्षि भारत उत्कर्ष महायज्ञः २०२६ — आधिकारिक यजमान प्रवेशपत्रम्',
    authorizedSign: 'अधिकृतप्रशासकस्य हस्ताक्षरं मुद्रा च',
    yagyaDateText: 'यज्ञतिथिः:',
    sessionText: 'सत्रसमयः:',
  },

  gu: {
    appName: 'ભારત ઉત્કર્ષ મહાયજ્ઞ',
    tagline: 'રાષ્ટ્રની સમૃદ્ધિમાં તમારી સમૃદ્ધિ',
    eventDates: '16 થી 25 નવેમ્બર 2026',
    homeTab: 'મુખ્ય પૃષ્ઠ',
    regTab: 'યજમાન નોંધણી',
    payTab: 'સુરક્ષિત ચુકવણી',
    mapTab: 'સ્થળ અને નકશો',
    databaseTab: 'ડેટાબેઝ',
    adminPortal: 'વહીવટકર્તા પોર્ટલ',
    lookupTab: 'નોંધણી શોધો',
    testModeBadge: 'ટેસ્ટ મોડ (TEST)',
    testModeBanner: '🧪 મફત ટેસ્ટ મોડ સક્રિય: વાસ્તવિક UPI ચુકવણી વિના ડેમો બુકિંગ ચકાસી શકાય છે.',

    step1: '૧. યજમાન વિગતો',
    step2: '૨. કુંડ અને સત્ર પસંદગી',
    step3: '૩. ચુકવણી અને ચકાસણી',
    step4: '૪. સત્તાવાર ટોકન અને પાસ',

    heroTitle: 'મહર્ષિ ભારત ઉત્કર્ષ મહાયજ્ઞ ૨૦૨૬',
    heroSubtitle: '૧૦૮ ભવ્ય હવન કુંડોમાં રાષ્ટ્ર કલ્યાણ અને સુખ-સમૃદ્ધિ માટે આહુતિ આપો.',
    pricePerPerson: '₹1100 પ્રતિ યજમાન',
    totalKunds: '૧૦૮ હવન કુંડ',
    availableKunds: 'ઉપલબ્ધ કુંડ',
    bookedKunds: 'આરક્ષિત કુંડ',
    reservedNotice: 'કુંડ ૧ થી ૯ પૂજ્ય સંતો અને આચાર્યો માટે અનામત છે.',
    registerNowBtn: 'હવન કુંડ બુક કરો',
    findMyPassBtn: 'મારો પાસ / ટોકન શોધો',
    sacredYagyaHeading: 'પવિત્ર યજ્ઞ વ્યવસ્થા અને નિયમો',
    kundAllocationRulesTitle: 'હવન કુંડ ફાળવણીના નિયમો',
    rule1: 'કુંડ ૧ થી ૯ પૂજ્ય સંતો અને શંકરાચાર્યો માટે અનામત છે.',
    rule2: 'કુંડ ૧૦ થી ૧૦૮ સામાન્ય યજમાનો માટે ઉપલબ્ધ છે.',
    rule3: 'દરેક કુંડ પર માત્ર ૧ દંપતી/પરિવાર રહેશે. જ્યાં સુધી બધા કુંડ ૧-૧ ન ભરાય ત્યાં સુધી શેરિંગ થશે નહીં.',

    personalInfoTitle: 'મુખ્ય યજમાનની અંગત વિગતો',
    husbandName: 'મુખ્ય યજમાન / પતિનું નામ',
    husbandNamePlaceholder: 'દા.ત. રામપ્રસાદ શર્મા',
    wifeName: 'સહ-યજમાન / પત્નીનું નામ',
    wifeNamePlaceholder: 'દા.ત. શ્રીમતી સીતા શર્મા',
    mobileNumber: 'મોબાઇલ નંબર (10 અંક)',
    mobilePlaceholder: '9876543210',
    email: 'ઇમેઇલ સરનામું (વૈકલ્પિક)',
    emailPlaceholder: 'devotee@example.com',
    city: 'શહેર / ગામ',
    cityPlaceholder: 'દા.ત. નોઇડા / અમદાવાદ',
    gotra: 'ગોત્ર (વૈકલ્પિક)',
    gotraPlaceholder: 'દા.ત. કશ્યપ / ભારદ્વાજ',
    address: 'સરનામું',
    addressPlaceholder: 'દા.ત. સેક્ટર 110, નોઇડા',
    participationType: 'સહભાગિતા પ્રકાર',
    personCount: 'કુલ વ્યક્તિઓ',
    sessionTimeSlot: 'યજ્ઞ સત્ર (સમય)',
    selectDate: 'મહાયજ્ઞની તારીખ પસંદ કરો',
    selectKund: 'હવન કુંડ નંબર પસંદ કરો (10 થી 108)',
    kundNumber: 'હવન કુંડ નંબર',
    tokenNo: 'વિશિષ્ટ ટોકન નંબર',
    proceedToPayment: 'કુંડ કામચલાઉ આરક્ષિત કરો અને ચુકવણી કરો →',
    fillAllRequired: 'કૃપા કરીને બધી વિગતો ભરો.',
    invalidMobile: 'કૃપા કરીને 10 અંકનો માન્ય મોબાઇલ નંબર દાખલ કરો.',

    kundTrackerTitle: '૧૦૮ હવન કુંડ લાઇવ સ્થિતિ અને ઉપલબ્ધતા',
    legendAvailable: 'ખાલી અને ઉપલબ્ધ',
    legendOccupied: 'પુષ્ટિ થયેલ / બુક',
    legendPending: 'કામચલાઉ રોક (ચકાસણી બાકી)',
    legendReserved: 'સંતો માટે અનામત (૧-૯)',
    selectKundPrompt: 'ઉપરના ગ્રીડમાંથી ઉપલબ્ધ કુંડ પર ક્લિક કરો',
    kundCapacityFull: 'આ કુંડ આ તારીખે પૂર્ણ થઈ ગયો છે.',
    kundAlreadyBooked: 'આ કુંડ પહેલેથી જ બુક અથવા આરક્ષિત છે.',

    paymentTitle: 'સુરક્ષિત UPI ચુકવણી અને ચકાસણી પુરાવો',
    tempReservationNotice: 'તમારો પસંદ કરેલ કુંડ કામચલાઉ આરક્ષિત કરવામાં આવ્યો છે!',
    reservationTimerText: 'આરક્ષણ સમાપ્તિ સમય:',
    reservationExpiredTitle: 'કામચલાઉ આરક્ષણ સમાપ્ત થયું!',
    reservationExpiredDesc: 'સમયસીમા સમાપ્ત થવાને કારણે કુંડ અન્ય યજમાનો માટે મુક્ત થયો છે.',
    restartReservationBtn: 'ફરીથી બુકિંગ શરૂ કરો',
    scanAndPay: 'SBI સત્તાવાર UPI QR સ્કેન કરી ચુકવણી કરો',
    upiId: 'સત્તાવાર UPI ID: maharishivedvigyan@sbi',
    copyUpiBtn: 'UPI ID કોપી કરો',
    upiCopied: 'કોપી થયું!',
    payableAmount: 'કુલ ચૂકવવાપાત્ર રકમ',
    enterUtr: '12 અંકનો બેંક UPI Ref / UTR નંબર દાખલ કરો',
    utrPlaceholder: 'દા.ત. 428512345678',
    utrHelpText: 'PhonePe / GPay / Paytm રસીદમાંથી 12 અંકનો UTR દાખલ કરો. કોઈપણ ખોટો 12 અંક દાખલ કરવાથી ચુકવણી સ્વીકારવામાં આવશે નહીં; આશ્રમ વહીવટકર્તા બેંક સાથે ચકાસશે.',
    uploadScreenshotTitle: 'ચુકવણીનો સ્ક્રીનશોટ પુરાવો અપલોડ કરો',
    uploadScreenshotHint: 'સફળતા સ્ક્રીનનો સ્ક્રીનશોટ પસંદ કરો (મહત્તમ 5MB)',
    screenshotUploaded: 'સ્ક્રીનશોટ સફળતાપૂર્વક પસંદ થયો!',
    submitForVerificationBtn: 'ચકાસણી માટે UTR અને સ્ક્રીનશોટ જમા કરો →',
    verifyingText: 'જમા થઈ રહ્યું છે...',
    pendingVerificationTitle: 'ચુકવણી પુરાવો જમા થયો • ચકાસણી બાકી (Pending)',
    pendingVerificationDesc: 'તમારો UTR અને સ્ક્રીનશોટ મળ્યો છે. વહીવટકર્તા દ્વારા બેંક સ્ટેટમેન્ટ ચકાસ્યા પછી જ બુકિંગ કાયમી મંજૂર થશે.',
    pendingNoticeWhy: '⚠️ નોંધ: ખોટો UTR દાખલ કરવાથી બુકિંગ રદ થશે. મંજૂરી મળતાં જ તમારો QR પાસ સક્રિય થશે.',
    checkStatusBtn: 'સ્થિતિ તપાસો (Refresh)',
    counterPay: 'યજ્ઞ સ્થળે રોકડ ચુકવણી વિકલ્પ',
    counterPayDesc: 'તમે યજ્ઞના દિવસે સ્થળ પર કાઉન્ટર પર પણ રોકડ આપી શકો છો.',
    testModeInstantApproveBtn: '🧪 ટેસ્ટ મોડ: ત્વરિત મંજૂરી (Demo)',
    testModeNote: 'ટેસ્ટ મોડ સક્રિય છે.',

    statusPaid: 'ચકાસાયેલ અને મંજૂર (Paid)',
    statusPending: 'વહીવટકર્તા ચકાસણી બાકી (Pending)',
    statusRejected: 'અસ્વીકૃત (Rejected)',
    statusCounterPay: 'કાઉન્ટર પર ચૂકવવાપાત્ર',
    statusExpired: 'મુદત પૂરી થઈ (Expired)',
    statusTempHold: 'કામચલાઉ રોક (Hold)',

    confirmedTitle: 'અભિનંદન! તમારી બુકિંગ કાયમી પુષ્ટિ થઈ ગઈ છે',
    confirmedSubtitle: 'મહર્ષિ ભારત ઉત્કર્ષ મહાયજ્ઞ ૨૦૨૬ માં સ્વાગત છે. તમારો સત્તાવાર પ્રવેશ પાસ જારી કરવામાં આવ્યો છે.',
    officialTokenIssued: 'સત્તાવાર QR કોડ અને ટોકન જારી',
    printReceipt: 'પ્રવેશ પત્ર પ્રિન્ટ કરો',
    printAllSlips: 'બધી રસીદો પ્રિન્ટ કરો',
    downloadPass: 'પાસ ડાઉનલોડ કરો',
    backToHome: 'મુખ્ય પૃષ્ઠ પર પાછા જાઓ',
    verificationHashText: 'ડિજિટલ ક્રિપ્ટોગ્રાફિક સીલ:',

    adminTitle: 'યજ્ઞ નિયંત્રણ અને વહીવટકર્તા પોર્ટલ',
    adminSubtitle: 'શ્રી મહર્ષિ વેદવિજ્ઞાન સંસ્થાન • ભારત ઉત્કર્ષ મહાયજ્ઞ ૨૦૨૬',
    adminLoginTitle: 'વહીવટકર્તા સુરક્ષિત લૉગિન',
    adminSetupTitle: 'પ્રથમ અને એકમાત્ર વહીવટકર્તા ખાતું સેટઅપ',
    adminUsername: 'વહીવટકર્તા યુઝરનેમ',
    adminPassword: 'પાસવર્ડ',
    adminConfirmPassword: 'પાસવર્ડની પુષ્ટિ કરો',
    loginBtn: 'લૉગિન કરો',
    logoutBtn: 'લૉગઆઉટ',
    pendingQueueTab: 'ચકાસણી કતાર (Pending)',
    allBookingsTab: 'બધી બુકિંગ્સ',
    auditLogsTab: 'ઓડિટ લૉગ (Audit Trail)',
    settingsTab: 'સેટિંગ્સ અને ટેસ્ટ મોડ',
    approveBookingBtn: '✓ મંજૂર કરો (Mark Paid)',
    rejectBookingBtn: '✕ અસ્વીકાર કરો (Reject)',
    viewScreenshotBtn: 'સ્ક્રીનશોટ જુઓ',
    noScreenshot: 'કોઈ સ્ક્રીનશોટ નથી',
    rejectReasonPrompt: 'અસ્વીકાર કરવાનું કારણ લખો:',
    rejectionReasonPlaceholder: 'અસ્વીકારનું કારણ...',
    confirmRejectBtn: 'અસ્વીકારની પુષ્ટિ કરો',
    cancelBtn: 'રદ કરો',
    auditActionApproved: 'બુકિંગ મંજૂર કરવામાં આવી',
    auditActionRejected: 'બુકિંગ અસ્વીકાર કરવામાં આવી',
    reservationExpirySetting: 'કામચલાઉ આરક્ષણ સમય મર્યાદા (મિનિટમાં):',
    testModeToggle: 'મફત ટેસ્ટ મોડ (Free Test Mode):',
    saveSettingsBtn: 'સેટિંગ્સ સાચવો',
    exportExcel: 'Excel / CSV ડાઉનલોડ',
    exportBackup: 'ડેટા બેકઅપ',
    importBackup: 'બેકઅપ આયાત કરો',

    lookupTitle: 'તમારી નોંધણી અને ટોકન શોધો',
    lookupSubtitle: 'તમારો 10 અંકનો રજિસ્ટર્ડ મોબાઇલ નંબર અથવા ટોકન નંબર દાખલ કરો.',
    lookupPlaceholder: 'દા.ત. 9876543210 અથવા MUMY-26-...',
    noReceiptFound: 'દાખલ કરેલી વિગતો માટે કોઈ રસીદ મળી નથી.',
    receiptsFound: 'યજમાન રસીદ મળી',

    venueTitle: 'યજ્ઞ સ્થળ અને પ્રવેશ દ્વાર',
    venueAddress: 'રામલીલા મેદાન, મહર્ષિ આશ્રમ, મહર્ષિ નગર, સેક્ટર-110, નોઇડા 201304',
    gateNumber: 'ગેટ નંબર 5 (Gate No. 5) - મુખ્ય યજમાન પ્રવેશ દ્વાર',
    directions: 'ગૂગલ મેપ્સ પર દિશા-નિર્દેશ મેળવો',
    slipHeading: 'મહર્ષિ ભારત ઉત્કર્ષ મહાયજ્ઞ ૨૦૨૬ — સત્તાવાર પ્રવેશ પત્ર',
    authorizedSign: 'અધિકૃત વહીવટકર્તા સહી અને સિક્કો',
    yagyaDateText: 'યજ્ઞ તારીખ:',
    sessionText: 'સત્ર સમય:',
  },
};
