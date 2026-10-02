export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'rejected'
  | 'counter_pay'
  | 'expired'
  | 'temp_hold';

export interface DevoteeUser {
  id: string;
  mobile: string; // 10 digits
  fullName: string;
  password?: string;
  email?: string;
  city?: string;
  gotra?: string;
  createdAt?: string;
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
  userId?: string;
  fullName?: string;
  husbandName: string;
  wifeName?: string;
  mobile: string;
  email?: string;
  city?: string;
  gotra?: string;
  kundNumber: number;
  kundNumbers?: number[];
  kundCount?: number;
  date: string;
  timeSlot?: string;
  participationType?: string;
  personCount: number;
  amount: number;
  paymentStatus: PaymentStatus;
  utrNumber?: string;
  paymentProofUrl?: string;
  verificationHash?: string;
  paymentDate?: string;
  expiresAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  isTestMode?: boolean;
  address?: string;
  createdAt: string;
}

export const getPaymentStatusDisplay = (status: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return {
        key: 'paid',
        labelEn: 'Payment Verified',
        labelHi: 'भुगतान सत्यापित',
        fullLabel: 'Payment Verified (भुगतान सत्यापित)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        textClass: 'text-emerald-700',
        icon: '✓',
        isConfirmed: true,
      };
    case 'rejected':
      return {
        key: 'rejected',
        labelEn: 'Payment Rejected',
        labelHi: 'भुगतान अस्वीकृत',
        fullLabel: 'Payment Rejected (भुगतान अस्वीकृत)',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        textClass: 'text-rose-700',
        icon: '✕',
        isConfirmed: false,
      };
    case 'pending':
      return {
        key: 'pending',
        labelEn: 'Payment Pending Verification',
        labelHi: 'भुगतान सत्यापन लंबित',
        fullLabel: 'Payment Pending Verification (भुगतान सत्यापन लंबित)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        textClass: 'text-amber-800',
        icon: '⏳',
        isConfirmed: false,
      };
    case 'temp_hold':
      return {
        key: 'temp_hold',
        labelEn: 'Temporary Hold',
        labelHi: 'अस्थायी आरक्षण',
        fullLabel: 'Temporary Hold (अस्थायी आरक्षण)',
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
        textClass: 'text-orange-800',
        icon: '⏱️',
        isConfirmed: false,
      };
    case 'counter_pay':
      return {
        key: 'counter_pay',
        labelEn: 'Counter Payment',
        labelHi: 'काउंटर भुगतान',
        fullLabel: 'Counter Payment (काउंटर भुगतान)',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        textClass: 'text-blue-800',
        icon: '🏛️',
        isConfirmed: true,
      };
    case 'expired':
    default:
      return {
        key: 'expired',
        labelEn: 'Expired',
        labelHi: 'समय समाप्त',
        fullLabel: 'Expired (समय समाप्त)',
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
        textClass: 'text-stone-600',
        icon: '⌛',
        isConfirmed: false,
      };
  }
};

export interface AuditLog {
  id: string;
  admin?: string;
  adminUsername?: string;
  action: 'APPROVED' | 'REJECTED' | 'TEMP_HOLD' | 'DELETED' | 'SETTINGS_CHANGED' | 'STATUS_RESET' | 'COUNTER_PAY' | 'SUBMIT_PROOF' | string;
  bookingId?: string;
  token?: string;
  customerName?: string;
  kund?: number;
  kundNumber?: number;
  amount?: number;
  utrNumber?: string;
  reason?: string;
  details?: string;
  timestamp: string;
}

export interface SystemSettings {
  expiryMinutes?: number;
  reservationExpiryMinutes?: number;
  testModeEnabled: boolean;
  upiId: string;
  pricePerPerson: number;
  updatedAt?: string;
}

export interface KundItem {
  kundNumber: number;
  formattedNumber: string;
  isReserved: boolean;
  bookedCount: number;
  occupants: Registration[];
}

export interface KundSummary {
  list: KundItem[];
  totalAvailable: number;
  totalPartial: number;
  totalFull: number;
  totalReserved: number;
}

export interface HawanKundStatus {
  kundNumber: number;
  formattedNumber: string;
  isReserved: boolean;
  capacity: number;
  bookedCount: number;
  isTempHeld?: boolean;
  tempHoldExpiresAt?: string;
  occupants: any[];
}

export interface YagyaDateOption {
  date: string;
  label: string;
}

export interface ParticipationTypeOption {
  label: string;
  defaultPersons: number;
}

export * from '../constants/yagya';
export const DEFAULT_ADDRESS = 'रामलीला मैदान, महर्षि आश्रम, गेट सं. 6, महर्षि नगर, सेक्टर-110, नोएडा 201304';
export const DEFAULT_EXPIRY_MINUTES = 5;

export type KundStatusType = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'RESERVED';

export interface KundLockInfo {
  lockId: string;
  kundId: number;
  kundNumber: number;
  bookingDate: string;
  mobileNumber: string;
  userName?: string;
  amount?: number;
  lockedAt: string;
  lockExpiresAt: string;
  status: 'LOCKED' | 'EXPIRED' | 'RELEASED' | 'CONVERTED';
  remainingSeconds: number;
}

export interface KundLiveItem {
  kundNumber: number;
  formattedNumber: string;
  status: KundStatusType;
  isSantReserved: boolean;
  isLockedBySelf?: boolean;
  lockInfo?: {
    lockId: string;
    mobileMasked: string;
    expiresAt: string;
    remainingSeconds: number;
  };
  bookingInfo?: {
    token: string;
    nameMasked: string;
    paymentStatus: PaymentStatus;
  };
}
