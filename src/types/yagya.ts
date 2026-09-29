export type PaymentStatus = 'pending' | 'paid' | 'rejected' | 'counter_pay' | 'expired' | 'temp_hold';

export interface DevoteeUser {
  id: string;
  mobile: string; // 10 digits unique identifier
  fullName: string;
  email?: string;
  city?: string;
  gotra?: string;
  createdAt: string;
}

export interface DevoteeAuthResponse {
  success: boolean;
  token: string;
  user: DevoteeUser;
  message?: string;
}

export interface UserAccount extends DevoteeUser {}

export interface Registration {
  id: string;
  token: string;
  userId?: string; // Linked devotee account ID
  fullName?: string; // पूरा नाम (उदा: राम प्रसाद शर्मा)
  husbandName: string; // पति / मुख्य यजमान
  wifeName?: string; // पत्नी / सह-यजमान
  mobile: string; // 10 अंकों का मोबाइल नंबर
  email?: string; // ईमेल (वैकल्पिक)
  city?: string; // शहर / स्थान (उदा: नोएडा)
  kundNumber: number; // कुंड संख्या (1 to 108)
  date: string; // महायज्ञ तिथि (YYYY-MM-DD)
  timeSlot?: string; // प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)
  participationType?: string; // दंपति, एकल, परिवार, समूह
  personCount: number; // संख्या
  amount: number; // ₹1100 per person
  paymentStatus: PaymentStatus;
  utrNumber?: string; // 12-digit UTR/UPI Ref
  paymentProofUrl?: string; // Screenshot proof (data URL or storage URL)
  verificationHash?: string;
  paymentDate?: string;
  expiresAt?: string; // Expiry timestamp for temporary reservation hold
  verifiedBy?: string; // Admin username who approved
  verifiedAt?: string; // Timestamp of admin approval
  rejectionReason?: string; // Reason if rejected
  isTestMode?: boolean; // If booked in free test mode
  address?: string; // पता
  gotra?: string; // गोत्र
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminUsername: string;
  action: 'APPROVED' | 'REJECTED' | 'TEMP_HOLD' | 'DELETED' | 'SETTINGS_CHANGED' | 'STATUS_RESET';
  bookingId?: string;
  token?: string;
  customerName?: string;
  kundNumber?: number;
  amount?: number;
  utrNumber?: string;
  reason?: string;
  details?: string;
  timestamp: string;
}

export interface SystemSettings {
  reservationExpiryMinutes: number; // default 15
  testModeEnabled: boolean; // default false
  upiId: string; // default 'maharishivedvigyan@sbi'
  pricePerPerson: number; // default 1100
  updatedAt?: string;
}

export interface HawanKundStatus {
  kundNumber: number;
  formattedNumber: string; // '001', '002', ..., '108'
  isReserved: boolean; // Kunds 1-9 reserved for Pujya Sants/Acharyas
  capacity: number; // 2 slots or 1 couple/family
  bookedCount: number; // 0, 1, or 2
  isTempHeld?: boolean; // If actively in pending verification hold
  tempHoldExpiresAt?: string;
  occupants: {
    token: string;
    primaryName: string;
    isCouple: boolean;
    status: PaymentStatus;
  }[];
}

export const TOTAL_KUNDS = 108;
export const RESERVED_KUNDS_COUNT = 9; // 1 to 9 reserved for Pujya Sants/Acharyas
export const DEFAULT_PRICE_PER_PERSON = 1100;
export const DEFAULT_EXPIRY_MINUTES = 15;

export const YAGYA_LOCATION_MAP_URL = 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA';

export const YAGYA_DATES = [
  { date: '2026-11-16', label: '16 नवम्बर 2026 (शुभारंभ / Day 1)' },
  { date: '2026-11-17', label: '17 नवम्बर 2026 (Day 2)' },
  { date: '2026-11-18', label: '18 नवम्बर 2026 (Day 3)' },
  { date: '2026-11-19', label: '19 नवम्बर 2026 (Day 4)' },
  { date: '2026-11-20', label: '20 नवम्बर 2026 (Day 5)' },
  { date: '2026-11-21', label: '21 नवम्बर 2026 (Day 6)' },
  { date: '2026-11-22', label: '22 नवम्बर 2026 (Day 7)' },
  { date: '2026-11-23', label: '23 नवम्बर 2026 (Day 8)' },
  { date: '2026-11-24', label: '24 नवम्बर 2026 (Day 9)' },
  { date: '2026-11-25', label: '25 नवम्बर 2026 (पूर्णाहुति / Day 10)' },
];

export const TIME_SLOTS = [
  'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
  'सायं 03:00 PM से 06:00 PM (द्वितीय सत्र)',
];

export const PARTICIPATION_TYPES = [
  { label: 'दंपति (पति और पत्नी - 2 व्यक्ति)', defaultPersons: 2 },
  { label: 'एकल यजमान (1 व्यक्ति)', defaultPersons: 1 },
  { label: 'परिवार (3-6 व्यक्ति)', defaultPersons: 4 },
  { label: 'समूह / संस्था (7-10 व्यक्ति)', defaultPersons: 8 },
];

export const DEFAULT_ADDRESS = 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304';
