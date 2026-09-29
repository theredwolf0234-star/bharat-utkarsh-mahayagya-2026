import { DevoteeUser, ParticipationTypeOption, Registration, YagyaDateOption } from '../types/yagya';

export const TOTAL_KUNDS = 108;
export const RESERVED_KUNDS_COUNT = 9;
export const PRICE_PER_KUND = 1100;
export const DEFAULT_PRICE_PER_PERSON = 1100;
export const YAGYA_LOCATION_MAP_URL = 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA';
export const VENUE_ADDRESS = 'रामलीला मैदान, महर्षि आश्रम, गेट सं. 5, महर्षि नगर, सेक्टर-110, नोएडा 201304';

export const YAGYA_DATES: YagyaDateOption[] = [
  { date: '2026-11-16', label: '16 नवम्बर 2026 (शुभारंभ / दिवस 1)' },
  { date: '2026-11-17', label: '17 नवम्बर 2026 (दिवस 2)' },
  { date: '2026-11-18', label: '18 नवम्बर 2026 (दिवस 3)' },
  { date: '2026-11-19', label: '19 नवम्बर 2026 (दिवस 4)' },
  { date: '2026-11-20', label: '20 नवम्बर 2026 (दिवस 5)' },
  { date: '2026-11-21', label: '21 नवम्बर 2026 (दिवस 6)' },
  { date: '2026-11-22', label: '22 नवम्बर 2026 (दिवस 7)' },
  { date: '2026-11-23', label: '23 नवम्बर 2026 (दिवस 8)' },
  { date: '2026-11-24', label: '24 नवम्बर 2026 (दिवस 9)' },
  { date: '2026-11-25', label: '25 नवम्बर 2026 (पूर्णाहुति / दिवस 10)' },
];

export const YAGYA_TIME = 'प्रातः 09:00 AM';

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
