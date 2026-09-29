import { createClient } from '@supabase/supabase-js';
import { Registration, AuditLog, SystemSettings } from '../types/yagya';

export const SUPABASE_PROJECT_ID = 'zpbnsolzmrsyoddxzaqj';
export const SUPABASE_URL = 'https://zpbnsolzmrsyoddxzaqj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_WW-vmr513N7070fDU-unOA__9Jl0lCe';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
  },
});

/**
 * Format registration object to Supabase schema columns
 */
export function formatToSupabaseRecord(r: Registration) {
  return {
    id: r.id,
    token: r.token,
    full_name: r.fullName || r.husbandName,
    husband_name: r.husbandName,
    wife_name: r.wifeName || null,
    mobile: r.mobile,
    email: r.email || null,
    city: r.city || 'नोएडा',
    kund_number: Number(r.kundNumber),
    date: r.date,
    time_slot: r.timeSlot || 'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
    participation_type: r.participationType || 'दंपति (पति और पत्नी - 2 व्यक्ति)',
    person_count: Number(r.personCount || 2),
    amount: Number(r.amount),
    payment_status: r.paymentStatus || 'pending',
    utr_number: r.utrNumber || null,
    payment_proof_url: r.paymentProofUrl || null,
    verification_hash: r.verificationHash || null,
    payment_date: r.paymentDate || null,
    expires_at: r.expiresAt || null,
    verified_by: r.verifiedBy || null,
    verified_at: r.verifiedAt || null,
    rejection_reason: r.rejectionReason || null,
    is_test_mode: Boolean(r.isTestMode),
    address: r.address || 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
    gotra: r.gotra || null,
    created_at: r.createdAt || new Date().toISOString(),
  };
}

/**
 * Format Supabase database row back to frontend Registration interface
 */
export function formatFromSupabaseRecord(row: any): Registration {
  return {
    id: row.id,
    token: row.token,
    fullName: row.full_name || row.husband_name || row.husbandName || 'यजमान',
    husbandName: row.husband_name || row.husbandName || row.full_name || 'यजमान',
    wifeName: row.wife_name || row.wifeName || undefined,
    mobile: row.mobile || '',
    email: row.email || undefined,
    city: row.city || 'नोएडा',
    kundNumber: Number(row.kund_number || row.kundNumber),
    date: row.date,
    timeSlot: row.time_slot || row.timeSlot || 'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
    participationType: row.participation_type || row.participationType || 'दंपति',
    personCount: Number(row.person_count || row.personCount || 2),
    amount: Number(row.amount || 2200),
    paymentStatus: row.payment_status || row.paymentStatus || 'pending',
    utrNumber: row.utr_number || row.utrNumber || undefined,
    paymentProofUrl: row.payment_proof_url || row.paymentProofUrl || undefined,
    verificationHash: row.verification_hash || row.verificationHash || undefined,
    paymentDate: row.payment_date || row.paymentDate || undefined,
    expiresAt: row.expires_at || row.expiresAt || undefined,
    verifiedBy: row.verified_by || row.verifiedBy || undefined,
    verifiedAt: row.verified_at || row.verifiedAt || undefined,
    rejectionReason: row.rejection_reason || row.rejectionReason || undefined,
    isTestMode: Boolean(row.is_test_mode || row.isTestMode),
    address: row.address || 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
    gotra: row.gotra || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Save registration to Supabase with error catching
 */
export async function saveRegistrationToSupabase(reg: Registration): Promise<boolean> {
  try {
    const record = formatToSupabaseRecord(reg);
    const { error } = await supabase.from('registrations').upsert([record], {
      onConflict: 'id',
    });

    if (error) {
      console.warn('Supabase upsert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase connection note:', err);
    return false;
  }
}

/**
 * Fetch registrations from Supabase
 */
export async function fetchRegistrationsFromSupabase(): Promise<Registration[] | null> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch note:', error.message);
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map(formatFromSupabaseRecord);
    }
    return null;
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Upload payment screenshot proof directly to Supabase storage bucket
 */
export async function uploadScreenshotToStorage(
  file: File,
  token: string
): Promise<{ url?: string; error?: string }> {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `receipts/${token}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      // Fallback: If bucket is not created yet, return local base64 preview
      console.warn('Supabase storage upload note:', error.message);
      return { error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.warn('Screenshot upload exception:', err);
    return { error: err.message };
  }
}

/**
 * Fetch Audit Logs
 */
export async function fetchAuditLogsFromSupabase(): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      adminUsername: d.admin_username,
      action: d.action,
      bookingId: d.booking_id,
      token: d.token,
      customerName: d.customer_name,
      kundNumber: d.kund_number,
      amount: d.amount,
      utrNumber: d.utr_number,
      reason: d.reason,
      details: d.details,
      timestamp: d.created_at,
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Log Audit action
 */
export async function logAuditAction(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    await supabase.from('audit_logs').insert([
      {
        admin_username: entry.adminUsername,
        action: entry.action,
        booking_id: entry.bookingId,
        token: entry.token,
        customer_name: entry.customerName,
        kund_number: entry.kundNumber,
        amount: entry.amount,
        utr_number: entry.utrNumber,
        reason: entry.reason,
        details: entry.details,
      },
    ]);
  } catch (e) {
    console.warn('Audit log write note:', e);
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- MAHARISHI BHARAT UTKARSH MAHA YAGYA 2026 - FULL SUPABASE SQL SCHEMA
-- Project ID: zpbnsolzmrsyoddxzaqj
-- Project URL: https://zpbnsolzmrsyoddxzaqj.supabase.co
-- ==============================================================================

-- 1. Create table for registrations with temporary holds & admin verification
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    husband_name TEXT NOT NULL,
    wife_name TEXT,
    mobile TEXT NOT NULL,
    email TEXT,
    city TEXT DEFAULT 'नोएडा',
    kund_number INTEGER NOT NULL CHECK (kund_number >= 1 AND kund_number <= 108),
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL DEFAULT 'प्रातः 08:00 AM से 11:00 AM (प्रथम सत्र)',
    participation_type TEXT DEFAULT 'दंपति (पति और पत्नी - 2 व्यक्ति)',
    person_count INTEGER NOT NULL DEFAULT 2,
    amount INTEGER NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'rejected', 'counter_pay', 'expired', 'temp_hold')),
    utr_number TEXT,
    payment_proof_url TEXT,
    verification_hash TEXT,
    payment_date TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    is_test_mode BOOLEAN DEFAULT false,
    address TEXT DEFAULT 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
    gotra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for anti-double booking and fast lookups
CREATE INDEX IF NOT EXISTS idx_registrations_token ON public.registrations(token);
CREATE INDEX IF NOT EXISTS idx_registrations_mobile ON public.registrations(mobile);
CREATE INDEX IF NOT EXISTS idx_registrations_date_kund ON public.registrations(date, kund_number);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(payment_status);

-- 3. System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    reservation_expiry_minutes INTEGER NOT NULL DEFAULT 15,
    test_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    upi_id TEXT NOT NULL DEFAULT 'maharishivedvigyan@sbi',
    price_per_person INTEGER NOT NULL DEFAULT 1100,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY DEFAULT 'master-admin',
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public registrations access" ON public.registrations FOR ALL USING (true);
CREATE POLICY "Public admin access" ON public.admin_users FOR ALL USING (true);
CREATE POLICY "Public audit access" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Public settings access" ON public.system_settings FOR ALL USING (true);
`;
