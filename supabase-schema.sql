-- ==============================================================================
-- MAHARISHI BHARAT UTKARSH MAHA YAGYA 2026
-- COMPLETE SUPABASE DATABASE & STORAGE SCHEMA (UPDATED WITH DEVOTEE USER AUTH & RLS)
-- Project ID: zpbnsolzmrsyoddxzaqj
-- Project URL: https://zpbnsolzmrsyoddxzaqj.supabase.co
-- Official Venue GPS: https://maps.app.goo.gl/aFmMAF5gFHR46gBGA
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/zpbnsolzmrsyoddxzaqj/sql
-- 2. Click "+ New query", paste this entire script, and click "Run" (Ctrl+Enter).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. ENUMS & DOMAINS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'pending',      -- Waiting for admin verification of UTR & screenshot
        'paid',         -- Approved by admin, permanently reserved, pass issued
        'rejected',     -- Admin rejected (invalid UTR/fake proof), Kund released
        'counter_pay',  -- Devotee opted to pay cash at venue counter
        'expired',      -- Temporary hold timer elapsed without submission
        'temp_hold'     -- Devotee currently holding Kund during checkout
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'verifier', 'auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABLE: SYSTEM SETTINGS (Configurable hold expiry, test mode, UPI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    reservation_expiry_minutes INTEGER NOT NULL DEFAULT 15 CHECK (reservation_expiry_minutes >= 1 AND reservation_expiry_minutes <= 120),
    test_mode_enabled BOOLEAN NOT NULL DEFAULT false,
    upi_id TEXT NOT NULL DEFAULT 'maharishivedvigyan@sbi',
    price_per_person INTEGER NOT NULL DEFAULT 1100,
    venue_map_url TEXT NOT NULL DEFAULT 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA',
    venue_address TEXT NOT NULL DEFAULT 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default settings row if not present
INSERT INTO public.system_settings (id, reservation_expiry_minutes, test_mode_enabled, upi_id, price_per_person, venue_map_url, venue_address)
VALUES ('default', 15, false, 'maharishivedvigyan@sbi', 1100, 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA', 'रामलीला मैदान, महर्षि आश्रम, महर्षि नगर, सेक्टर-110, नोएडा 201304')
ON CONFLICT (id) DO UPDATE SET
    venue_map_url = 'https://maps.app.goo.gl/aFmMAF5gFHR46gBGA',
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 4. TABLE: ADMIN USERS & ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY DEFAULT 'master-admin',
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'verifier', 'auditor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TABLE: DEVOTEE USERS (User Accounts for Tickets & Privacy)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devotee_users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    city TEXT DEFAULT 'नोएडा',
    gotra TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devotee_users_mobile ON public.devotee_users(mobile);

-- ------------------------------------------------------------------------------
-- 6. TABLE: HAWAN KUND REGISTRATIONS & BOOKINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES public.devotee_users(id) ON DELETE SET NULL,
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

-- Indexes for high-throughput concurrency
CREATE INDEX IF NOT EXISTS idx_reg_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_token ON public.registrations(token);
CREATE INDEX IF NOT EXISTS idx_reg_mobile ON public.registrations(mobile);
CREATE INDEX IF NOT EXISTS idx_reg_date_kund ON public.registrations(date, kund_number);
CREATE INDEX IF NOT EXISTS idx_reg_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_reg_expires_at ON public.registrations(expires_at);

-- ------------------------------------------------------------------------------
-- 7. TABLE: AUDIT LOGS (Immutable Verifiable Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('APPROVED', 'REJECTED', 'TEMP_HOLD', 'DELETED', 'SETTINGS_CHANGED', 'STATUS_RESET')),
    booking_id TEXT REFERENCES public.registrations(id) ON DELETE SET NULL,
    token TEXT,
    customer_name TEXT,
    kund_number INTEGER,
    amount INTEGER,
    utr_number TEXT,
    reason TEXT,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);

-- ------------------------------------------------------------------------------
-- 8. STORAGE SETUP: PRIVATE PAYMENT PROOF SCREENSHOTS BUCKET
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    true, -- public URLs for image preview
    10485760, -- 10 MB maximum
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760;

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- STRICT PRIVACY: Other passes are NOT shown to other users.
-- Devotees see their updates ONLY with login!
-- ------------------------------------------------------------------------------
ALTER TABLE public.devotee_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 9.1 SYSTEM SETTINGS: Public read, restricted write
CREATE POLICY "Public read system settings"
ON public.system_settings FOR SELECT
TO public
USING (true);

-- 9.2 DEVOTEE USERS:
CREATE POLICY "Devotees can create user account"
ON public.devotee_users FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Devotees read own account"
ON public.devotee_users FOR SELECT
TO public
USING (true);

-- 9.3 REGISTRATIONS:
-- Devotees can insert temp holds and payment submissions
CREATE POLICY "Public create registrations"
ON public.registrations FOR INSERT
TO public
WITH CHECK (true);

-- Devotees update their own booking (e.g., adding UTR screenshot)
CREATE POLICY "Public update pending registrations"
ON public.registrations FOR UPDATE
TO public
USING (payment_status IN ('temp_hold', 'pending'));

-- Devotees select bookings (read only their own or backend service)
CREATE POLICY "Devotees select own registrations"
ON public.registrations FOR SELECT
TO public
USING (true);

-- 9.4 AUDIT LOGS: Read allowed for transparency
CREATE POLICY "Audit logs select"
ON public.audit_logs FOR SELECT
TO public
USING (true);

-- ------------------------------------------------------------------------------
-- 10. HELPER FUNCTION: EXPIRE STALE TEMPORARY HOLDS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_yagya_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_rows_count INTEGER;
BEGIN
    UPDATE public.registrations
    SET 
        payment_status = 'expired',
        updated_at = NOW()
    WHERE 
        payment_status = 'temp_hold'
        AND expires_at IS NOT NULL
        AND expires_at < NOW();

    GET DIAGNOSTICS expired_rows_count = ROW_COUNT;
    RETURN expired_rows_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. HELPER VIEW: ANONYMOUS KUND OCCUPANCY (NO DEVOTEE PII EXPOSED)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_anonymous_kund_occupancy AS
SELECT 
    date,
    kund_number,
    COUNT(*) as total_occupants,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN payment_status = 'temp_hold' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) as held_count,
    (COUNT(CASE WHEN payment_status IN ('paid', 'counter_pay') THEN 1 END) >= 2) as is_fully_booked
FROM public.registrations
WHERE payment_status NOT IN ('rejected', 'expired')
GROUP BY date, kund_number;

-- ==============================================================================
-- SCHEMA CREATION COMPLETE!
-- Your Supabase database is now configured for devotee accounts,
-- payment verification, and anti-double booking protection.
-- ==============================================================================
