import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSqliteDatabase, updateAdminPassword } from '../src/server/database';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const newPassword = process.argv[2];

if (!newPassword || newPassword.length < 6) {
  console.error('\n❌ उपयोग निर्देश:');
  console.error('npx tsx scripts/reset-admin-password.ts <नया-पासवर्ड>');
  console.error('पासवर्ड न्यूनतम 6 अक्षरों का होना अनिवार्य है।\n');
  process.exit(1);
}

async function main() {
  console.log('\n=============================================================');
  console.log(' महर्षि भारत उत्कर्ष महायज्ञ 2026 - व्यवस्थापक पासवर्ड रीसेट');
  console.log('=============================================================\n');

  const PAYMENT_SECRET_KEY = process.env.PAYMENT_SECRET_KEY || 'MAHARISHI_YAGYA_SECURE_KEY_2026_V1';
  const newHash = crypto.createHmac('sha256', PAYMENT_SECRET_KEY).update(newPassword.trim()).digest('hex');

  // 1. Update SQLite Database
  await initSqliteDatabase();
  const sqliteSuccess = updateAdminPassword('maharishi_admin', newHash);

  if (sqliteSuccess) {
    console.log('✅ SQLite डेटाबेस में मुख्य व्यवस्थापक पासवर्ड सफलतापूर्वक अपडेट हुआ।');
  } else {
    console.warn('⚠️ SQLite में पासवर्ड अपडेट विफल रहा।');
  }

  // 2. Update Supabase Database
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpbnsolzmrsyoddxzaqj.supabase.co';
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_WW-vmr513N7070fDU-unOA__9Jl0lCe';

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await supabase.from('admin_users').upsert([
      {
        id: 'master-admin',
        username: 'maharishi_admin',
        password_hash: newHash,
        role: 'super_admin',
        created_at: new Date().toISOString(),
      },
    ]);

    if (!error) {
      console.log('✅ Supabase क्लाउड डेटाबेस में व्यवस्थापक क्रेडेंशियल सिंक हो गए।');
    } else {
      console.warn('Supabase नोट:', error.message);
    }
  } catch (e: any) {
    console.warn('Supabase कनेक्शन त्रुटि:', e.message);
  }

  console.log('\n🎉 नया व्यवस्थापक क्रेडेंशियल:');
  console.log('यूज़रनेम: maharishi_admin');
  console.log('पासवर्ड: ' + newPassword.trim());
  console.log('\nअब आप इस नए पासवर्ड से व्यवस्थापक पोर्टल पर लॉगिन कर सकते हैं।\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
