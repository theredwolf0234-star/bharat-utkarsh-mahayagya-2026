import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'yagya.sqlite');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpbnsolzmrsyoddxzaqj.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_WW-vmr513N7070fDU-unOA__9Jl0lCe';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let dbInstance: any = null;
let isInitialized = false;

export interface DbRegistration {
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
  date: string;
  timeSlot?: string;
  participationType?: string;
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
  address?: string;
  gotra?: string;
  createdAt: string;
}

export interface DbDevoteeUser {
  id: string;
  fullName: string;
  mobile: string;
  passwordHash: string;
  email?: string;
  city?: string;
  gotra?: string;
  createdAt: string;
}

export interface DbAuditLog {
  id: string;
  adminUsername: string;
  action: string;
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

export interface DbSystemSettings {
  reservationExpiryMinutes: number;
  testModeEnabled: boolean;
  upiId: string;
  pricePerPerson: number;
}

export async function initSqliteDatabase() {
  if (isInitialized && dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(SQLITE_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(SQLITE_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing SQLite file, creating fresh DB:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create SQLite Schema with all required tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      husband_name TEXT NOT NULL,
      wife_name TEXT,
      mobile TEXT NOT NULL,
      email TEXT,
      city TEXT DEFAULT 'नोएडा',
      kund_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT DEFAULT 'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
      participation_type TEXT DEFAULT 'दंपति (पति और पत्नी - 2 व्यक्ति)',
      person_count INTEGER DEFAULT 2,
      amount INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      utr_number TEXT,
      payment_proof_url TEXT,
      verification_hash TEXT,
      payment_date TEXT,
      expires_at TEXT,
      verified_by TEXT,
      verified_at TEXT,
      rejection_reason TEXT,
      is_test_mode INTEGER DEFAULT 0,
      address TEXT,
      gotra TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reg_token ON registrations(token);
    CREATE INDEX IF NOT EXISTS idx_reg_mobile ON registrations(mobile);
    CREATE INDEX IF NOT EXISTS idx_reg_date_kund ON registrations(date, kund_number);
    CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations(payment_status);

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY DEFAULT 'master-admin',
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'super_admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devotee_users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      city TEXT DEFAULT 'नोएडा',
      gotra TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_devotee_mobile ON devotee_users(mobile);
  `);

  // Migrate existing table columns if opened from older disk version
  const colsToAdd = [
    { name: 'user_id', type: 'TEXT' },
    { name: 'expires_at', type: 'TEXT' },
    { name: 'verified_by', type: 'TEXT' },
    { name: 'verified_at', type: 'TEXT' },
    { name: 'rejection_reason', type: 'TEXT' },
    { name: 'is_test_mode', type: 'INTEGER DEFAULT 0' },
    { name: 'payment_proof_url', type: 'TEXT' },
  ];
  colsToAdd.forEach((col) => {
    try {
      dbInstance.run(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.type};`);
    } catch (e) {
      // Column already exists
    }
  });

  dbInstance.run(`

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      booking_id TEXT,
      token TEXT,
      customer_name TEXT,
      kund_number INTEGER,
      amount INTEGER,
      utr_number TEXT,
      reason TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      reservation_expiry_minutes INTEGER DEFAULT 15,
      test_mode_enabled INTEGER DEFAULT 0,
      upi_id TEXT DEFAULT 'maharishivedvigyan@sbi',
      price_per_person INTEGER DEFAULT 1100
    );

    INSERT OR IGNORE INTO system_settings (id, reservation_expiry_minutes, test_mode_enabled, upi_id, price_per_person)
    VALUES ('default', 15, 0, 'maharishivedvigyan@sbi', 1100);
  `);

  saveSqliteToDisk();
  isInitialized = true;
  return dbInstance;
}

export function saveSqliteToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(SQLITE_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export function insertOrUpdateRegistration(reg: DbRegistration) {
  if (!dbInstance) return false;

  const stmt = dbInstance.prepare(`
    INSERT INTO registrations (
      id, token, user_id, full_name, husband_name, wife_name, mobile, email, city,
      kund_number, date, time_slot, participation_type, person_count, amount,
      payment_status, utr_number, payment_proof_url, verification_hash,
      payment_date, expires_at, verified_by, verified_at, rejection_reason,
      is_test_mode, address, gotra, created_at
    ) VALUES (
      :id, :token, :user_id, :full_name, :husband_name, :wife_name, :mobile, :email, :city,
      :kund_number, :date, :time_slot, :participation_type, :person_count, :amount,
      :payment_status, :utr_number, :payment_proof_url, :verification_hash,
      :payment_date, :expires_at, :verified_by, :verified_at, :rejection_reason,
      :is_test_mode, :address, :gotra, :created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      token = excluded.token,
      user_id = COALESCE(excluded.user_id, registrations.user_id),
      full_name = excluded.full_name,
      husband_name = excluded.husband_name,
      wife_name = excluded.wife_name,
      mobile = excluded.mobile,
      email = excluded.email,
      city = excluded.city,
      kund_number = excluded.kund_number,
      date = excluded.date,
      time_slot = excluded.time_slot,
      participation_type = excluded.participation_type,
      person_count = excluded.person_count,
      amount = excluded.amount,
      payment_status = excluded.payment_status,
      utr_number = excluded.utr_number,
      payment_proof_url = excluded.payment_proof_url,
      verification_hash = excluded.verification_hash,
      payment_date = excluded.payment_date,
      expires_at = excluded.expires_at,
      verified_by = excluded.verified_by,
      verified_at = excluded.verified_at,
      rejection_reason = excluded.rejection_reason,
      is_test_mode = excluded.is_test_mode,
      address = excluded.address,
      gotra = excluded.gotra;
  `);

  stmt.run({
    ':id': reg.id,
    ':token': reg.token,
    ':user_id': reg.userId || null,
    ':full_name': reg.fullName || reg.husbandName,
    ':husband_name': reg.husbandName,
    ':wife_name': reg.wifeName || null,
    ':mobile': reg.mobile,
    ':email': reg.email || null,
    ':city': reg.city || 'नोएडा',
    ':kund_number': reg.kundNumber,
    ':date': reg.date,
    ':time_slot': reg.timeSlot || 'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
    ':participation_type': reg.participationType || 'दंपति',
    ':person_count': reg.personCount,
    ':amount': reg.amount,
    ':payment_status': reg.paymentStatus,
    ':utr_number': reg.utrNumber || null,
    ':payment_proof_url': reg.paymentProofUrl || null,
    ':verification_hash': reg.verificationHash || null,
    ':payment_date': reg.paymentDate || null,
    ':expires_at': reg.expiresAt || null,
    ':verified_by': reg.verifiedBy || null,
    ':verified_at': reg.verifiedAt || null,
    ':rejection_reason': reg.rejectionReason || null,
    ':is_test_mode': reg.isTestMode ? 1 : 0,
    ':address': reg.address || null,
    ':gotra': reg.gotra || null,
    ':created_at': reg.createdAt || new Date().toISOString(),
  });
  stmt.free();

  saveSqliteToDisk();
  return true;
}

export function getAllRegistrationsFromDb(): DbRegistration[] {
  if (!dbInstance) return [];

  try {
    const res = dbInstance.exec(`
      SELECT 
        id, token, user_id, full_name, husband_name, wife_name, mobile, email, city,
        kund_number, date, time_slot, participation_type, person_count, amount,
        payment_status, utr_number, payment_proof_url, verification_hash,
        payment_date, expires_at, verified_by, verified_at, rejection_reason,
        is_test_mode, address, gotra, created_at
      FROM registrations
      ORDER BY datetime(created_at) DESC
    `);

    if (!res || res.length === 0) return [];

    const { columns, values } = res[0];
    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });

      return {
        id: obj.id,
        token: obj.token,
        userId: obj.user_id || undefined,
        fullName: obj.full_name,
        husbandName: obj.husband_name,
        wifeName: obj.wife_name || undefined,
        mobile: obj.mobile,
        email: obj.email || undefined,
        city: obj.city || 'नोएडा',
        kundNumber: Number(obj.kund_number),
        date: obj.date,
        timeSlot: obj.time_slot,
        participationType: obj.participation_type,
        personCount: Number(obj.person_count || 2),
        amount: Number(obj.amount),
        paymentStatus: obj.payment_status as any,
        utrNumber: obj.utr_number || undefined,
        paymentProofUrl: obj.payment_proof_url || undefined,
        verificationHash: obj.verification_hash || undefined,
        paymentDate: obj.payment_date || undefined,
        expiresAt: obj.expires_at || undefined,
        verifiedBy: obj.verified_by || undefined,
        verifiedAt: obj.verified_at || undefined,
        rejectionReason: obj.rejection_reason || undefined,
        isTestMode: Boolean(obj.is_test_mode),
        address: obj.address || undefined,
        gotra: obj.gotra || undefined,
        createdAt: obj.created_at,
      };
    });
  } catch (err) {
    console.error('Error fetching registrations from SQLite:', err);
    return [];
  }
}

// Devotee User Account Functions
export function insertDevoteeUser(user: DbDevoteeUser): boolean {
  if (!dbInstance) return false;
  try {
    const stmt = dbInstance.prepare(`
      INSERT INTO devotee_users (id, full_name, mobile, password_hash, email, city, gotra, created_at)
      VALUES (:id, :full_name, :mobile, :password_hash, :email, :city, :gotra, :created_at)
      ON CONFLICT(mobile) DO UPDATE SET
        full_name = excluded.full_name,
        password_hash = excluded.password_hash,
        email = excluded.email,
        city = excluded.city,
        gotra = excluded.gotra;
    `);
    stmt.run({
      ':id': user.id,
      ':full_name': user.fullName,
      ':mobile': user.mobile,
      ':password_hash': user.passwordHash,
      ':email': user.email || null,
      ':city': user.city || 'नोएडा',
      ':gotra': user.gotra || null,
      ':created_at': user.createdAt,
    });
    stmt.free();
    saveSqliteToDisk();
    return true;
  } catch (e) {
    console.error('Error inserting devotee user:', e);
    return false;
  }
}

export function getDevoteeUserByMobile(mobile: string): DbDevoteeUser | null {
  if (!dbInstance) return null;
  try {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const stmt = dbInstance.prepare(`SELECT * FROM devotee_users WHERE mobile = :mobile LIMIT 1`);
    stmt.bind({ ':mobile': cleanMobile });
    let user: DbDevoteeUser | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      user = {
        id: String(row.id),
        fullName: String(row.full_name),
        mobile: String(row.mobile),
        passwordHash: String(row.password_hash),
        email: row.email ? String(row.email) : undefined,
        city: row.city ? String(row.city) : undefined,
        gotra: row.gotra ? String(row.gotra) : undefined,
        createdAt: String(row.created_at),
      };
    }
    stmt.free();
    return user;
  } catch (e) {
    console.error('Error finding devotee by mobile:', e);
    return null;
  }
}

export function getDevoteeUserById(id: string): DbDevoteeUser | null {
  if (!dbInstance) return null;
  try {
    const stmt = dbInstance.prepare(`SELECT * FROM devotee_users WHERE id = :id LIMIT 1`);
    stmt.bind({ ':id': id });
    let user: DbDevoteeUser | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      user = {
        id: String(row.id),
        fullName: String(row.full_name),
        mobile: String(row.mobile),
        passwordHash: String(row.password_hash),
        email: row.email ? String(row.email) : undefined,
        city: row.city ? String(row.city) : undefined,
        gotra: row.gotra ? String(row.gotra) : undefined,
        createdAt: String(row.created_at),
      };
    }
    stmt.free();
    return user;
  } catch (e) {
    console.error('Error finding devotee by id:', e);
    return null;
  }
}

// Devotee private tickets - ONLY returns tickets belonging to this devotee
export function getDevoteePrivateTickets(userId?: string, mobile?: string): DbRegistration[] {
  if (!dbInstance) return [];
  try {
    const cleanMobile = mobile ? mobile.replace(/\D/g, '').slice(-10) : '';
    let query = `
      SELECT 
        id, token, user_id, full_name, husband_name, wife_name, mobile, email, city,
        kund_number, date, time_slot, participation_type, person_count, amount,
        payment_status, utr_number, payment_proof_url, verification_hash,
        payment_date, expires_at, verified_by, verified_at, rejection_reason,
        is_test_mode, address, gotra, created_at
      FROM registrations 
      WHERE 1=0
    `;
    const params: any = {};
    if (userId && cleanMobile) {
      query = `
        SELECT 
          id, token, user_id, full_name, husband_name, wife_name, mobile, email, city,
          kund_number, date, time_slot, participation_type, person_count, amount,
          payment_status, utr_number, payment_proof_url, verification_hash,
          payment_date, expires_at, verified_by, verified_at, rejection_reason,
          is_test_mode, address, gotra, created_at
        FROM registrations 
        WHERE user_id = :userId OR mobile = :mobile 
        ORDER BY datetime(created_at) DESC
      `;
      params[':userId'] = userId;
      params[':mobile'] = cleanMobile;
    } else if (userId) {
      query = `
        SELECT 
          id, token, user_id, full_name, husband_name, wife_name, mobile, email, city,
          kund_number, date, time_slot, participation_type, person_count, amount,
          payment_status, utr_number, payment_proof_url, verification_hash,
          payment_date, expires_at, verified_by, verified_at, rejection_reason,
          is_test_mode, address, gotra, created_at
        FROM registrations 
        WHERE user_id = :userId 
        ORDER BY datetime(created_at) DESC
      `;
      params[':userId'] = userId;
    } else if (cleanMobile) {
      query = `
        SELECT 
          id, token, user_id, full_name, husband_name, wife_name, mobile, email, city,
          kund_number, date, time_slot, participation_type, person_count, amount,
          payment_status, utr_number, payment_proof_url, verification_hash,
          payment_date, expires_at, verified_by, verified_at, rejection_reason,
          is_test_mode, address, gotra, created_at
        FROM registrations 
        WHERE mobile = :mobile 
        ORDER BY datetime(created_at) DESC
      `;
      params[':mobile'] = cleanMobile;
    }

    const stmt = dbInstance.prepare(query);
    stmt.bind(params);
    const results: DbRegistration[] = [];
    while (stmt.step()) {
      const obj = stmt.getAsObject();
      results.push({
        id: String(obj.id),
        token: String(obj.token),
        userId: obj.user_id ? String(obj.user_id) : undefined,
        fullName: String(obj.full_name),
        husbandName: String(obj.husband_name),
        wifeName: obj.wife_name ? String(obj.wife_name) : undefined,
        mobile: String(obj.mobile),
        email: obj.email ? String(obj.email) : undefined,
        city: obj.city ? String(obj.city) : 'नोएडा',
        kundNumber: Number(obj.kund_number),
        date: String(obj.date),
        timeSlot: obj.time_slot ? String(obj.time_slot) : undefined,
        participationType: obj.participation_type ? String(obj.participation_type) : undefined,
        personCount: Number(obj.person_count || 2),
        amount: Number(obj.amount),
        paymentStatus: obj.payment_status as any,
        utrNumber: obj.utr_number ? String(obj.utr_number) : undefined,
        paymentProofUrl: obj.payment_proof_url ? String(obj.payment_proof_url) : undefined,
        verificationHash: obj.verification_hash ? String(obj.verification_hash) : undefined,
        paymentDate: obj.payment_date ? String(obj.payment_date) : undefined,
        expiresAt: obj.expires_at ? String(obj.expires_at) : undefined,
        verifiedBy: obj.verified_by ? String(obj.verified_by) : undefined,
        verifiedAt: obj.verified_at ? String(obj.verified_at) : undefined,
        rejectionReason: obj.rejection_reason ? String(obj.rejection_reason) : undefined,
        isTestMode: Boolean(obj.is_test_mode),
        address: obj.address ? String(obj.address) : undefined,
        gotra: obj.gotra ? String(obj.gotra) : undefined,
        createdAt: String(obj.created_at),
      });
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error('Error fetching private tickets:', e);
    return [];
  }
}

export function deleteRegistrationFromDb(id: string): boolean {
  if (!dbInstance) return false;
  try {
    dbInstance.run('DELETE FROM registrations WHERE id = ?;', [id]);
    saveSqliteToDisk();
    return true;
  } catch (e) {
    console.error('Delete error in SQLite:', e);
    return false;
  }
}

export function clearAllRegistrationsFromDb(): boolean {
  if (!dbInstance) return false;
  try {
    dbInstance.run('DELETE FROM registrations;');
    saveSqliteToDisk();
    return true;
  } catch (e) {
    console.error('Clear all registrations error in SQLite:', e);
    return false;
  }
}

export function insertAuditLog(log: DbAuditLog): boolean {
  if (!dbInstance) return false;
  try {
    const stmt = dbInstance.prepare(`
      INSERT INTO audit_logs (
        id, admin_username, action, booking_id, token, customer_name,
        kund_number, amount, utr_number, reason, details, timestamp
      ) VALUES (
        :id, :admin_username, :action, :booking_id, :token, :customer_name,
        :kund_number, :amount, :utr_number, :reason, :details, :timestamp
      );
    `);
    stmt.run({
      ':id': log.id,
      ':admin_username': log.adminUsername,
      ':action': log.action,
      ':booking_id': log.bookingId || null,
      ':token': log.token || null,
      ':customer_name': log.customerName || null,
      ':kund_number': log.kundNumber || null,
      ':amount': log.amount || null,
      ':utr_number': log.utrNumber || null,
      ':reason': log.reason || null,
      ':details': log.details || null,
      ':timestamp': log.timestamp,
    });
    stmt.free();
    saveSqliteToDisk();
    return true;
  } catch (e) {
    console.error('Insert audit log error in SQLite:', e);
    return false;
  }
}

export function getAllAuditLogsFromDb(): DbAuditLog[] {
  if (!dbInstance) return [];
  try {
    const res = dbInstance.exec(`
      SELECT 
        id, admin_username, action, booking_id, token, customer_name,
        kund_number, amount, utr_number, reason, details, timestamp
      FROM audit_logs
      ORDER BY datetime(timestamp) DESC
      LIMIT 100;
    `);
    if (!res || res.length === 0) return [];
    const { columns, values } = res[0];
    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return {
        id: obj.id,
        adminUsername: obj.admin_username,
        action: obj.action,
        bookingId: obj.booking_id || undefined,
        token: obj.token || undefined,
        customerName: obj.customer_name || undefined,
        kundNumber: obj.kund_number ? Number(obj.kund_number) : undefined,
        amount: obj.amount ? Number(obj.amount) : undefined,
        utrNumber: obj.utr_number || undefined,
        reason: obj.reason || undefined,
        details: obj.details || undefined,
        timestamp: obj.timestamp,
      };
    });
  } catch (e) {
    return [];
  }
}

export function getSystemSettingsFromDb(): DbSystemSettings {
  if (!dbInstance) {
    return { reservationExpiryMinutes: 15, testModeEnabled: false, upiId: 'maharishivedvigyan@sbi', pricePerPerson: 1100 };
  }
  try {
    const res = dbInstance.exec('SELECT reservation_expiry_minutes, test_mode_enabled, upi_id, price_per_person FROM system_settings WHERE id = "default" LIMIT 1;');
    if (res && res.length > 0 && res[0].values.length > 0) {
      const row = res[0].values[0];
      return {
        reservationExpiryMinutes: Number(row[0]) || 15,
        testModeEnabled: Boolean(row[1]),
        upiId: String(row[2] || 'maharishivedvigyan@sbi'),
        pricePerPerson: Number(row[3]) || 1100,
      };
    }
  } catch (e) {
    // continue
  }
  return { reservationExpiryMinutes: 15, testModeEnabled: false, upiId: 'maharishivedvigyan@sbi', pricePerPerson: 1100 };
}

export function updateSystemSettingsInDb(settings: Partial<DbSystemSettings>): boolean {
  if (!dbInstance) return false;
  try {
    const current = getSystemSettingsFromDb();
    const updated = { ...current, ...settings };
    dbInstance.run(`
      INSERT INTO system_settings (id, reservation_expiry_minutes, test_mode_enabled, upi_id, price_per_person)
      VALUES ('default', ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        reservation_expiry_minutes = excluded.reservation_expiry_minutes,
        test_mode_enabled = excluded.test_mode_enabled,
        upi_id = excluded.upi_id,
        price_per_person = excluded.price_per_person;
    `, [
      updated.reservationExpiryMinutes,
      updated.testModeEnabled ? 1 : 0,
      updated.upiId,
      updated.pricePerPerson,
    ]);
    saveSqliteToDisk();
    return true;
  } catch (e) {
    console.error('Update system settings error:', e);
    return false;
  }
}

export function runArbitrarySqlQuery(query: string): { columns: string[]; values: any[][] } {
  if (!dbInstance) {
    throw new Error('Database is not initialized.');
  }

  const trimmed = query.trim();
  const res = dbInstance.exec(trimmed);
  if (!res || res.length === 0) {
    return { columns: ['status'], values: [['Query executed successfully. (0 rows returned)']] };
  }
  return {
    columns: res[0].columns,
    values: res[0].values,
  };
}

export function getDatabaseMetadata() {
  const fileExists = fs.existsSync(SQLITE_FILE);
  let fileSizeKb = 0;
  if (fileExists) {
    try {
      fileSizeKb = Math.round(fs.statSync(SQLITE_FILE).size / 1024);
    } catch (e) {
      fileSizeKb = 0;
    }
  }

  let totalCount = 0;
  try {
    if (dbInstance) {
      const res = dbInstance.exec('SELECT COUNT(*) as count FROM registrations');
      if (res && res.length > 0 && res[0].values.length > 0) {
        totalCount = Number(res[0].values[0][0]);
      }
    }
  } catch (e) {
    // continue
  }

  return {
    engine: 'SQLite (WASM Embedded) + Supabase PostgreSQL',
    sqliteFile: 'data/yagya.sqlite',
    fileSizeKb,
    tables: ['registrations', 'admin_users', 'audit_logs', 'system_settings'],
    totalRegistrations: totalCount,
    supabase: {
      projectId: 'zpbnsolzmrsyoddxzaqj',
      url: SUPABASE_URL,
      keyConfigured: Boolean(SUPABASE_ANON_KEY),
    },
  };
}

export async function syncDatabaseWithSupabase() {
  let syncedFromSupabase = 0;
  let syncedToSupabase = 0;

  try {
    // 1. Fetch remote rows from Supabase
    const { data: remoteRows, error } = await supabase
      .from('registrations')
      .select('*');

    if (!error && remoteRows && Array.isArray(remoteRows)) {
      for (const row of remoteRows) {
        const item: DbRegistration = {
          id: row.id,
          token: row.token,
          fullName: row.full_name || row.husband_name,
          husbandName: row.husband_name || row.full_name || 'यजमान',
          wifeName: row.wife_name || undefined,
          mobile: row.mobile,
          email: row.email || undefined,
          city: row.city || 'नोएडा',
          kundNumber: Number(row.kund_number),
          date: row.date,
          timeSlot: row.time_slot,
          participationType: row.participation_type,
          personCount: Number(row.person_count || 2),
          amount: Number(row.amount || 2200),
          paymentStatus: row.payment_status || 'pending',
          utrNumber: row.utr_number || undefined,
          paymentProofUrl: row.payment_proof_url || undefined,
          verificationHash: row.verification_hash || undefined,
          paymentDate: row.payment_date || undefined,
          expiresAt: row.expires_at || undefined,
          verifiedBy: row.verified_by || undefined,
          verifiedAt: row.verified_at || undefined,
          rejectionReason: row.rejection_reason || undefined,
          isTestMode: Boolean(row.is_test_mode),
          address: row.address,
          gotra: row.gotra || undefined,
          createdAt: row.created_at || new Date().toISOString(),
        };
        insertOrUpdateRegistration(item);
        syncedFromSupabase++;
      }
    }

    // 2. Push any local SQLite rows not in Supabase
    const localAll = getAllRegistrationsFromDb();
    for (const loc of localAll) {
      try {
        const { error: upsertErr } = await supabase.from('registrations').upsert([
          {
            id: loc.id,
            token: loc.token,
            full_name: loc.fullName || loc.husbandName,
            husband_name: loc.husbandName,
            wife_name: loc.wifeName || null,
            mobile: loc.mobile,
            email: loc.email || null,
            city: loc.city || 'नोएडा',
            kund_number: loc.kundNumber,
            date: loc.date,
            time_slot: loc.timeSlot || 'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
            participation_type: loc.participationType || 'दंपति',
            person_count: loc.personCount,
            amount: loc.amount,
            payment_status: loc.paymentStatus,
            utr_number: loc.utrNumber || null,
            payment_proof_url: loc.paymentProofUrl || null,
            verification_hash: loc.verificationHash || null,
            payment_date: loc.paymentDate || null,
            expires_at: loc.expiresAt || null,
            verified_by: loc.verifiedBy || null,
            verified_at: loc.verifiedAt || null,
            rejection_reason: loc.rejectionReason || null,
            is_test_mode: loc.isTestMode,
            address: loc.address || null,
            gotra: loc.gotra || null,
            created_at: loc.createdAt,
          },
        ]);
        if (!upsertErr) {
          syncedToSupabase++;
        }
      } catch (e) {
        // continue
      }
    }

    return {
      success: true,
      syncedFromSupabase,
      syncedToSupabase,
      totalLocal: localAll.length,
    };
  } catch (err: any) {
    console.error('Database sync error:', err);
    return {
      success: false,
      error: err?.message || 'सिंक के दौरान त्रुटि हुई',
      syncedFromSupabase,
      syncedToSupabase,
    };
  }
}
