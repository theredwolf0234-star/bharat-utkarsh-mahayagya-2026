import assert from 'assert';
import { spawn } from 'child_process';

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess;

async function startServer() {
  return new Promise((resolve) => {
    console.log(`Starting test server on port ${PORT}...`);
    serverProcess = spawn('npx', ['tsx', 'server.ts'], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test', TEST_MODE: 'true' },
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
    }, 5500);
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

async function runAuthTests() {
  console.log('================================================================');
  console.log('🛡️ RUNNING COMPREHENSIVE AUTHENTICATION & ACCOUNT AUDIT SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  const testStamp = Date.now().toString().slice(-6);
  const testDevotee = {
    fullName: `श्री रामजी शर्मा ${testStamp}`,
    mobile: `9810${testStamp}`,
    email: `ramji_${testStamp}@example.com`,
    password: 'SecurePassword123!',
    city: 'नोएडा',
    gotra: 'कश्यप',
    termsAccepted: true,
    agreeTerms: true,
  };

  let activeSessionToken = '';
  let activeUserId = '';
  let signupOtp = '';

  // 1. REGISTRATION INPUT VALIDATION
  await test('Registration rejects invalid inputs (missing terms, short name, bad email, mismatch password)', async () => {
    // Missing terms
    const res1 = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testDevotee, termsAccepted: false, agreeTerms: false }),
    });
    assert.strictEqual(res1.status, 400, `Expected 400 for missing terms, got ${res1.status}: ${res1.text}`);

    // Short name (< 2 chars)
    const res2 = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testDevotee, fullName: 'A' }),
    });
    assert.strictEqual(res2.status, 400, `Expected 400 for short name, got ${res2.status}`);

    // Bad email
    const res3 = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testDevotee, email: 'not-an-email' }),
    });
    assert.strictEqual(res3.status, 400, `Expected 400 for bad email, got ${res3.status}`);

    // Password mismatch
    const res4 = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testDevotee, confirmPassword: 'different-password' }),
    });
    assert.strictEqual(res4.status, 400, `Expected 400 for password mismatch, got ${res4.status}`);
  });

  // 2. SUCCESSFUL REGISTRATION DISPATCH & OTP GENERATION
  await test('Successful registration dispatches OTP and truthful delivery capability', async () => {
    const res = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testDevotee,
        confirmPassword: testDevotee.password,
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.debugOtp, 'Test mode should provide debug OTP');
    signupOtp = res.body.debugOtp;
    console.log(`    (Generated Registration OTP: ${signupOtp})`);
  });

  // 3. OTP VERIFICATION
  await test('Registration OTP verification with incorrect code fails (400)', async () => {
    const res = await request('/api/user/verify-signup-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        otp: '000000',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  await test('Registration OTP verification with valid code activates account and creates persistent session', async () => {
    const res = await request('/api/user/verify-signup-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        otp: signupOtp,
      }),
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Should return session token');
    assert.strictEqual(res.body.user.mobile, testDevotee.mobile);
    assert.strictEqual(res.body.user.isVerified, true);
    // Never expose password hash to frontend
    assert.strictEqual(res.body.user.passwordHash, undefined);
    assert.strictEqual(res.body.user.password, undefined);

    activeSessionToken = res.body.token;
    activeUserId = res.body.user.id;
  });

  // 4. DUPLICATE ACCOUNT PREVENTION (TESTED AFTER REGISTRATION ACTIVATION)
  await test('Duplicate registration with same mobile is rejected (409)', async () => {
    const resMob = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Another Devotee Name',
        mobile: testDevotee.mobile,
        email: `unique_${Date.now()}@example.com`,
        password: 'SomePassword123!',
        confirmPassword: 'SomePassword123!',
        agreeTerms: true,
        termsAccepted: true,
      }),
    });
    assert.strictEqual(resMob.status, 409, `Expected 409 for duplicate mobile, got ${resMob.status}: ${resMob.text}`);
  });

  await test('Duplicate registration with same email is rejected (409)', async () => {
    const resEmail = await request('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Another Devotee Name',
        mobile: `9876${Date.now().toString().slice(-6)}`,
        email: testDevotee.email,
        password: 'SomePassword123!',
        confirmPassword: 'SomePassword123!',
        agreeTerms: true,
        termsAccepted: true,
      }),
    });
    assert.strictEqual(resEmail.status, 409, `Expected 409 for duplicate email, got ${resEmail.status}: ${resEmail.text}`);
  });

  // 5. LOGIN WITH MOBILE & EMAIL
  await test('Devotee can login with registered Mobile Number', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: testDevotee.password,
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.fullName, testDevotee.fullName);
    activeSessionToken = res.body.token;
  });

  await test('Devotee can login with registered Email Address', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.email,
        password: testDevotee.password,
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.mobile, testDevotee.mobile);
  });

  await test('Login with incorrect password returns 401', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: 'WrongPassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  await test('Login with non-existent user returns 404', async () => {
    const res = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9000000000',
        password: 'AnyPassword123!',
      }),
    });
    assert.strictEqual(res.status, 404);
  });

  // 6. PROTECTED USER PROFILE & SESSION VALIDATION
  await test('Accessing /api/user/me without token returns 401', async () => {
    const res = await request('/api/user/me');
    assert.strictEqual(res.status, 401);
  });

  await test('Accessing /api/user/me with valid Bearer token returns profile', async () => {
    const res = await request('/api/user/me', {
      headers: { Authorization: `Bearer ${activeSessionToken}` },
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.user.mobile, testDevotee.mobile);
    assert.strictEqual(res.body.user.fullName, testDevotee.fullName);
  });

  // 7. EDIT PROFILE
  await test('Devotee can update their profile information', async () => {
    const updatedName = `${testDevotee.fullName} (संशोधित)`;
    const res = await request('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeSessionToken}`,
      },
      body: JSON.stringify({
        fullName: updatedName,
        email: testDevotee.email,
        city: 'वाराणसी',
        gotra: 'भारद्वाज',
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.user.fullName, updatedName);
    assert.strictEqual(res.body.user.city, 'वाराणसी');
    assert.strictEqual(res.body.user.gotra, 'भारद्वाज');
  });

  // 8. CHANGE PASSWORD (WHILE LOGGED IN)
  await test('Change password requires correct current password', async () => {
    const res = await request('/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeSessionToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongOldPassword123!',
        newPassword: 'BrandNewPassword456!',
        confirmPassword: 'BrandNewPassword456!',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  await test('Change password succeeds with valid current password', async () => {
    const res = await request('/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeSessionToken}`,
      },
      body: JSON.stringify({
        currentPassword: testDevotee.password,
        newPassword: 'BrandNewPassword456!',
        confirmPassword: 'BrandNewPassword456!',
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${res.text}`);
    assert.strictEqual(res.body.success, true);
  });

  await test('Login with old password now fails, and new password succeeds', async () => {
    // Old password fails
    const resOld = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: testDevotee.password,
      }),
    });
    assert.strictEqual(resOld.status, 401);

    // New password succeeds
    const resNew = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: 'BrandNewPassword456!',
      }),
    });
    assert.strictEqual(resNew.status, 200, `Expected 200, got ${resNew.status}: ${resNew.text}`);
    assert.ok(resNew.body.token);
    activeSessionToken = resNew.body.token;
  });

  // 9. FORGOT PASSWORD RECOVERY FLOW
  let resetAuthToken = '';
  await test('Forgot password flow: Request reset OTP, verify OTP, and reset password', async () => {
    // Step 1: Request OTP
    const reqRes = await request('/api/user/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testDevotee.mobile }),
    });
    assert.strictEqual(reqRes.status, 200, `Expected 200, got ${reqRes.status}: ${reqRes.text}`);
    assert.ok(reqRes.body.debugCode, 'Test mode should return debugCode for verification');
    const resetOtp = reqRes.body.debugCode;

    // Step 2: Verify OTP
    const verifyRes = await request('/api/user/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        otp: resetOtp,
      }),
    });
    assert.strictEqual(verifyRes.status, 200, `Expected 200, got ${verifyRes.status}: ${verifyRes.text}`);
    assert.ok(verifyRes.body.resetAuthToken, 'Should grant single-use resetAuthToken');
    resetAuthToken = verifyRes.body.resetAuthToken;

    // Replay attack prevention: used OTP must be rejected immediately
    const replayRes = await request('/api/user/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        otp: resetOtp,
      }),
    });
    assert.strictEqual(replayRes.status, 400);

    // Step 3: Set New Password
    const finalResetRes = await request('/api/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetAuthToken,
        newPassword: 'RecoveredPassword789!',
      }),
    });
    assert.strictEqual(finalResetRes.status, 200, `Expected 200, got ${finalResetRes.status}: ${finalResetRes.text}`);

    // Single-use token: Replaying resetAuthToken must be rejected
    const tokenReplay = await request('/api/user/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resetAuthToken,
        newPassword: 'AnotherPassword!',
      }),
    });
    assert.strictEqual(tokenReplay.status, 401);

    // Login with recovered password succeeds
    const recoveredLogin = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: 'RecoveredPassword789!',
      }),
    });
    assert.strictEqual(recoveredLogin.status, 200);
    activeSessionToken = recoveredLogin.body.token;
  });

  // 10. BOOKING LINKAGE & MY TICKETS PRIVACY
  await test('Devotee bookings are linked and retrieved via /api/user/my-tickets', async () => {
    const res = await request('/api/user/my-tickets', {
      headers: { Authorization: `Bearer ${activeSessionToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.tickets));
  });

  // 11. ADMIN ISOLATION & SECURITY
  await test('Devotee session CANNOT access administrative endpoints without admin authorization', async () => {
    const adminRes = await request('/api/admin/bookings', {
      headers: { Authorization: `Bearer ${activeSessionToken}` },
    });
    assert.ok(adminRes.status === 401 || adminRes.status === 403, `Expected 401/403 for devotee on admin API, got ${adminRes.status}`);
  });

  // 12. LOGOUT & SESSION INVALIDATION
  await test('Devotee logout invalidates session token', async () => {
    const res = await request('/api/user/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeSessionToken}` },
    });
    assert.strictEqual(res.status, 200);

    // Subsequent access with this token is unauthorized
    const meRes = await request('/api/user/me', {
      headers: { Authorization: `Bearer ${activeSessionToken}` },
    });
    assert.strictEqual(meRes.status, 401);
  });

  // 13. DELETE ACCOUNT (WITH RE-AUTHENTICATION & RETENTION POLICY)
  await test('Devotee account deletion requires re-authentication and DELETE confirmation', async () => {
    // Re-login to get active session
    const loginRes = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: 'RecoveredPassword789!',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    const token = loginRes.body.token;

    // Wrong password fails
    const failRes1 = await request('/api/user/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password: 'IncorrectPassword!',
        confirmText: 'DELETE',
      }),
    });
    assert.strictEqual(failRes1.status, 401);

    // Missing DELETE confirmation fails
    const failRes2 = await request('/api/user/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password: 'RecoveredPassword789!',
        confirmText: 'no',
      }),
    });
    assert.strictEqual(failRes2.status, 400);

    // Valid deletion succeeds
    const successRes = await request('/api/user/delete-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password: 'RecoveredPassword789!',
        confirmText: 'DELETE',
      }),
    });
    assert.strictEqual(successRes.status, 200, `Expected 200, got ${successRes.status}: ${successRes.text}`);
    assert.strictEqual(successRes.body.success, true);

    // Subsequent login fails with 404 (account deleted)
    const afterDelLogin = await request('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testDevotee.mobile,
        password: 'RecoveredPassword789!',
      }),
    });
    assert.strictEqual(afterDelLogin.status, 404);
  });

  console.log('\n================================================================');
  console.log(`🎯 AUDIT RESULTS: Passed: ${passed} | Failed: ${failed}`);
  console.log('================================================================\n');

  stopServer();
  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  try {
    await startServer();
    await runAuthTests();
  } catch (e) {
    console.error('Fatal test error:', e);
    stopServer();
    process.exit(1);
  }
}

main();
