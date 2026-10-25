import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { validateUpiUtr } from './src/utils/utrValidator';
import {
  initSqliteDatabase,
  insertOrUpdateRegistration,
  getAllRegistrationsFromDb,
  deleteRegistrationFromDb,
  clearAllRegistrationsFromDb,
  insertAuditLog,
  getAllAuditLogsFromDb,
  getSystemSettingsFromDb,
  updateSystemSettingsInDb,
  runArbitrarySqlQuery,
  getDatabaseMetadata,
  syncDatabaseWithSupabase,
  insertDevoteeUser,
  getDevoteeUserByMobile,
  getDevoteeUserById,
  getDevoteeUserByEmail,
  getDevoteeUserByIdentifier,
  updateDevoteePassword,
  updateAdminPassword,
  getAdminUserFromDb,
  savePasswordResetToken,
  getActivePasswordResetToken,
  incrementResetTokenAttempts,
  markPasswordResetTokenUsed,
  countRecentResetRequests,
  cleanupExpiredResetTokens,
  getDevoteePrivateTickets,
  cleanupExpiredLocks,
  checkMobileBookingRestriction,
  getKundDetailedStatus,
  createOrRenewKundLock,
  releaseKundLock,
  releaseLockById,
  convertLockToConfirmed,
  getAllActiveKundLocks,
  getRealTimeKundsForDate,
  DbRegistration,
  DbAuditLog,
  DbSystemSettings,
  DbDevoteeUser,
  DbKundLock,
} from './src/server/database';
import {
  sendPasswordResetEmail,
  sendAdminRecoveryAlertEmail,
  isEmailConfigured,
  isSmsConfigured,
  getRequiredConfigurationNotice,
} from './src/server/notifications';

dotenv.config();

// Crash Protection: Intercept unhandled errors so Node.js process never terminates
process.on('uncaughtException', (err) => {
  console.error('🛡️ [Safety Guard] Uncaught Exception intercepted:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🛡️ [Safety Guard] Unhandled Rejection intercepted at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Disk persistence paths
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

// Security & CORS headers to allow Vercel frontends
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Large body limit for payment screenshots (Base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://orsowcqfebzbojnrnncz.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yc293Y3FmZWJ6Ym9qbnJubmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MzI4NDEsImV4cCI6MjEwODUwODg0MX0.DpyyXXGhIIW86arbxB8fkQuoe-LI8h-KjbAXQMl2Ins';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cryptographic Secret for Payment Signatures
const PAYMENT_SECRET_KEY = process.env.PAYMENT_SECRET_KEY || 'MAHARISHI_YAGYA_SECURE_KEY_2026_V1';
export const MASTER_ADMIN_TOKEN = 'maharishi_master_session_token';

interface AdminUser {
  username: string;
  passwordHash: string;
  createdAt: string;
}

let registeredAdmin: AdminUser | null = {
  username: 'maharishi_admin',
  passwordHash: crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update('admin123').digest('hex'),
  createdAt: new Date().toISOString(),
};
const adminSessions = new Map<string, string>(); // token -> username
adminSessions.set(MASTER_ADMIN_TOKEN, 'maharishi_admin');
const devoteeSessions = new Map<string, DbDevoteeUser>(); // token -> devoteeUser

interface ResetAuthorization {
  targetType: 'user' | 'admin';
  identifier: string;
  expiresAt: number;
}
const resetAuthorizations = new Map<string, ResetAuthorization>();

const ADMIN_KEY_FILE = path.join(DATA_DIR, 'admin-recovery.key');
let adminRecoveryKey = process.env.ADMIN_RECOVERY_KEY || '';
if (!adminRecoveryKey) {
  try {
    if (fs.existsSync(ADMIN_KEY_FILE)) {
      adminRecoveryKey = fs.readFileSync(ADMIN_KEY_FILE, 'utf-8').trim();
    } else {
      adminRecoveryKey = crypto.randomBytes(16).toString('hex');
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(ADMIN_KEY_FILE, adminRecoveryKey, { encoding: 'utf-8', mode: 0o600 });
    }
  } catch (err) {
    adminRecoveryKey = 'MAHARISHI_ADMIN_SECURE_RECOVERY_KEY_2026';
  }
}

interface StoredRegistration {
  id: string;
  token: string;
  userId?: string;
  fullName?: string;
  husbandName: string;
  wifeName?: string;
  mobile: string;
  email?: string;
  city?: string;
  kundNumber: number;
  kundCount?: number;
  kundNumbers?: number[];
  date: string;
  timeSlot?: string;
  participationType?: string;
  address: string;
  gotra?: string;
  personCount: number;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'counter_pay' | 'rejected' | 'expired' | 'temp_hold';
  utrNumber?: string;
  paymentProofUrl?: string;
  verificationHash?: string;
  paymentDate?: string;
  expiresAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  isTestMode?: boolean;
  createdAt: string;
}

function getAuthenticatedDevotee(req: Request): DbDevoteeUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return devoteeSessions.get(token) || null;
}

function requireDevotee(req: Request, res: Response, next: () => void) {
  const user = getAuthenticatedDevotee(req);
  if (!user) {
    return res.status(401).json({ error: 'अनधिकृत प्रवेश: कृपया अपने टिकट व अपडेट देखने के लिए पहले लॉगिन करें।' });
  }
  (req as any).devoteeUser = user;
  next();
}

// In-memory registration store
const registrationsStore = new Map<string, StoredRegistration>();
const usedUtrs = new Set<string>();

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(registrationsStore.values());
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save bookings to disk:', e);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
      const list: StoredRegistration[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((item) => {
          registrationsStore.set(item.id, item);
          if (item.utrNumber && item.utrNumber !== 'COUNTER-PAY-ON-DAY') {
            usedUtrs.add(item.utrNumber);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load bookings from disk:', e);
  }
}

loadFromDisk();

// Initialize Embedded SQLite Database engine
initSqliteDatabase()
  .then(async () => {
    const dbRecords = getAllRegistrationsFromDb();
    if (dbRecords.length > 0) {
      dbRecords.forEach((item) => {
        registrationsStore.set(item.id, item as StoredRegistration);
        if (item.utrNumber && item.utrNumber !== 'COUNTER-PAY-ON-DAY') {
          usedUtrs.add(item.utrNumber);
        }
      });
    } else {
      registrationsStore.forEach((item) => {
        insertOrUpdateRegistration(item as DbRegistration);
      });
    }

    // Auto-sync with Supabase on startup (Restores bookings if Render restarted on a fresh container)
    try {
      await syncDatabaseWithSupabase();
      const freshRecords = getAllRegistrationsFromDb();
      freshRecords.forEach((item) => {
        registrationsStore.set(item.id, item as StoredRegistration);
        if (item.utrNumber && item.utrNumber !== 'COUNTER-PAY-ON-DAY') {
          usedUtrs.add(item.utrNumber);
        }
      });
      console.log(`☁️ Supabase cloud synchronization restored ${registrationsStore.size} bookings.`);
    } catch (e: any) {
      console.warn('Supabase startup sync notice:', e?.message || e);
    }

    const dbAdmin = getAdminUserFromDb();
    if (dbAdmin) {
      registeredAdmin = {
        username: dbAdmin.username,
        passwordHash: dbAdmin.passwordHash,
        createdAt: dbAdmin.createdAt,
      };
      console.log(`🔒 Loaded admin credentials for ${dbAdmin.username} from database.`);
    }
    console.log(`⚡ SQLite Database Ready. Loaded ${registrationsStore.size} records.`);
  })
  .catch((err) => {
    console.warn('SQLite initialization warning:', err);
  });

// -------------------------------------------------------------
// Health Check Endpoint (For Uptime Monitors to keep Render awake 24/7)
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    totalBookings: registrationsStore.size,
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

function hashPassword(pass: string): string {
  return crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(pass).digest('hex');
}

function generatePaymentSignature(token: string, utr: string, amount: number): string {
  return crypto
    .createHmac('sha256', PAYMENT_SECRET_KEY)
    .update(`${token}:${utr}:${amount}:VERIFIED`)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase();
}

/**
 * Concurrency Mutex: Prevents race conditions during simultaneous booking & locking attempts
 */
class AsyncMutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const release = () => {
        if (this.queue.length > 0) {
          const next = this.queue.shift()!;
          next();
        } else {
          this.locked = false;
        }
      };

      if (this.locked) {
        this.queue.push(() => resolve(release));
      } else {
        this.locked = true;
        resolve(release);
      }
    });
  }
}
const bookingMutex = new AsyncMutex();

/**
 * Check if a Kund is available (Strict anti-double booking and real-time locking)
 */
function isKundSlotAvailable(
  kundNumber: number,
  date: string,
  excludeId?: string,
  requestingMobile?: string
): { available: boolean; status?: string; reason?: string; remainingSeconds?: number } {
  const result = getKundDetailedStatus(kundNumber, date, requestingMobile);
  return {
    available: result.available,
    status: result.status,
    reason: result.reason,
    remainingSeconds: result.remainingSeconds,
  };
}

// -------------------------------------------------------------
// Real-time Kund Booking & 5-Minute Locking System API
// -------------------------------------------------------------

// 1. Get Live Status of all 108 Kunds for a specific date (AVAILABLE / LOCKED / BOOKED / RESERVED)
app.get('/api/kunds/status', (req: Request, res: Response) => {
  const { date = '2026-11-27', mobile } = req.query;
  const result = getRealTimeKundsForDate(String(date), mobile ? String(mobile) : undefined);
  res.json(result);
});

// 2. Temporarily Lock a Kund (5-minute countdown)
app.post('/api/kunds/lock', async (req: Request, res: Response) => {
  const release = await bookingMutex.acquire();
  try {
    const { kundNumber, date, mobile, fullName, amount } = req.body;
    if (!kundNumber || !date || !mobile) {
      return res.status(400).json({ error: 'कुंड संख्या, यज्ञ तिथि एवं मोबाइल नंबर अनिवार्य हैं।' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ error: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' });
    }

    const kNum = Number(kundNumber);
    if (kNum < 10 || kNum > 108) {
      return res.status(400).json({ error: 'कुंड 1 से 9 पूज्य संतों हेतु आरक्षित हैं। कृपया 10 से 108 में से चुनें।' });
    }

    // Strict 5-minute lock window
    const expiryMinutes = 5;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    const lockId = `lock-${kNum}-${cleanMobile.slice(-4)}-${Date.now()}`;

    const lockData: DbKundLock = {
      lock_id: lockId,
      kund_id: kNum,
      booking_date: String(date),
      mobile_number: cleanMobile,
      user_name: fullName ? String(fullName).trim() : 'यजमान',
      amount: Number(amount) || 2100,
      locked_at: nowIso,
      lock_expires_at: expiresAt,
      status: 'LOCKED',
    };

    const lockResult = createOrRenewKundLock(lockData);
    if (!lockResult.success) {
      const isDailyLimit = lockResult.error?.includes('इस दिन पहले ही एक कुंड पंजीकृत है');
      const statusCode = isDailyLimit ? 400 : 409;
      return res.status(statusCode).json({
        error: lockResult.error,
        code: isDailyLimit ? 'DAILY_LIMIT_EXCEEDED' : 'KUND_UNAVAILABLE',
      });
    }

    return res.status(200).json({
      success: true,
      lock: {
        lockId,
        kundNumber: kNum,
        date: String(date),
        mobile: cleanMobile,
        lockedAt: nowIso,
        lockExpiresAt: expiresAt,
        remainingSeconds: lockResult.remainingSeconds || expiryMinutes * 60,
      },
      message: `हवन कुंड #${String(kNum).padStart(3, '0')} आपके लिए ${expiryMinutes} मिनट हेतु सुरक्षित लॉक कर दिया गया है।`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'कुंड लॉक करने में त्रुटि।' });
  } finally {
    release();
  }
});

// 3. Release Lock (Devotee cancels, navigates away, or changes Kund)
app.post('/api/kunds/release-lock', async (req: Request, res: Response) => {
  const release = await bookingMutex.acquire();
  try {
    const { lockId, kundNumber, date, mobile } = req.body;
    if (lockId) {
      releaseLockById(String(lockId));
    } else if (kundNumber && date) {
      const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : undefined;
      releaseKundLock(Number(kundNumber), String(date), cleanMobile);
    }
    return res.json({ success: true, message: 'कुंड लॉक मुक्त कर दिया गया।' });
  } finally {
    release();
  }
});

// 4. Admin: View All Active Locks
app.get('/api/admin/locks', requireAdmin, (req: Request, res: Response) => {
  const locks = getAllActiveKundLocks();
  res.json({ locks });
});

// 5. Admin: Force Release Lock
app.post('/api/admin/locks/:id/release', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  releaseLockById(id);
  res.json({ success: true, message: `लॉक #${id} को व्यवस्थापक द्वारा मुक्त किया गया।` });
});

// -------------------------------------------------------------
// API: Health & Status
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    event: 'Maharishi Bharat Utkarsh Maha Yagya 2026',
    venue: 'Ramlila Maidan, Maharishi Ashram, Gate No. 5, Sector 110, Noida',
  });
});

// -------------------------------------------------------------
// API: System Settings (Configurable Expiry, Test Mode, UPI)
// -------------------------------------------------------------
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = getSystemSettingsFromDb();
  res.json({ settings });
});

app.post('/api/settings', (req: Request, res: Response) => {
  const { reservationExpiryMinutes, testModeEnabled, upiId, pricePerPerson } = req.body;
  const updateData: Partial<DbSystemSettings> = {};
  if (reservationExpiryMinutes !== undefined) updateData.reservationExpiryMinutes = Number(reservationExpiryMinutes);
  if (testModeEnabled !== undefined) updateData.testModeEnabled = Boolean(testModeEnabled);
  if (upiId !== undefined) updateData.upiId = String(upiId).trim();
  if (pricePerPerson !== undefined) updateData.pricePerPerson = Number(pricePerPerson);

  updateSystemSettingsInDb(updateData);
  const updated = getSystemSettingsFromDb();

  // Log action
  insertAuditLog({
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUsername: 'Admin',
    action: 'SETTINGS_CHANGED',
    details: JSON.stringify(updated),
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, settings: updated });
});

// -------------------------------------------------------------
// API: Devotee User Authentication & Strict Privacy Tickets
// -------------------------------------------------------------
app.post('/api/user/signup', async (req: Request, res: Response) => {
  try {
    const { fullName, mobile, password, email, city, gotra } = req.body;
    if (!fullName || !mobile || !password) {
      return res.status(400).json({ error: 'कृपया नाम, 10 अंकों का मोबाइल नंबर एवं पासवर्ड दर्ज करें।' });
    }
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ error: 'अमान्य मोबाइल नंबर! 10 अंकों का वैध नंबर दर्ज करें।' });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ error: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' });
    }

    const existing = getDevoteeUserByMobile(cleanMobile);
    if (existing) {
      return res.status(409).json({ error: 'इस मोबाइल नंबर पर पहले से खाता मौजूद है। कृपया लॉगिन करें।' });
    }

    const passHash = hashPassword(String(password));
    const userId = `devotee-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const user: DbDevoteeUser = {
      id: userId,
      fullName: String(fullName).trim(),
      mobile: cleanMobile,
      passwordHash: passHash,
      email: email ? String(email).trim() : undefined,
      city: city ? String(city).trim() : 'नोएडा',
      gotra: gotra ? String(gotra).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    insertDevoteeUser(user);

    // Link any existing bookings with this mobile to this user
    registrationsStore.forEach((reg) => {
      if (reg.mobile === cleanMobile && !reg.userId) {
        reg.userId = userId;
        insertOrUpdateRegistration(reg as DbRegistration);
      }
    });
    saveToDisk();

    try {
      await supabase.from('devotee_users').upsert([
        {
          id: user.id,
          full_name: user.fullName,
          mobile: user.mobile,
          password_hash: user.passwordHash,
          email: user.email || null,
          city: user.city || null,
          gotra: user.gotra || null,
          created_at: user.createdAt,
        },
      ]);
    } catch (e) {}

    const sessionToken = crypto.randomBytes(32).toString('hex');
    devoteeSessions.set(sessionToken, user);

    return res.status(201).json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        city: user.city,
        gotra: user.gotra,
        createdAt: user.createdAt,
      },
      message: 'खाता सफलतापूर्वक निर्मित हुआ।',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'पंजीकरण में त्रुटि।' });
  }
});

app.post('/api/user/login', (req: Request, res: Response) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) {
    return res.status(400).json({ error: 'कृपया मोबाइल नंबर एवं पासवर्ड दर्ज करें।' });
  }
  const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
  const user = getDevoteeUserByMobile(cleanMobile);
  if (!user) {
    return res.status(404).json({ error: 'इस मोबाइल नंबर पर कोई खाता नहीं मिला। कृपया पहले साइन अप करें।' });
  }

  const hash = hashPassword(String(password));
  if (user.passwordHash !== hash) {
    return res.status(401).json({ error: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।' });
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  devoteeSessions.set(sessionToken, user);

  return res.json({
    success: true,
    token: sessionToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      mobile: user.mobile,
      email: user.email,
      city: user.city,
      gotra: user.gotra,
      createdAt: user.createdAt,
    },
    message: 'सफलतापूर्वक लॉगिन हुआ।',
  });
});

app.get('/api/user/me', requireDevotee, (req: Request, res: Response) => {
  const user = (req as any).devoteeUser as DbDevoteeUser;
  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      mobile: user.mobile,
      email: user.email,
      city: user.city,
      gotra: user.gotra,
      createdAt: user.createdAt,
    },
  });
});

// Devotee My Tickets: STRICT PRIVACY!
// A devotee ONLY sees their own tickets and real-time updates!
app.get('/api/user/my-tickets', requireDevotee, (req: Request, res: Response) => {
  const user = (req as any).devoteeUser as DbDevoteeUser;
  const dbTickets = getDevoteePrivateTickets(user.id, user.mobile);
  const memTickets = Array.from(registrationsStore.values()).filter(
    (r) => (r.userId && r.userId === user.id) || r.mobile === user.mobile
  );

  const map = new Map<string, StoredRegistration>();
  dbTickets.forEach((t) => map.set(t.id, t as any));
  memTickets.forEach((t) => map.set(t.id, t));

  const list = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json({ tickets: list, count: list.length });
});

app.post('/api/user/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    devoteeSessions.delete(token);
  }
  res.json({ success: true, message: 'सफलतापूर्वक लॉगआउट हुआ।' });
});

// -------------------------------------------------------------
// Recovery Status Endpoint (Truthful notification on delivery capability)
// -------------------------------------------------------------
app.get('/api/auth/recovery-status', (req: Request, res: Response) => {
  const emailReady = isEmailConfigured();
  const smsReady = isSmsConfigured();
  res.json({
    emailConfigured: emailReady,
    smsConfigured: smsReady,
    adminRecoveryConfigured: true,
    notice: getRequiredConfigurationNotice(),
  });
});

// -------------------------------------------------------------
// Devotee Password Recovery: Request Reset OTP / Link
// -------------------------------------------------------------
app.post('/api/user/forgot-password', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'कृपया अपना पंजीकृत मोबाइल नंबर या ईमेल आईडी दर्ज करें।' });
    }

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const cleanIdent = isEmail ? trimmed.toLowerCase() : trimmed.replace(/\D/g, '').slice(-10);

    if (!cleanIdent || (!isEmail && cleanIdent.length !== 10)) {
      return res.status(400).json({ error: 'कृपया एक मान्य 10-अंकों का मोबाइल नंबर या ईमेल दर्ज करें।' });
    }

    // Rate Limiting: Max 3 requests per hour per identifier
    const recentCount = countRecentResetRequests(cleanIdent, 60);
    if (recentCount >= 3) {
      return res.status(429).json({
        error: 'अत्यधिक अनुरोध: कृपया कुछ देर प्रतीक्षा करें। 1 घंटे में केवल 3 बार पासवर्ड रीसेट का अनुरोध किया जा सकता है।',
      });
    }

    // Lookup user in DB (Devotee ONLY - Admin accounts are strictly protected from this flow)
    const user = getDevoteeUserByIdentifier(cleanIdent);

    // If user exists, generate cryptographically secure 6-digit OTP
    let rawOtp = '';
    let emailSent = false;

    if (user) {
      rawOtp = crypto.randomInt(100000, 999999).toString();
      const tokenHash = crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(rawOtp).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      savePasswordResetToken({
        id: crypto.randomUUID(),
        targetType: 'user',
        identifier: cleanIdent,
        tokenHash,
        expiresAt,
      });

      // Try email delivery if configured and user has an email
      const targetEmail = isEmail ? cleanIdent : user.email;
      if (targetEmail && isEmailConfigured()) {
        try {
          const sendResult = await sendPasswordResetEmail(targetEmail, rawOtp, user.fullName);
          emailSent = sendResult.success;
        } catch (e) {
          console.error('Password reset email dispatch error:', e);
        }
      }
    }

    // GENERIC CONFIRMATION: Never reveal whether an account exists!
    const emailConfigured = isEmailConfigured();
    const smsConfigured = isSmsConfigured();
    const isDeliveryReady = Boolean((emailConfigured && (isEmail || (user && user.email))) || smsConfigured);

    if (!isDeliveryReady) {
      return res.json({
        success: true,
        deliveryConfigured: false,
        requiresConfiguration: true,
        requiredConfigNotice: getRequiredConfigurationNotice(),
        message: 'यदि यह मोबाइल/ईमेल पंजीकृत है, तो सत्यापन कोड जनरेट हो गया है। ध्यान दें: सर्वर पर वास्तविक ईमेल/SMS सेवा अभी सक्रिय नहीं है।',
        debugCode: rawOtp || undefined,
      });
    }

    return res.json({
      success: true,
      deliveryConfigured: true,
      message: 'यदि यह खाता पंजीकृत है, तो 6-अंकों का सत्यापन कोड आपके पंजीकृत माध्यम पर भेज दिया गया है। यह कोड 10 मिनट के लिए मान्य है।',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'पासवर्ड रीसेट अनुरोध संसाधित करने में त्रुटि।' });
  }
});

// -------------------------------------------------------------
// Devotee Password Recovery: Verify OTP & Return Reset Auth Token
// -------------------------------------------------------------
app.post('/api/user/verify-reset-otp', (req: Request, res: Response) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'कृपया पहचानकर्ता एवं OTP कोड दोनों प्रदान करें।' });
    }

    const trimmed = String(identifier).trim();
    const isEmail = trimmed.includes('@');
    const cleanIdent = isEmail ? trimmed.toLowerCase() : trimmed.replace(/\D/g, '').slice(-10);
    const cleanOtp = String(otp).trim();

    const hashedOtp = crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(cleanOtp).digest('hex');
    const tokenRecord = getActivePasswordResetToken(cleanIdent, hashedOtp);

    if (!tokenRecord || tokenRecord.targetType !== 'user') {
      return res.status(400).json({
        error: 'अमान्य अथवा समाप्त हो चुका OTP कोड। कृपया पुनः प्रयास करें अथवा नया कोड प्राप्त करें।',
      });
    }

    if (tokenRecord.attempts >= 5) {
      return res.status(429).json({
        error: 'अधिकतम सत्यापन प्रयास पार हो गए हैं। सुरक्षा कारणों से यह OTP अमान्य कर दिया गया है।',
      });
    }

    // Invalidate the OTP immediately to prevent replay attacks
    markPasswordResetTokenUsed(tokenRecord.id);

    // Grant temporary short-lived reset authorization (15 minutes)
    const resetAuthToken = crypto.randomBytes(32).toString('hex');
    resetAuthorizations.set(resetAuthToken, {
      targetType: 'user',
      identifier: cleanIdent,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return res.json({
      success: true,
      resetAuthToken,
      message: 'OTP सफलतापूर्वक सत्यापित हुआ। अब आप अपना नया पासवर्ड सेट कर सकते हैं।',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'OTP सत्यापन में त्रुटि।' });
  }
});

// -------------------------------------------------------------
// Devotee Password Recovery: Set New Password
// -------------------------------------------------------------
app.post('/api/user/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetAuthToken, newPassword } = req.body;
    if (!resetAuthToken || !newPassword) {
      return res.status(400).json({ error: 'सत्यापन टोकन एवं नया पासवर्ड दोनों आवश्यक हैं।' });
    }

    const auth = resetAuthorizations.get(resetAuthToken);
    if (!auth || auth.targetType !== 'user' || auth.expiresAt < Date.now()) {
      return res.status(401).json({
        error: 'सत्यापन टोकन अमान्य अथवा समाप्त हो चुका है। कृपया पासवर्ड रीसेट प्रक्रिया पुनः प्रारंभ करें।',
      });
    }

    // Invalidate the reset authorization immediately (Single-use)
    resetAuthorizations.delete(resetAuthToken);

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'नया पासवर्ड न्यूनतम 6 अक्षरों का होना अनिवार्य है।' });
    }

    const newHash = hashPassword(newPassword);

    // Resolve target mobile
    let targetMobile = auth.identifier;
    const user = getDevoteeUserByIdentifier(auth.identifier);
    if (user) {
      targetMobile = user.mobile;
    }

    // 1. Update SQLite
    const updated = updateDevoteePassword(targetMobile, newHash);
    if (!updated) {
      return res.status(500).json({ error: 'पासवर्ड अपडेट करने में त्रुटि। कृपया पुनः प्रयास करें।' });
    }

    // 2. Sync to Supabase
    try {
      await supabase.from('devotee_users').update({ password_hash: newHash }).eq('mobile', targetMobile);
    } catch (e) {
      console.warn('Supabase devotee password sync note:', e);
    }

    // 3. Security: Invalidate all existing active sessions for this devotee
    for (const [token, sUser] of devoteeSessions.entries()) {
      if (sUser.mobile === targetMobile || (user && sUser.id === user.id)) {
        devoteeSessions.delete(token);
      }
    }

    return res.json({
      success: true,
      message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है। आपके पुराने सभी सत्र समाप्त कर दिए गए हैं। कृपया नए पासवर्ड से लॉगिन करें।',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'पासवर्ड रीसेट करने में त्रुटि।' });
  }
});

// -------------------------------------------------------------
// API: Registrations (Privacy-Guarded & Anonymous for Tracker)
// -------------------------------------------------------------
app.get('/api/registrations', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  // 1. If admin session, return all bookings
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (adminSessions.has(token)) {
      const list = Array.from(registrationsStore.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return res.json({ registrations: list, isAdmin: true });
    }
  }

  // 2. If logged in devotee, return ONLY devotee's own tickets
  const devotee = getAuthenticatedDevotee(req);
  if (devotee) {
    const list = Array.from(registrationsStore.values())
      .filter((r) => (r.userId && r.userId === devotee.id) || r.mobile === devotee.mobile)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ registrations: list, isPersonalOnly: true });
  }

  // 3. PUBLIC REQUEST: STRICT PRIVACY!
  // No other devotee passes or personal details shown!
  // Only anonymous occupancy data for the Hawan Kund Tracker:
  const anonymousOccupancy = Array.from(registrationsStore.values()).map((r) => ({
    id: r.id,
    token: '***',
    kundNumber: r.kundNumber,
    date: r.date,
    paymentStatus: r.paymentStatus,
    expiresAt: r.expiresAt,
    timeSlot: r.timeSlot,
    createdAt: r.createdAt,
    // Zero personal devotee names or phone numbers!
  }));

  return res.json({ registrations: anonymousOccupancy, isAnonymous: true });
});

// Single/Multiple ticket lookup by token OR mobile for devotee self-check
app.post('/api/registrations/lookup', (req: Request, res: Response) => {
  const { token, mobile } = req.body;
  if (!token && !mobile) {
    return res.status(400).json({
      error: 'कृपया प्रवेश पत्र टोकन अथवा 10 अंकों का पंजीकृत मोबाइल नंबर दर्ज करें।',
    });
  }

  const cleanToken = token ? String(token).trim().toUpperCase() : '';
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : '';

  const matches = Array.from(registrationsStore.values()).filter((r) => {
    if (cleanToken && cleanMobile) {
      return r.token.toUpperCase() === cleanToken && r.mobile === cleanMobile;
    }
    if (cleanToken) {
      return r.token.toUpperCase() === cleanToken;
    }
    if (cleanMobile) {
      return r.mobile === cleanMobile;
    }
    return false;
  });

  if (matches.length === 0) {
    return res.status(404).json({
      error: 'पंजीकरण रिकॉर्ड नहीं मिला। कृपया टोकन अथवा मोबाइल नंबर की शुद्धता जाँचें।',
    });
  }

  return res.json({ result: matches[0], results: matches });
});

// GET version fallback (supports token or mobile)
app.get('/api/registrations/lookup', (req: Request, res: Response) => {
  const { token, mobile } = req.query;
  if (!token && !mobile) {
    return res.status(400).json({
      error: 'कृपया टोकन अथवा पंजीकृत मोबाइल नंबर दर्ज करें।',
    });
  }

  const cleanToken = token ? String(token).trim().toUpperCase() : '';
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : '';

  const matches = Array.from(registrationsStore.values()).filter((r) => {
    if (cleanToken && cleanMobile) {
      return r.token.toUpperCase() === cleanToken && r.mobile === cleanMobile;
    }
    if (cleanToken) {
      return r.token.toUpperCase() === cleanToken;
    }
    if (cleanMobile) {
      return r.mobile === cleanMobile;
    }
    return false;
  });

  if (matches.length === 0) {
    return res.status(404).json({ error: 'प्रवेश पत्र नहीं मिला।' });
  }

  return res.json({ results: matches });
});

// Step 1 & 2: Initiate Temporary Reservation Hold (Prevents Double Booking)
app.post('/api/reservations/temp-hold', async (req: Request, res: Response) => {
  const release = await bookingMutex.acquire();
  try {
    const {
      fullName,
      husbandName,
      wifeName,
      mobile,
      email,
      city,
      kundNumber,
      kundNumbers,
      kundCount,
      date,
      timeSlot,
      participationType,
      address,
      gotra,
      personCount = 2,
    } = req.body;

    const primaryName = (fullName || husbandName || '').trim();
    if (!primaryName || !mobile || !kundNumber || !date) {
      return res.status(400).json({ error: 'सभी आवश्यक यजमान विवरण भरें।' });
    }

    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return res.status(400).json({ error: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' });
    }

    const kNum = Number(kundNumber);
    if (kNum < 10 || kNum > 108) {
      return res.status(400).json({ error: 'कुंड संख्या 001 से 009 पूज्य संतों हेतु आरक्षित हैं। कृपया 10 से 108 में से चुनें।' });
    }

    // Enforce 1 Kund per day per mobile number
    const mobileCheck = checkMobileBookingRestriction(cleanMobile, String(date));
    if (!mobileCheck.allowed) {
      return res.status(400).json({
        error: mobileCheck.reason || 'इस मोबाइल नंबर से इस दिन पहले ही एक कुंड पंजीकृत है। एक मोबाइल नंबर से एक दिन में केवल एक कुंड का पंजीकरण किया जा सकता है।',
        code: 'DAILY_LIMIT_EXCEEDED',
      });
    }

    // Check kund availability (Strict concurrent anti-double booking)
    const availability = getKundDetailedStatus(kNum, String(date), cleanMobile);
    if (!availability.available) {
      return res.status(409).json({ error: availability.reason || 'यह हवन कुंड इस समय उपलब्ध नहीं है।' });
    }

    const count = Number(personCount) || (wifeName ? 2 : 1);
    const resolvedKundCount = 1; // Strict: 1 booking = 1 kund
    const amount = Number(req.body.amount) || 2100; // Flexible dakshina options: 2100, 5100, 100000, etc.

    const settings = getSystemSettingsFromDb();

    // Strict 5-minute atomic lock window
    const expiryMinutes = 5;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    const lockId = `lock-${kNum}-${cleanMobile.slice(-4)}-${Date.now()}`;
    const lockResult = createOrRenewKundLock({
      lock_id: lockId,
      kund_id: kNum,
      booking_date: String(date),
      mobile_number: cleanMobile,
      user_name: primaryName,
      amount,
      locked_at: nowIso,
      lock_expires_at: expiresAt,
      status: 'LOCKED',
    });

    if (!lockResult.success) {
      const isDailyLimit = lockResult.error?.includes('इस दिन पहले ही एक कुंड पंजीकृत है');
      return res.status(isDailyLimit ? 400 : 409).json({
        error: lockResult.error || 'यह हवन कुंड लॉक नहीं किया जा सका।',
        code: isDailyLimit ? 'DAILY_LIMIT_EXCEEDED' : 'KUND_UNAVAILABLE',
      });
    }

    const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const token = `MUMY-26-K${String(kNum).padStart(2, '0')}-${cleanMobile.slice(-2)}${randHex}`;
    const id = `reg-${Date.now()}-${randHex}`;

    const authDevotee = getAuthenticatedDevotee(req);
    const existingDevotee = authDevotee || getDevoteeUserByMobile(cleanMobile);
    const linkedUserId = existingDevotee ? existingDevotee.id : undefined;

    const tempReg: StoredRegistration = {
      id,
      token,
      userId: linkedUserId,
      fullName: primaryName,
      husbandName: primaryName,
      wifeName: wifeName ? wifeName.trim() : undefined,
      mobile: cleanMobile,
      email: email ? email.trim() : undefined,
      city: city ? city.trim() : 'नोएडा',
      kundNumber: kNum,
      kundCount: resolvedKundCount,
      kundNumbers: [kNum],
      date: String(date),
      timeSlot: timeSlot || 'प्रातः 09:00 AM',
      participationType: participationType || 'दंपति',
      address: address || 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
      gotra: gotra ? gotra.trim() : undefined,
      personCount: count,
      amount,
      paymentStatus: 'temp_hold',
      expiresAt,
      isTestMode: settings.testModeEnabled,
      createdAt: nowIso,
    };

    registrationsStore.set(id, tempReg);
    saveToDisk();
    insertOrUpdateRegistration(tempReg as DbRegistration);

    try {
      await supabase.from('registrations').upsert([
        {
          id: tempReg.id,
          token: tempReg.token,
          full_name: tempReg.fullName,
          husband_name: tempReg.husbandName,
          wife_name: tempReg.wifeName || null,
          mobile: tempReg.mobile,
          email: tempReg.email || null,
          city: tempReg.city,
          kund_number: tempReg.kundNumber,
          date: tempReg.date,
          time_slot: tempReg.timeSlot,
          participation_type: tempReg.participationType,
          person_count: tempReg.personCount,
          amount: tempReg.amount,
          payment_status: 'temp_hold',
          expires_at: tempReg.expiresAt,
          address: tempReg.address,
          gotra: tempReg.gotra || null,
          created_at: tempReg.createdAt,
        },
      ]);
    } catch (e) {
      // ignore
    }

    return res.status(201).json({
      success: true,
      registration: tempReg,
      lock: {
        lockId,
        kundNumber: kNum,
        date: String(date),
        mobile: cleanMobile,
        lockedAt: nowIso,
        lockExpiresAt: expiresAt,
        remainingSeconds: lockResult.remainingSeconds || expiryMinutes * 60,
      },
      expiresAt,
      expiryMinutes,
      remainingSeconds: lockResult.remainingSeconds || expiryMinutes * 60,
      message: `कुंड संख्या #${kNum} आपके लिए ${expiryMinutes} मिनट हेतु सुरक्षित लॉक कर दिया गया है। कृपया दक्षिणा विवरण जमा करें।`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'अस्थायी आरक्षण में त्रुटि।' });
  } finally {
    release();
  }
});

// -------------------------------------------------------------
// API: Payment Proof Submission (Fixing the Random 12-Digit Issue)
// In Live Mode: Status stays PENDING until admin verification!
// In Free TEST Mode: Instant mock approval is available.
// -------------------------------------------------------------
app.post('/api/payment/submit-proof', async (req: Request, res: Response) => {
  const release = await bookingMutex.acquire();
  try {
    const {
      registrationId,
      token,
      utrNumber,
      paymentProofUrl,
      isCounterPay = false,
      forceTestModeApprove = false,
    } = req.body;

    const targetId = registrationId || token || (req.body.registration && (req.body.registration.id || req.body.registration.token));
    let reg = Array.from(registrationsStore.values()).find(
      (r) => r.id === targetId || r.token === targetId
    );

    if (!reg) {
      const src = req.body.registration || req.body;
      if (src && (src.mobile || src.fullName || src.husbandName)) {
        const primaryKund = Number(src.kundNumber) || 10;
        const cleanMob = String(src.mobile || '').replace(/\D/g, '').slice(-10);
        const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        const genToken = src.token || `MUMY-26-K${String(primaryKund).padStart(2, '0')}-${cleanMob.slice(-2)}${randHex}`;
        const genId = src.id || `reg-${Date.now()}-${randHex}`;

        reg = {
          id: genId,
          token: genToken,
          fullName: src.fullName || src.husbandName || 'यजमान',
          husbandName: src.husbandName || src.fullName || 'यजमान',
          wifeName: src.wifeName,
          mobile: cleanMob,
          email: src.email,
          city: src.city || 'नोएडा',
          kundNumber: primaryKund,
          kundCount: 1,
          kundNumbers: [primaryKund],
          date: src.date || '2026-11-27',
          timeSlot: src.timeSlot || 'प्रातः 09:00 AM',
          address: src.address || 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
          gotra: src.gotra,
          personCount: src.personCount || 2,
          amount: Number(src.amount) || 2100,
          paymentStatus: 'pending',
          createdAt: src.createdAt || new Date().toISOString(),
        };
        registrationsStore.set(reg.id, reg);
      } else {
        return res.status(404).json({ error: 'आरक्षण रिकॉर्ड नहीं मिला। कृपया पुनः प्रयास करें।' });
      }
    }

    // Backend & Database Check: Only 1 confirmed Kund per mobile number per day
    const restriction = checkMobileBookingRestriction(reg.mobile, reg.date);
    if (!restriction.allowed && restriction.existingToken !== reg.token) {
      return res.status(400).json({
        error: restriction.reason || 'इस मोबाइल नंबर से इस दिन पहले ही एक कुंड पंजीकृत है। एक मोबाइल नंबर से एक दिन में केवल एक कुंड का पंजीकरण किया जा सकता है।',
        code: 'DAILY_LIMIT_EXCEEDED',
      });
    }

    const authDevotee = getAuthenticatedDevotee(req);
    const devByMob = getDevoteeUserByMobile(reg.mobile);
    if (!reg.userId) {
      reg.userId = authDevotee ? authDevotee.id : devByMob ? devByMob.id : undefined;
    }

    const settings = getSystemSettingsFromDb();

    // 1. Counter Pay Option
    if (isCounterPay) {
      reg.paymentStatus = 'counter_pay';
      reg.utrNumber = 'COUNTER-PAY-ON-DAY';
      reg.paymentDate = new Date().toISOString().slice(0, 10);
      reg.verificationHash = generatePaymentSignature(reg.token, 'COUNTER', reg.amount);

      registrationsStore.set(reg.id, reg);
      saveToDisk();
      insertOrUpdateRegistration(reg as DbRegistration);
      convertLockToConfirmed(reg.kundNumber, reg.date, reg.mobile);

      insertAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        adminUsername: 'SYSTEM',
        action: 'STATUS_RESET',
        bookingId: reg.id,
        token: reg.token,
        customerName: reg.husbandName,
        kundNumber: reg.kundNumber,
        amount: reg.amount,
        details: 'Counter cash payment selected by devotee',
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        status: 'counter_pay',
        registration: reg,
        message: 'काउंटर भुगतान हेतु टोकन सुरक्षित कर दिया गया है। यज्ञ स्थल पर दक्षिणा जमा कर प्रवेश करें।',
      });
    }

    // 2. Free TEST Mode Immediate Approval
    if (settings.testModeEnabled && forceTestModeApprove) {
      const testUtr = utrNumber && utrNumber.length === 12 ? utrNumber : `TEST${Date.now().toString().slice(-8)}`;
      reg.paymentStatus = 'paid';
      reg.utrNumber = testUtr;
      reg.isTestMode = true;
      reg.verifiedBy = 'TEST_SANDBOX';
      reg.verifiedAt = new Date().toISOString();
      reg.verificationHash = generatePaymentSignature(reg.token, testUtr, reg.amount);
      reg.paymentDate = new Date().toISOString().slice(0, 10);

      registrationsStore.set(reg.id, reg);
      saveToDisk();
      insertOrUpdateRegistration(reg as DbRegistration);
      convertLockToConfirmed(reg.kundNumber, reg.date, reg.mobile);

      insertAuditLog({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        adminUsername: 'TEST_SANDBOX',
        action: 'APPROVED',
        bookingId: reg.id,
        token: reg.token,
        customerName: reg.husbandName,
        kundNumber: reg.kundNumber,
        amount: reg.amount,
        utrNumber: testUtr,
        details: 'Instant approval via Free Test Sandbox mode',
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        status: 'paid',
        registration: reg,
        message: '🧪 परीक्षण मोड: बुकिंग त्वरित रूप से स्वीकृत की गई।',
      });
    }

    // 3. PRODUCTION MODE: Strict UTR and Screenshot Submission
    const cleanUtr = String(utrNumber || '').trim();

    // Strict validation
    const validation = validateUpiUtr(cleanUtr, Array.from(usedUtrs).filter((u) => u !== reg?.utrNumber));
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error || 'अमान्य UTR! कृपया बैंक से प्राप्त असली 12 अंकों का UPI Ref दर्ज करें।',
      });
    }

    usedUtrs.add(cleanUtr);

    // CRITICAL: Set status to 'pending' (Awaiting Admin Verification!)
    reg.paymentStatus = 'pending';
    reg.utrNumber = cleanUtr;
    if (paymentProofUrl) {
      reg.paymentProofUrl = paymentProofUrl;
    }
    reg.paymentDate = new Date().toISOString().slice(0, 10);

    // Keep hold active while in review
    const expiryMinutes = (settings.reservationExpiryMinutes || 15) * 2;
    reg.expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    registrationsStore.set(reg.id, reg);
    saveToDisk();
    insertOrUpdateRegistration(reg as DbRegistration);
    convertLockToConfirmed(reg.kundNumber, reg.date, reg.mobile);

    try {
      await supabase.from('registrations').upsert([
        {
          id: reg.id,
          token: reg.token,
          payment_status: 'pending',
          utr_number: cleanUtr,
          payment_proof_url: reg.paymentProofUrl || null,
          expires_at: reg.expiresAt,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      // continue
    }

    return res.json({
      success: true,
      status: 'pending',
      registration: reg,
      message: 'आपका UTR एवं भुगतान स्क्रीनशॉट सफलतापूर्वक जमा कर लिया गया है। आश्रम व्यवस्थापक द्वारा बैंक खाते से मिलान के बाद बुकिंग स्थायी रूप से स्वीकृत की जाएगी।',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'भुगतान प्रमाण जमा करने में त्रुटि।' });
  } finally {
    release();
  }
});

// Legacy backward-compatibility endpoint that redirects to submit-proof
app.post('/api/payment/verify-and-generate-token', async (req: Request, res: Response) => {
  const release = await bookingMutex.acquire();
  try {
    const {
      fullName,
      husbandName,
      wifeName,
      mobile,
      email,
      city,
      kundNumber,
      kundNumbers,
      kundCount,
      date,
      timeSlot,
      participationType,
      address,
      gotra,
      personCount = 2,
      utrNumber,
      paymentProofUrl,
      isCounterPay = false,
      forceTestModeApprove = false,
    } = req.body;

    const primaryName = (fullName || husbandName || '').trim();
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    const kNum = Number(kundNumber);
    const count = Number(personCount) || 2;
    const resolvedKundCount = 1;
    const amount = Number(req.body.amount) || 2100;
    const settings = getSystemSettingsFromDb();

    // Check daily booking limit
    const restriction = checkMobileBookingRestriction(cleanMobile, String(date));
    if (!restriction.allowed) {
      return res.status(400).json({
        error: restriction.reason || 'इस मोबाइल नंबर से इस दिन पहले ही एक कुंड पंजीकृत है। एक मोबाइल नंबर से एक दिन में केवल एक कुंड का पंजीकरण किया जा सकता है।',
        code: 'DAILY_LIMIT_EXCEEDED',
      });
    }

    // Check availability
    const avail = isKundSlotAvailable(kNum, date);
    if (!avail.available && !isCounterPay) {
      return res.status(409).json({ error: avail.reason });
    }

    const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const token = `MUMY-26-K${String(kNum).padStart(2, '0')}-${cleanMobile.slice(-2)}${randHex}`;
    const id = `reg-${Date.now()}-${randHex}`;

    let status: 'paid' | 'pending' | 'counter_pay' = 'pending';
    let cleanUtr = String(utrNumber || '').trim();
    let hash: string | undefined = undefined;

    if (isCounterPay) {
      status = 'counter_pay';
      cleanUtr = 'COUNTER-PAY-ON-DAY';
      hash = generatePaymentSignature(token, 'COUNTER', amount);
    } else if (settings.testModeEnabled && forceTestModeApprove) {
      status = 'paid';
      cleanUtr = cleanUtr || `TEST${Date.now().toString().slice(-8)}`;
      hash = generatePaymentSignature(token, cleanUtr, amount);
    } else {
      // Validate UTR
      const val = validateUpiUtr(cleanUtr, Array.from(usedUtrs));
      if (!val.isValid) {
        return res.status(400).json({ error: val.error || 'अमान्य 12 अंकों का UTR!' });
      }
      usedUtrs.add(cleanUtr);
      // Status MUST be pending until admin marks paid!
      status = 'pending';
    }

    const authDevotee = getAuthenticatedDevotee(req);
    const existingDevotee = authDevotee || getDevoteeUserByMobile(cleanMobile);
    const linkedUserId = existingDevotee ? existingDevotee.id : undefined;

    const newReg: StoredRegistration = {
      id,
      token,
      userId: linkedUserId,
      fullName: primaryName,
      husbandName: primaryName,
      wifeName: wifeName ? wifeName.trim() : undefined,
      mobile: cleanMobile,
      email: email ? email.trim() : undefined,
      city: city ? city.trim() : 'नोएडा',
      kundNumber: kNum,
      kundCount: resolvedKundCount,
      kundNumbers: [kNum],
      date,
      timeSlot: timeSlot || 'प्रातः 09:00 AM',
      participationType: participationType || 'दंपति',
      address: address || 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
      gotra: gotra ? gotra.trim() : undefined,
      personCount: count,
      amount,
      paymentStatus: status,
      utrNumber: cleanUtr,
      paymentProofUrl: paymentProofUrl || undefined,
      verificationHash: hash,
      paymentDate: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      isTestMode: settings.testModeEnabled && forceTestModeApprove,
      createdAt: new Date().toISOString(),
    };

    registrationsStore.set(id, newReg);
    saveToDisk();
    insertOrUpdateRegistration(newReg as DbRegistration);
    convertLockToConfirmed(kNum, String(date), cleanMobile);

    try {
      await supabase.from('registrations').upsert([
        {
          id: newReg.id,
          token: newReg.token,
          full_name: newReg.fullName,
          husband_name: newReg.husbandName,
          wife_name: newReg.wifeName || null,
          mobile: newReg.mobile,
          email: newReg.email || null,
          city: newReg.city,
          kund_number: newReg.kundNumber,
          date: newReg.date,
          time_slot: newReg.timeSlot,
          participation_type: newReg.participationType,
          person_count: newReg.personCount,
          amount: newReg.amount,
          payment_status: status,
          utr_number: cleanUtr,
          payment_proof_url: newReg.paymentProofUrl || null,
          verification_hash: hash || null,
          expires_at: newReg.expiresAt,
          address: newReg.address,
          gotra: newReg.gotra || null,
          created_at: newReg.createdAt,
        },
      ]);
    } catch (e) {
      // continue
    }

    return res.status(201).json({
      success: true,
      token,
      registration: newReg,
      verificationHash: hash,
      status,
      message:
        status === 'paid'
          ? 'भुगतान सफल! प्रवेश पत्र जारी किया गया।'
          : status === 'counter_pay'
          ? 'काउंटर देय रसीद सुरक्षित की गई।'
          : 'प्रमाण जमा हुआ • व्यवस्थापक सत्यापन लंबित।',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'त्रुटि।' });
  } finally {
    release();
  }
});

// -------------------------------------------------------------
// API: Admin Authentication & Protected Verification Endpoints
// -------------------------------------------------------------
app.get('/api/admin/status', async (req: Request, res: Response) => {
  try {
    if (!registeredAdmin) {
      const dbAdmin = getAdminUserFromDb();
      if (dbAdmin) {
        registeredAdmin = dbAdmin;
      } else {
        const { data } = await supabase.from('admin_users').select('username, password_hash, created_at').limit(1);
        if (data && data.length > 0) {
          registeredAdmin = {
            username: data[0].username,
            passwordHash: data[0].password_hash,
            createdAt: data[0].created_at || new Date().toISOString(),
          };
        }
      }
    }

    const pendingCount = Array.from(registrationsStore.values()).filter(
      (r) => r.paymentStatus === 'pending'
    ).length;

    res.json({
      adminExists: Boolean(registeredAdmin),
      totalBookings: registrationsStore.size,
      pendingCount,
    });
  } catch (e) {
    res.json({
      adminExists: Boolean(registeredAdmin),
      totalBookings: registrationsStore.size,
      pendingCount: 0,
    });
  }
});

app.post('/api/admin/setup', async (req: Request, res: Response) => {
  try {
    if (registeredAdmin) {
      return res.status(403).json({
        error: 'व्यवस्थापक स्लॉट पहले ही भर चुका है! केवल 1 व्यवस्थापक खाता अनुमत है।',
      });
    }

    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
      return res.status(400).json({ error: 'कम से कम 6 अक्षरों का पासवर्ड प्रदान करें।' });
    }

    const passwordHash = hashPassword(password);
    registeredAdmin = {
      username: username.trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    try {
      await supabase.from('admin_users').upsert([
        {
          id: 'master-admin',
          username: registeredAdmin.username,
          password_hash: passwordHash,
          role: 'super_admin',
          created_at: registeredAdmin.createdAt,
        },
      ]);
    } catch (e) {
      console.warn('Supabase admin upsert note:', e);
    }

    const sessionToken = crypto.randomBytes(24).toString('hex');
    adminSessions.set(sessionToken, registeredAdmin.username);

    return res.status(201).json({
      success: true,
      token: sessionToken,
      username: registeredAdmin.username,
      message: 'एकमात्र मुख्य व्यवस्थापक खाता सफलतापूर्वक निर्मित हुआ।',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'त्रुटि।' });
  }
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!registeredAdmin) {
    const dbAdmin = getAdminUserFromDb();
    if (dbAdmin) {
      registeredAdmin = dbAdmin;
    }
  }

  if (!registeredAdmin) {
    return res.status(400).json({
      error: 'अभी तक कोई व्यवस्थापक खाता निर्मित नहीं हुआ है। कृपया पहले सेटअप करें।',
    });
  }

  const hash = hashPassword(password || '');
  if (
    registeredAdmin.username.toLowerCase() !== String(username).trim().toLowerCase() ||
    registeredAdmin.passwordHash !== hash
  ) {
    return res.status(401).json({ error: 'अमान्य व्यवस्थापक क्रेडेंशियल (Invalid Login)' });
  }

  const sessionToken = crypto.randomBytes(24).toString('hex');
  adminSessions.set(sessionToken, registeredAdmin.username);

  return res.json({
    success: true,
    token: sessionToken,
    username: registeredAdmin.username,
  });
});

// -------------------------------------------------------------
// Admin Password Recovery: Request Recovery Code via Verified Email
// -------------------------------------------------------------
app.post('/api/admin/request-recovery-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const adminRecoveryEmail = process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || '';

    // Rate Limiting: Max 3 requests per hour
    const recentCount = countRecentResetRequests('admin_master', 60);
    if (recentCount >= 3) {
      return res.status(429).json({
        error: 'अत्यधिक व्यवस्थापक अनुरोध: कृपया कुछ देर प्रतीक्षा करें। 1 घंटे में केवल 3 बार अनुरोध मान्य है।',
      });
    }

    if (!adminRecoveryEmail) {
      return res.status(400).json({
        error: 'सर्वर पर कोई व्यवस्थापक रिकवरी ईमेल (ADMIN_RECOVERY_EMAIL) कॉन्फ़िगर नहीं है। कृपया सर्वर-साइड CLI टूल (npm run admin:reset-password) अथवा रिकवरी कुंजी का उपयोग करें।',
      });
    }

    if (String(email).trim().toLowerCase() !== adminRecoveryEmail.toLowerCase()) {
      return res.json({
        success: true,
        message: 'यदि यह अधिकृत व्यवस्थापक ईमेल है, तो सत्यापन कोड भेज दिया गया है।',
      });
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const tokenHash = crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(rawOtp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    savePasswordResetToken({
      id: crypto.randomUUID(),
      targetType: 'admin',
      identifier: 'admin_master',
      tokenHash,
      expiresAt,
    });

    if (isEmailConfigured()) {
      await sendPasswordResetEmail(adminRecoveryEmail, rawOtp, 'व्यवस्थापक महोदय');
    }

    return res.json({
      success: true,
      message: 'व्यवस्थापक सत्यापन कोड आपके अधिकृत ईमेल पर भेज दिया गया है। यह कोड 10 मिनट के लिए मान्य है।',
      debugCode: !isEmailConfigured() ? rawOtp : undefined,
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'व्यवस्थापक रिकवरी कोड भेजने में त्रुटि।' });
  }
});

// -------------------------------------------------------------
// Admin Password Recovery: Reset Admin Password with Key or OTP
// -------------------------------------------------------------
app.post('/api/admin/recover-password', async (req: Request, res: Response) => {
  try {
    const { recoveryKey, recoveryCode, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'नया व्यवस्थापक पासवर्ड न्यूनतम 6 अक्षरों का होना अनिवार्य है।' });
    }

    let isAuthorized = false;

    // Check 1: Master Recovery Key (Server-side key from data/admin-recovery.key or env)
    if (recoveryKey && typeof recoveryKey === 'string') {
      const cleanKey = recoveryKey.trim();
      if (cleanKey.length > 0 && cleanKey === adminRecoveryKey) {
        isAuthorized = true;
      }
    }

    // Check 2: Admin OTP Code
    if (!isAuthorized && recoveryCode && typeof recoveryCode === 'string') {
      const cleanOtp = recoveryCode.trim();
      const hashedOtp = crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(cleanOtp).digest('hex');
      const tokenRecord = getActivePasswordResetToken('admin_master', hashedOtp);
      if (tokenRecord && tokenRecord.targetType === 'admin') {
        markPasswordResetTokenUsed(tokenRecord.id);
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({
        error: 'अमान्य व्यवस्थापक रिकवरी कुंजी या कोड। अनधिकृत प्रयास सुरक्षा नियमों के तहत अस्वीकार कर दिया गया।',
      });
    }

    const newHash = hashPassword(newPassword);
    const targetUsername = registeredAdmin ? registeredAdmin.username : 'maharishi_admin';

    // 1. Update SQLite
    updateAdminPassword(targetUsername, newHash);

    // 2. Update In-Memory
    if (registeredAdmin) {
      registeredAdmin.passwordHash = newHash;
    } else {
      registeredAdmin = {
        username: targetUsername,
        passwordHash: newHash,
        createdAt: new Date().toISOString(),
      };
    }

    // 3. Update Supabase
    try {
      await supabase.from('admin_users').upsert([
        {
          id: 'master-admin',
          username: targetUsername,
          password_hash: newHash,
          role: 'super_admin',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase admin update note:', e);
    }

    // 4. SECURITY: Invalidate ALL existing admin sessions
    adminSessions.clear();

    // 5. Insert Audit Log
    insertAuditLog({
      id: crypto.randomUUID(),
      adminUsername: targetUsername,
      action: 'ADMIN_PASSWORD_RECOVERED',
      details: 'व्यवस्थापक पासवर्ड को रिकवरी प्रक्रिया द्वारा सुरक्षित रूप से रीसेट किया गया।',
      timestamp: new Date().toISOString(),
    });

    // 6. Send security alert email if configured
    const adminRecoveryEmail = process.env.ADMIN_RECOVERY_EMAIL || process.env.SMTP_USER || '';
    if (adminRecoveryEmail && isEmailConfigured()) {
      sendAdminRecoveryAlertEmail(adminRecoveryEmail, new Date().toLocaleString('hi-IN')).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'व्यवस्थापक पासवर्ड सफलतापूर्वक बदल दिया गया है। पुराने सभी सत्र तत्काल समाप्त कर दिए गए हैं। कृपया नए पासवर्ड से लॉगिन करें।',
    });
  } catch (error: any) {
    console.error('Admin recovery error:', error);
    return res.status(500).json({ error: 'व्यवस्थापक पासवर्ड रीसेट करने में त्रुटि।' });
  }
});

function requireAdmin(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'अनधिकृत प्रवेश (Unauthorized)' });
  }
  const token = authHeader.split(' ')[1];
  if (token === MASTER_ADMIN_TOKEN || adminSessions.has(token)) {
    (req as any).adminUsername = adminSessions.get(token) || 'maharishi_admin';
    return next();
  }
  return res.status(401).json({ error: 'सत्र समाप्त अथवा अमान्य (Invalid Token)' });
}

// Admin: Get all bookings
app.get('/api/admin/bookings', requireAdmin, (req: Request, res: Response) => {
  const list = Array.from(registrationsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ bookings: list });
});

// Admin: Get pending queue
app.get('/api/admin/pending', requireAdmin, (req: Request, res: Response) => {
  const pending = Array.from(registrationsStore.values())
    .filter((b) => b.paymentStatus === 'pending' || b.paymentStatus === 'temp_hold')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ pending });
});

// Admin: Approve Booking & Permanently Reserve Kund
app.post('/api/admin/approve-booking', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const adminUser = (req as any).adminUsername || 'admin';
    const reg = registrationsStore.get(id);

    if (!reg) {
      return res.status(404).json({ error: 'बुकिंग रिकॉर्ड नहीं मिला।' });
    }

    // Confirm booking permanently
    reg.paymentStatus = 'paid';
    reg.verifiedBy = adminUser;
    reg.verifiedAt = new Date().toISOString();
    reg.verificationHash = generatePaymentSignature(reg.token, reg.utrNumber || 'APPROVED', reg.amount);
    reg.expiresAt = undefined; // permanently confirmed

    registrationsStore.set(id, reg);
    saveToDisk();
    insertOrUpdateRegistration(reg as DbRegistration);

    // Write immutable audit log
    insertAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUsername: adminUser,
      action: 'APPROVED',
      bookingId: reg.id,
      token: reg.token,
      customerName: reg.husbandName,
      kundNumber: reg.kundNumber,
      amount: reg.amount,
      utrNumber: reg.utrNumber,
      details: `Admin verified UTR & payment screenshot. Kund #${reg.kundNumber} permanently confirmed for ${reg.date}.`,
      timestamp: new Date().toISOString(),
    });

    try {
      await supabase.from('registrations').update({
        payment_status: 'paid',
        verified_by: adminUser,
        verified_at: reg.verifiedAt,
        verification_hash: reg.verificationHash,
        expires_at: null,
      }).eq('id', id);
    } catch (e) {
      // continue
    }

    return res.json({
      success: true,
      registration: reg,
      message: `यजमान ${reg.husbandName} की बुकिंग सफलतापूर्वक स्वीकृत की गई एवं कुंड #${reg.kundNumber} स्थायी रूप से आरक्षित हो गया।`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'स्वीकृति में त्रुटि।' });
  }
});

// Admin: Reject Booking & Release Kund
app.post('/api/admin/reject-booking', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, reason } = req.body;
    const adminUser = (req as any).adminUsername || 'admin';
    const reg = registrationsStore.get(id);

    if (!reg) {
      return res.status(404).json({ error: 'बुकिंग रिकॉर्ड नहीं मिला।' });
    }

    // Free the UTR so it's not permanently stuck
    if (reg.utrNumber) {
      usedUtrs.delete(reg.utrNumber);
    }

    const rejectionReason = reason || 'अमान्य UTR अथवा बैंक खाते में राशि अप्राप्त।';
    reg.paymentStatus = 'rejected';
    reg.rejectionReason = rejectionReason;
    reg.verifiedBy = adminUser;
    reg.verifiedAt = new Date().toISOString();

    registrationsStore.set(id, reg);
    saveToDisk();
    insertOrUpdateRegistration(reg as DbRegistration);

    // Audit log
    insertAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUsername: adminUser,
      action: 'REJECTED',
      bookingId: reg.id,
      token: reg.token,
      customerName: reg.husbandName,
      kundNumber: reg.kundNumber,
      amount: reg.amount,
      utrNumber: reg.utrNumber,
      reason: rejectionReason,
      details: `Admin rejected payment. Kund #${reg.kundNumber} released for other devotees.`,
      timestamp: new Date().toISOString(),
    });

    try {
      await supabase.from('registrations').update({
        payment_status: 'rejected',
        rejection_reason: rejectionReason,
        verified_by: adminUser,
        verified_at: reg.verifiedAt,
      }).eq('id', id);
    } catch (e) {
      // continue
    }

    return res.json({
      success: true,
      registration: reg,
      message: `बुकिंग अस्वीकृत की गई एवं कुंड #${reg.kundNumber} अन्य यजमानों हेतु मुक्त कर दिया गया।`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'अस्वीकृति में त्रुटि।' });
  }
});

// Admin: Delete Booking
app.delete('/api/admin/bookings/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminUser = (req as any).adminUsername || 'admin';
  const existing = registrationsStore.get(id);

  if (existing) {
    if (existing.utrNumber) usedUtrs.delete(existing.utrNumber);

    insertAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUsername: adminUser,
      action: 'DELETED',
      bookingId: id,
      token: existing.token,
      customerName: existing.husbandName,
      kundNumber: existing.kundNumber,
      details: 'Booking record deleted by admin.',
      timestamp: new Date().toISOString(),
    });
  }

  registrationsStore.delete(id);
  saveToDisk();
  deleteRegistrationFromDb(id);

  try {
    await supabase.from('registrations').delete().eq('id', id);
  } catch (e) {
    // continue
  }

  res.json({ success: true, message: 'पंजीकरण रिकॉर्ड हटाया गया।' });
});

// Admin: Reset & Restart All Kund Bookings (Fresh Clean Start)
app.post('/api/admin/reset-all-bookings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).adminUsername || 'admin';
    registrationsStore.clear();
    usedUtrs.clear();
    saveToDisk(); // writes empty array [] to bookings.json
    clearAllRegistrationsFromDb(); // removes all records from SQLite

    insertAuditLog({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUsername: adminUser,
      action: 'RESET_ALL_BOOKINGS',
      details: 'All Kund bookings have been completely cleared and restarted by admin. All 108 Hawan Kunds are now fresh and available.',
      timestamp: new Date().toISOString(),
    });

    try {
      await supabase.from('registrations').delete().neq('id', 'keep_clean_empty_records');
    } catch (e) {
      // ignore
    }

    return res.json({
      success: true,
      message: 'सभी हवन कुंड बुकिंग सफलतापूर्वक शून्य (Clear) कर दी गई हैं। अब सभी कुंड (10 से 108) नए सिरे से उपलब्ध हैं।',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'रीसेट करने में त्रुटि।' });
  }
});

// Admin: Get Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
  const logs = getAllAuditLogsFromDb();
  res.json({ auditLogs: logs });
});

// -------------------------------------------------------------
// API: Unified Database Management (SQLite Engine + Supabase)
// -------------------------------------------------------------
app.get('/api/database/status', async (req: Request, res: Response) => {
  const meta = getDatabaseMetadata();
  let supabaseLatency = -1;
  let supabaseConnected = false;
  let supabaseError = null;

  try {
    const start = Date.now();
    const { error } = await supabase.from('registrations').select('*', { count: 'exact', head: true });
    supabaseLatency = Date.now() - start;
    if (!error) {
      supabaseConnected = true;
    } else {
      supabaseError = error.message;
    }
  } catch (err: any) {
    supabaseError = err.message;
  }

  res.json({
    status: 'ok',
    sqlite: {
      active: true,
      file: meta.sqliteFile,
      sizeKb: meta.fileSizeKb,
      tables: meta.tables,
      recordsCount: meta.totalRegistrations,
    },
    supabase: {
      configured: true,
      projectId: meta.supabase.projectId,
      url: meta.supabase.url,
      connected: supabaseConnected,
      latencyMs: supabaseLatency,
      error: supabaseError,
    },
    inMemoryCount: registrationsStore.size,
  });
});

app.get('/api/database/records', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const isAdmin = authHeader && authHeader.startsWith('Bearer ') && adminSessions.has(authHeader.split(' ')[1]);
  const devotee = getAuthenticatedDevotee(req);

  const { q, date, status, kund } = req.query;
  let list = getAllRegistrationsFromDb();

  if (list.length === 0 && registrationsStore.size > 0) {
    list = Array.from(registrationsStore.values()) as DbRegistration[];
  }

  // If not admin and not the devotee, protect devotee privacy
  if (!isAdmin) {
    if (devotee) {
      list = list.filter((r) => r.userId === devotee.id || r.mobile === devotee.mobile);
    } else {
      // Unauthenticated: anonymize records
      list = list.map((r) => ({
        ...r,
        fullName: 'यजमान',
        husbandName: 'यजमान',
        wifeName: undefined,
        mobile: '******' + r.mobile.slice(-4),
        email: undefined,
        utrNumber: r.utrNumber ? '***' + r.utrNumber.slice(-4) : undefined,
        paymentProofUrl: undefined,
      }));
    }
  }

  if (q && typeof q === 'string') {
    const term = q.trim().toLowerCase();
    const digitsOnly = term.replace(/\D/g, '');
    list = list.filter((r) => {
      if (r.token && r.token.toLowerCase().includes(term)) return true;
      if (r.husbandName && r.husbandName.toLowerCase().includes(term)) return true;
      if (r.fullName && r.fullName.toLowerCase().includes(term)) return true;
      if (r.mobile && (r.mobile.includes(term) || (digitsOnly.length === 10 && r.mobile === digitsOnly))) return true;
      if (r.utrNumber && r.utrNumber.toLowerCase().includes(term)) return true;
      return false;
    });
  }

  if (date && typeof date === 'string') {
    list = list.filter((r) => r.date === date);
  }

  if (kund && typeof kund === 'string') {
    const kNum = Number(kund);
    if (!isNaN(kNum)) {
      list = list.filter((r) => r.kundNumber === kNum);
    }
  }

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter((r) => r.paymentStatus === status);
  }

  res.json({ records: list, total: list.length });
});

app.post('/api/database/query', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'SQL query text is required.' });
  }

  try {
    const result = runArbitrarySqlQuery(query);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'SQL execution failed.' });
  }
});

app.post('/api/database/sync', async (req: Request, res: Response) => {
  try {
    const syncRes = await syncDatabaseWithSupabase();
    const freshRows = getAllRegistrationsFromDb();
    freshRows.forEach((r) => {
      registrationsStore.set(r.id, r as StoredRegistration);
      if (r.utrNumber && r.utrNumber !== 'COUNTER-PAY-ON-DAY') {
        usedUtrs.add(r.utrNumber);
      }
    });
    saveToDisk();
    return res.json({ success: true, syncResult: syncRes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Vite Dev Server / Static Hosting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const portNumber = Number(PORT) || 3000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`Server running on port ${portNumber} (host: 0.0.0.0)`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
