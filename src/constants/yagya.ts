import { DevoteeUser, ParticipationTypeOption, Registration, YagyaDateOption } from '../types/yagya';

export const TOTAL_KUNDS = 108;
export const RESERVED_KUNDS_COUNT = 9;

// Multiple Dakshina Options (Not fixed - multiple options 2100, 5100, 100000 & custom)
export const DAKSHINA_PRESET_OPTIONS = [
  { amount: 2100, label: '₹ 2,100', subtitle: 'शुभ दक्षिणा' },
  { amount: 5100, label: '₹ 5,100', subtitle: 'विशेष दक्षिणा' },
  { amount: 100000, label: '₹ 1,00,000', subtitle: 'विशिष्ट यजमान सहयोग (1 लाख)' },
];
export const DEFAULT_DAKSHINA_AMOUNT = 2100;
export const PRICE_PER_KUND = 2100;
export const DEFAULT_PRICE_PER_PERSON = 2100;

export const YAGYA_DATE_RANGE = '27 नवम्बर 2026 से 5 दिसम्बर 2026';
export const YAGYA_LOCATION_MAP_URL = 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA';
export const VENUE_ADDRESS = 'रामलीला मैदान, महर्षि आश्रम, गेट सं. 6, महर्षि नगर, सेक्टर-110, नोएडा 201304';

// Updated Dates: 27 Nov 2026 to 5 Dec 2026
export const YAGYA_DATES: YagyaDateOption[] = [
  { date: '2026-11-27', label: '27 नवम्बर 2026 (शुभारंभ / दिवस 1)' },
  { date: '2026-11-28', label: '28 नवम्बर 2026 (दिवस 2)' },
  { date: '2026-11-29', label: '29 नवम्बर 2026 (दिवस 3)' },
  { date: '2026-11-30', label: '30 नवम्बर 2026 (दिवस 4)' },
  { date: '2026-12-01', label: '01 दिसम्बर 2026 (दिवस 5)' },
  { date: '2026-12-02', label: '02 दिसम्बर 2026 (दिवस 6)' },
  { date: '2026-12-03', label: '03 दिसम्बर 2026 (दिवस 7)' },
  { date: '2026-12-04', label: '04 दिसम्बर 2026 (दिवस 8)' },
  { date: '2026-12-05', label: '05 दिसम्बर 2026 (पूर्णाहुति / दिवस 9)' },
];

export const YAGYA_TIME = 'प्रातः 09:30 AM';

export const TIME_SLOTS: string[] = [
  'प्रातः 09:00 AM',
];

export const PARTICIPATION_TYPES: ParticipationTypeOption[] = [
  { label: 'दंपति (यजमान - 2 व्यक्ति)', defaultPersons: 2 },
  { label: 'एकल साधक (1 व्यक्ति)', defaultPersons: 1 },
  { label: 'सपरिवार (3-6 व्यक्ति)', defaultPersons: 4 },
  { label: 'विशिष्ट कुल समूह (7-10 व्यक्ति)', defaultPersons: 8 },
];

// Clean fresh start - All bookable kunds 10-108 free, 1-9 reserved for Sants
export const INITIAL_REGISTRATIONS: Registration[] = [];
export const INITIAL_DEVOTEES: DevoteeUser[] = [];
