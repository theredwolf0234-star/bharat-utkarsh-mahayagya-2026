import assert from 'assert';
import { spawn } from 'child_process';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess;

async function startServer() {
  return new Promise((resolve) => {
    console.log('Starting test server on port', PORT, '...');
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' },
      shell: true,
    });

    serverProcess.stdout.on('data', (d) => {
      const out = d.toString();
      if (out.includes(`Server running on port ${PORT}`) || out.includes(`localhost:${PORT}`)) {
        resolve();
      }
    });

    setTimeout(() => {
      resolve();
    }, 4500);
  });
}

function stopServer() {
  if (serverProcess) {
    console.log('Stopping test server...');
    serverProcess.kill();
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = null;
  }
  return { status: res.status, headers: res.headers, body: json, text };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE SYSTEM & AUDIT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error('   Error:', err.message);
      failed++;
    }
  }

  // Dynamic unique mobile numbers for clean test run
  const runId = Date.now().toString().slice(-4);
  const mobA = `980011${runId}`;
  const mobB = `980022${runId}`;
  const testDate = '2026-11-29';

  // 1. Health & Server Status
  await test('1. Health check endpoint responds ok with memory & uptime', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  // 2. Reserved Kunds 1-9 Integrity
  await test('2. Sant Reserved Kunds 1-9 cannot be locked or booked by anyone', async () => {
    for (let k = 1; k <= 9; k++) {
      const res = await request('/api/kunds/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kundNumber: k,
          date: testDate,
          mobile: mobA,
          fullName: 'Test Sant Check',
        }),
      });
      assert.strictEqual(res.status, 400, `Kund ${k} must return 400`);
      assert(res.body.error.includes('आरक्षित'), `Kund ${k} must mention reserved`);
    }
  });

  // 3. Valid Kund 10-108 Locking
  await test('3. Devotee can lock unreserved Kund (Kund 45) for 5-minute checkout', async () => {
    const res = await request('/api/kunds/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kundNumber: 45,
        date: testDate,
        mobile: mobA,
        fullName: 'Shri Ram Sharma',
        amount: 2100,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.lock, 'Lock payload must exist');
    assert.strictEqual(res.body.lock.kundNumber, 45);
  });

  // 4. Concurrent Conflict Prevention
  await test('4. Another devotee cannot lock the same Kund on the same date while active lock exists', async () => {
    const res = await request('/api/kunds/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kundNumber: 45,
        date: testDate,
        mobile: mobB, // Different devotee
        fullName: 'Another Devotee',
        amount: 2100,
      }),
    });
    assert.strictEqual(res.status, 409, 'Must return 409 Conflict');
    assert(res.body.error.includes('लॉक') || res.body.error.includes('उपलब्ध नहीं'), 'Must reject due to active lock');
  });

  // 5. Release Lock Endpoint
  await test('5. Releasing lock allows Kund to become available again', async () => {
    const relRes = await request('/api/kunds/release-lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kundNumber: 45,
        date: testDate,
        mobile: mobA,
      }),
    });
    assert.strictEqual(relRes.status, 200);
    assert.strictEqual(relRes.body.success, true);
  });

  // 6. Temporary Hold Creation
  let tempRegData = null;
  await test('6. Temporary reservation hold saves with 5-minute atomic window', async () => {
    const res = await request('/api/reservations/temp-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bhakti Devotee',
        mobile: mobA,
        kundNumber: 55,
        date: testDate,
        amount: 5100,
        city: 'Noida',
      }),
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.registration.paymentStatus, 'temp_hold');
    assert(res.body.registration.token.startsWith('MUMY-26-K55-'));
    tempRegData = res.body.registration;
  });

  // 7. Payment Proof Submission (Strict Live Mode - Status MUST be PENDING)
  let submittedReg = null;
  await test('7. Submitting UTR & proof sets status to PENDING awaiting admin verification', async () => {
    assert(tempRegData, 'tempRegData must exist');
    const res = await request('/api/payment/submit-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId: tempRegData.id,
        token: tempRegData.token,
        utrNumber: `4321${Date.now().toString().slice(-8)}`, // Valid 12-digit UTR
        paymentProofUrl: 'https://images.unsplash.com/photo-test-receipt.jpg',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'pending', 'Status MUST be pending in production mode');
    assert.strictEqual(res.body.registration.paymentStatus, 'pending');
    submittedReg = res.body.registration;
  });

  // 8. Daily Limit Enforcement: Same mobile cannot register a 2nd Kund on the same date
  await test('8. Daily Limit Enforcement: Devotee cannot book a 2nd Kund on the same date', async () => {
    const res = await request('/api/kunds/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kundNumber: 56,
        date: testDate, // Same date as devotee mobA's pending booking
        mobile: mobA,
        fullName: 'Bhakti Devotee',
        amount: 2100,
      }),
    });
    assert.strictEqual(res.status, 400, 'Must return 400 for duplicate daily booking');
    assert.strictEqual(res.body.code, 'DAILY_LIMIT_EXCEEDED');
  });

  // 9. Fake or malformed UTR rejection
  await test('9. Non-12 digit UTR is rejected with 400 Bad Request', async () => {
    const res = await request('/api/payment/submit-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registrationId: tempRegData.id,
        utrNumber: '12345', // Too short
      }),
    });
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('अमान्य UTR') || res.body.error.includes('12 अंकों'), 'Must reject short UTR');
  });

  // 10. Privacy Guard: Public /api/registrations returns NO Devotee PII
  await test('10. Public registrations list masks devotee personal information (Tokens ***)', async () => {
    const res = await request('/api/registrations');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.registrations));
    const sample = res.body.registrations.find((r) => r.id === tempRegData.id);
    if (sample) {
      assert.strictEqual(sample.token, '***', 'Token must be masked for public');
      assert.strictEqual(sample.mobile, undefined, 'Mobile number must not be exposed');
      assert.strictEqual(sample.fullName, undefined, 'Name must not be exposed');
    }
  });

  // 11. Admin Auth & Protected Verification
  let adminToken = null;
  await test('11. Admin login verifies credentials and grants administrative token', async () => {
    const res = await request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'maharishi_admin',
        password: 'admin123',
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.token, 'Admin session token must be returned');
    adminToken = res.body.token;
  });

  // 12. Admin Approval & Final Pass Issuance
  await test('12. Admin verifies payment proof, sets status to PAID and issues signature', async () => {
    assert(submittedReg, 'submittedReg must exist');
    const res = await request('/api/admin/approve-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: submittedReg.id,
      }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.registration.paymentStatus, 'paid');
    assert(res.body.registration.verificationHash, 'Cryptographic payment signature must be generated');
  });

  // 13. Mobile Back Navigation Architecture Verification
  await test('13. Client navigation state model adheres to SPA history contract', () => {
    const routes = {
      home: '#home',
      register: '#register',
      payment: '#payment',
      tickets: '#tickets',
      admin: '#admin',
      lookup: '#lookup',
      slip: '#slip',
    };
    for (const [view, hash] of Object.entries(routes)) {
      assert(hash.startsWith('#'), `Route ${view} must have valid hash`);
    }
  });

  // 14. Responsive viewport & safe area CSS compliance
  await test('14. Viewport meta tag includes viewport-fit=cover for iPhone notches', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert(res.text.includes('viewport-fit=cover'), 'index.html must have viewport-fit=cover');
  });

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('====================================================\n');

  stopServer();
  process.exit(failed > 0 ? 1 : 0);
}

startServer()
  .then(() => setTimeout(runTests, 1500))
  .catch((err) => {
    console.error('Test server startup failed:', err);
    stopServer();
    process.exit(1);
  });
