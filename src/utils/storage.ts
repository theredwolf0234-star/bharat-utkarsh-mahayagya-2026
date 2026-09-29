import { Registration, YAGYA_DATES, DEFAULT_ADDRESS } from '../types/yagya';

const STORAGE_KEY = 'maharishi_yagya_registrations_2026_v1';

// Seed initial realistic registrations for the Yagya days so tracker reflects booked status
const SEED_DATA: Registration[] = [
  {
    id: 'reg-seed-1',
    token: 'MUMY-26-K10-4821',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9876543210',
    kundNumber: 10,
    date: '2026-11-16',
    address: 'नोएडा, उत्तर प्रदेश',
    gotra: 'भारद्वाज',
    personCount: 1,
    amount: 1100,
    paymentStatus: 'paid',
    utrNumber: '427210842918',
    paymentDate: '2026-09-20',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'reg-seed-2',
    token: 'MUMY-26-K11-9102',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9811223344',
    kundNumber: 11,
    date: '2026-11-16',
    address: 'लखनऊ, उत्तर प्रदेश',
    gotra: 'कश्यप',
    personCount: 2,
    amount: 2200,
    paymentStatus: 'paid',
    utrNumber: '427310842929',
    paymentDate: '2026-09-21',
    createdAt: '2026-09-21T11:30:00Z',
  },
  {
    id: 'reg-seed-3',
    token: 'MUMY-26-K12-3341',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9450123789',
    kundNumber: 12,
    date: '2026-11-16',
    address: 'गाजियाबाद, उत्तर प्रदेश',
    gotra: 'वशिष्ठ',
    personCount: 2,
    amount: 2200,
    paymentStatus: 'paid',
    utrNumber: '427410842950',
    paymentDate: '2026-09-22',
    createdAt: '2026-09-22T09:15:00Z',
  },
  {
    id: 'reg-seed-4',
    token: 'MUMY-26-K15-7782',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9910023456',
    kundNumber: 15,
    date: '2026-11-16',
    address: 'नई दिल्ली',
    gotra: 'गर्ग',
    personCount: 2,
    amount: 2200,
    paymentStatus: 'paid',
    utrNumber: '427510842981',
    paymentDate: '2026-09-23',
    createdAt: '2026-09-23T14:40:00Z',
  },
  {
    id: 'reg-seed-5',
    token: 'MUMY-26-K21-4412',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9899887766',
    kundNumber: 21,
    date: '2026-11-16',
    address: 'इंदिरापुरम, गाजियाबाद',
    gotra: 'शांडिल्य',
    personCount: 1,
    amount: 1100,
    paymentStatus: 'paid',
    utrNumber: '427610843102',
    paymentDate: '2026-09-24',
    createdAt: '2026-09-24T16:10:00Z',
  },
  {
    id: 'reg-seed-6',
    token: 'MUMY-26-K25-1193',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9717112233',
    kundNumber: 25,
    date: '2026-11-16',
    address: 'गाजियाबाद',
    gotra: 'अत्रि',
    personCount: 2,
    amount: 2200,
    paymentStatus: 'paid',
    utrNumber: '427710843155',
    paymentDate: '2026-09-25',
    createdAt: '2026-09-25T12:00:00Z',
  },
  {
    id: 'reg-seed-7',
    token: 'MUMY-26-K33-5582',
    husbandName: 'आरक्षित यजमान',
    wifeName: '',
    mobile: '9654321098',
    kundNumber: 33,
    date: '2026-11-16',
    address: 'ग्रेटर नोएडा, उत्तर प्रदेश',
    gotra: 'गौतम',
    personCount: 2,
    amount: 2200,
    paymentStatus: 'paid',
    utrNumber: '427810843190',
    paymentDate: '2026-09-26',
    createdAt: '2026-09-26T18:20:00Z',
  },
];

export function getSavedRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_DATA;
  } catch (e) {
    console.error('Failed to read registrations', e);
    return SEED_DATA;
  }
}

export function saveRegistrations(regs: Registration[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regs));
  } catch (e) {
    console.error('Failed to save registrations', e);
  }
}

export function addRegistration(reg: Registration): Registration[] {
  const current = getSavedRegistrations();
  const updated = [reg, ...current.filter((r) => r.id !== reg.id)];
  saveRegistrations(updated);
  return updated;
}

const USER_LATEST_BOOKING_KEY = 'maharishi_user_latest_booking';

export function getLatestUserBooking(): Registration | null {
  try {
    const raw = localStorage.getItem(USER_LATEST_BOOKING_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveLatestUserBooking(reg: Registration): void {
  try {
    localStorage.setItem(USER_LATEST_BOOKING_KEY, JSON.stringify(reg));
  } catch (e) {
    console.error('Failed to save latest booking', e);
  }
}

export function clearLatestUserBooking(): void {
  try {
    localStorage.removeItem(USER_LATEST_BOOKING_KEY);
  } catch (e) {
    // ignore
  }
}

export function findUserRegistration(query: string): Registration | null {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();
  const list = getSavedRegistrations();
  return (
    list.find(
      (r) =>
        r.token.toLowerCase() === q ||
        r.mobile === q ||
        r.mobile.endsWith(q) ||
        (r.utrNumber && r.utrNumber.toLowerCase() === q)
    ) || null
  );
}

export function deleteRegistration(id: string): Registration[] {
  const current = getSavedRegistrations();
  const updated = current.filter((r) => r.id !== id);
  saveRegistrations(updated);
  return updated;
}

/**
 * Generates unique verifiable token for Maharishi Bharat Utkarsh Maha Yagya
 * Format: MUMY-26-K{kundNumber}-{alphanumeric_hex}
 */
export function generateToken(kundNumber: number, mobile: string): string {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-4) || '9999';
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const kundFormatted = String(kundNumber).padStart(2, '0');
  return `MUMY-26-K${kundFormatted}-${cleanMobile.slice(-2)}${rand}`;
}

/**
 * Export registrations as CSV for Excel with UTF-8 BOM
 */
export function exportToCSV(registrations: Registration[]) {
  const headers = [
    'टोकन नंबर (Token No)',
    'कुंड संख्या (Kund No)',
    'तारीख (Date)',
    'पति / मुख्य यजमान (Husband/Primary)',
    'पत्नी (Wife)',
    'मोबाइल नंबर (Mobile)',
    'गोत्र (Gotra)',
    'संख्या (Persons)',
    'राशि (Amount)',
    'भुगतान स्थिति (Status)',
    'UTR / संदर्भ संख्या (UTR Ref)',
    'पता (Address)',
  ];

  const rows = registrations.map((r) => [
    `"${r.token}"`,
    r.kundNumber,
    `"${r.date}"`,
    `"${r.husbandName}"`,
    `"${r.wifeName || '-'}"`,
    `"${r.mobile}"`,
    `"${r.gotra || '-'}"`,
    r.personCount,
    r.amount,
    `"${r.paymentStatus === 'paid' ? 'सफल (Paid)' : r.paymentStatus === 'counter_pay' ? 'काउंटर पर देय' : 'लंबित'}"`,
    `"${r.utrNumber || '-'}"`,
    `"${(r.address || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Maharishi_Yagya_2026_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Backup JSON
 */
export function exportBackupJSON(registrations: Registration[]) {
  const dataStr = JSON.stringify(registrations, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Maharishi_Yagya_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import Backup JSON
 */
export function importBackupJSON(file: File): Promise<Registration[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          saveRegistrations(parsed);
          resolve(parsed);
        } else {
          reject(new Error('अमान्य बैकअप फाइल प्रारूप (Invalid format)'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('फाइल पढ़ने में त्रुटि'));
    reader.readAsText(file);
  });
}
