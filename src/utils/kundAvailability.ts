import { HawanKundStatus, Registration, TOTAL_KUNDS, RESERVED_KUNDS_COUNT } from '../types/yagya';

export interface KundOccupancySummary {
  kundList: HawanKundStatus[];
  totalAvailable: number;
  totalPartiallyBooked: number;
  totalFull: number;
  totalReserved: number;
  allOtherKundsFilledForShared: boolean;
}

export function computeKundStatuses(
  registrations: Registration[],
  selectedDate: string,
  capacityPerKund: number = 2
): KundOccupancySummary {
  const now = Date.now();
  // Filter active registrations on this date (exclude rejected, expired, or expired temp holds)
  const dateRegistrations = registrations.filter((r) => {
    if (r.date !== selectedDate) return false;
    if (r.paymentStatus === 'rejected' || r.paymentStatus === 'expired') return false;

    // If pending/temp_hold, check if hold expired without submission
    if ((r.paymentStatus === 'pending' || r.paymentStatus === 'temp_hold') && !r.utrNumber) {
      if (r.expiresAt && new Date(r.expiresAt).getTime() < now) {
        return false;
      }
    }
    return true;
  });

  const kundMap = new Map<number, HawanKundStatus>();

  for (let k = 1; k <= TOTAL_KUNDS; k++) {
    const isReserved = k <= RESERVED_KUNDS_COUNT;
    kundMap.set(k, {
      kundNumber: k,
      formattedNumber: String(k).padStart(3, '0'),
      isReserved,
      capacity: isReserved ? 0 : capacityPerKund,
      bookedCount: 0,
      occupants: [],
    });
  }

  // Populate from active registrations
  for (const reg of dateRegistrations) {
    const kund = kundMap.get(reg.kundNumber);
    if (kund && !kund.isReserved) {
      kund.bookedCount += 1;
      kund.occupants.push({
        token: reg.token,
        primaryName: reg.fullName || reg.husbandName,
        isCouple: Boolean(reg.wifeName),
        status: reg.paymentStatus,
      });
    }
  }

  const kundList = Array.from(kundMap.values());

  // Check how many bookable kunds (10 to 108 = 99 kunds) have 0 bookings
  const bookableKunds = kundList.filter((k) => !k.isReserved);
  const emptyBookableKunds = bookableKunds.filter((k) => k.bookedCount === 0);
  // All other kunds rule: only when all bookable kunds have at least 1 booking, can sharing be enabled
  const allOtherKundsFilledForShared = emptyBookableKunds.length === 0;

  let totalAvailable = 0;
  let totalPartiallyBooked = 0;
  let totalFull = 0;
  const totalReserved = RESERVED_KUNDS_COUNT;

  for (const k of bookableKunds) {
    if (k.bookedCount === 0) {
      totalAvailable++;
    } else if (k.bookedCount < k.capacity) {
      totalPartiallyBooked++;
    } else {
      totalFull++;
    }
  }

  return {
    kundList,
    totalAvailable,
    totalPartiallyBooked,
    totalFull,
    totalReserved,
    allOtherKundsFilledForShared,
  };
}

/**
 * Determine if a specific kund is bookable right now based on user's rule:
 * "A total of 108 yagya will happen everyday, and only 1 couple or their family members can sit in one!
 * And multiple couples can only fill in seats in a yagya only when other 107 emptys are filled with 1 couple each,
 * or individual (or unmarried individuals)"
 */
export function isKundBookable(
  kund: HawanKundStatus,
  allOtherFilled: boolean,
  allowDirectShare: boolean = false
): { bookable: boolean; reason: string } {
  if (kund.isReserved) {
    return {
      bookable: false,
      reason: 'अग्नि कुंड संख्या 001 से 009 पूज्य संत एवं आचार्य गण हेतु आरक्षित हैं। कृपया 010 से 108 में से चुनें।',
    };
  }

  if (kund.bookedCount >= kund.capacity) {
    return {
      bookable: false,
      reason: 'यह अग्नि कुंड इस तिथि पर पूर्णतः भर चुका है (Booked)।',
    };
  }

  if (kund.bookedCount === 0) {
    return {
      bookable: true,
      reason: 'उपलब्ध (Available) - आप इस कुंड का चयन कर सकते हैं।',
    };
  }

  // If already 1 is seated, it is only bookable if all other kunds are already filled
  if (kund.bookedCount === 1) {
    if (allOtherFilled || allowDirectShare) {
      return {
        bookable: true,
        reason: 'सभी अन्य कुंड भर चुके हैं, अतः इस कुंड पर अतिरिक्त यजमान हेतु स्थान उपलब्ध है।',
      };
    }
    return {
      bookable: false,
      reason: 'नियम: पहले अन्य रिक्त कुंडों का चयन करें। जब अन्य सभी कुंड भर जाएंगे, तभी इस कुंड पर अतिरिक्त बुकिंग खुलेगी।',
    };
  }

  return {
    bookable: false,
    reason: 'अनुपलब्ध',
  };
}
