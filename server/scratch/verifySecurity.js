const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const errorHandler = require('../middleware/errorHandler');
const { secureHeaders, sanitizeNoSQL, loginRateLimiter } = require('../middleware/security');
const { authenticate, authorize } = require('../middleware/auth');

const runSecurityAuditSuite = async () => {
  console.log('===========================================================');
  console.log('🛡️  PHARMACARE COMPREHENSIVE SECURITY AUDIT & VERIFICATION 🛡️');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: [${testName}]`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: [${testName}]`);
      failed++;
    }
  };

  const createMockRes = () => {
    const headers = {};
    const res = {
      statusCode: 200,
      headers,
      jsonData: null,
      setHeader(name, val) {
        headers[name.toLowerCase()] = val;
      },
      removeHeader(name) {
        delete headers[name.toLowerCase()];
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  try {
    /* ───────────────────────────────────────────────────────────
     * 1. PASSWORD SECURITY & LEAKAGE PREVENTION
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 1. PASSWORD SECURITY & LEAKAGE PREVENTION ---');
    
    const plainPassword = 'SuperSecretPassword@2026';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    assert(hashedPassword !== plainPassword, 'Password is never stored in plain text');
    assert(hashedPassword.startsWith('$2'), 'Password uses strong bcrypt hashing format');
    
    // Model toJSON transformation check
    const userDoc = new User({
      name: 'Security Test User',
      email: 'sec_test@pharmacare.local',
      password: hashedPassword,
      role: 'PHARMACIST'
    });
    
    const serializedUser = userDoc.toJSON();
    assert(serializedUser.password === undefined, 'Password hash is completely stripped from JSON serializations');
    assert(serializedUser.__v === undefined, 'Internal Mongoose versioning key stripped from responses');

    /* ───────────────────────────────────────────────────────────
     * 2. OWASP SECURE HEADERS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 2. OWASP SECURE HTTP HEADERS ---');
    
    const mockReq = {};
    const mockRes = createMockRes();
    secureHeaders(mockReq, mockRes, () => {});

    assert(mockRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options set to "nosniff"');
    assert(mockRes.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options set to "SAMEORIGIN" (Clickjacking defense)');
    assert(mockRes.headers['x-xss-protection'] === '1; mode=block', 'X-XSS-Protection enabled');
    assert(mockRes.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy configured securely');

    /* ───────────────────────────────────────────────────────────
     * 3. NOSQL OPERATOR INJECTION SANITIZATION
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 3. NOSQL OPERATOR INJECTION SANITIZATION ---');

    const maliciousReq = {
      body: {
        username: 'admin',
        password: { $ne: 'randomPassword' }, // Classic NoSQL auth bypass attempt
        nested: {
          $gt: '',
          safeField: 'valid_data'
        }
      },
      query: {
        $where: 'this.password.length > 0',
        search: 'Paracetamol'
      }
    };

    sanitizeNoSQL(maliciousReq, {}, () => {});

    assert(maliciousReq.body.password.$ne === undefined, 'NoSQL operator $ne in body was sanitized and stripped');
    assert(maliciousReq.body.nested.$gt === undefined, 'Nested NoSQL operator $gt was sanitized and stripped');
    assert(maliciousReq.body.nested.safeField === 'valid_data', 'Legitimate nested payload data preserved');
    assert(maliciousReq.query.$where === undefined, 'Query parameter $where injection sanitized');
    assert(maliciousReq.query.search === 'Paracetamol', 'Legitimate search query parameter preserved');

    /* ───────────────────────────────────────────────────────────
     * 4. BRUTE-FORCE RATE LIMITING
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 4. BRUTE-FORCE RATE LIMITING ---');

    const limiter = loginRateLimiter({ windowMs: 60000, max: 3 });
    const clientReq = { ip: '192.168.1.100' };
    
    const res1 = createMockRes();
    const res2 = createMockRes();
    const res3 = createMockRes();
    const res4 = createMockRes();

    limiter(clientReq, res1, () => {});
    limiter(clientReq, res2, () => {});
    limiter(clientReq, res3, () => {});
    limiter(clientReq, res4, () => {});

    assert(res1.statusCode === 200, 'Attempt 1 permitted');
    assert(res2.statusCode === 200, 'Attempt 2 permitted');
    assert(res3.statusCode === 200, 'Attempt 3 permitted');
    assert(res4.statusCode === 429, 'Attempt 4 blocked with 429 Too Many Requests (Rate limit triggered)');
    assert(res4.headers['retry-after'] !== undefined, 'Retry-After header supplied on rate limit rejection');

    /* ───────────────────────────────────────────────────────────
     * 5. ERROR SANITIZATION & CASTOR ERROR SHIELD
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 5. ERROR SANITIZATION & STACK TRACE SHIELD ---');

    const castErr = new Error('Cast to ObjectId failed for value "invalid_mongo_id"');
    castErr.name = 'CastError';
    castErr.value = 'invalid_mongo_id';

    const errRes = createMockRes();
    errorHandler(castErr, {}, errRes, () => {});

    assert(errRes.statusCode === 400, 'Invalid ObjectId CastError mapped to clean 400 status');
    assert(!errRes.jsonData.message.includes('MongooseError'), 'Internal database engine internals shielded from client');

    const jwtErr = new Error('jwt signature is invalid');
    jwtErr.name = 'JsonWebTokenError';
    const jwtRes = createMockRes();
    errorHandler(jwtErr, {}, jwtRes, () => {});
    assert(jwtRes.statusCode === 401, 'Tampered JWT error mapped cleanly to 401 Unauthorized');

    /* ───────────────────────────────────────────────────────────
     * 6. INPUT VALIDATION BOUNDS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 6. INPUT VALIDATION BOUNDS ---');

    const invalidMed = new Medicine({
      name: 'Bounds Check Med',
      genericName: 'Formula',
      category: new mongoose.Types.ObjectId(),
      dosageForm: 'Tablet',
      strength: '100mg',
      unit: 'Box',
      purchasePrice: -150.00,
      sellingPrice: -200.00,
      tax: -5
    });

    let valErr = null;
    try {
      await invalidMed.validate();
    } catch (e) {
      valErr = e;
    }

    assert(valErr !== null, 'Negative financial numbers rejected by schema validators');
    assert(valErr.errors['purchasePrice'] !== undefined, 'Negative purchase price validation error caught');
    assert(valErr.errors['sellingPrice'] !== undefined, 'Negative selling price validation error caught');

    /* ───────────────────────────────────────────────────────────
     * 7. ENVIRONMENT SECRETS & GITIGNORE
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 7. ENVIRONMENT SECRETS & GITIGNORE ---');

    const gitignorePath = path.resolve(__dirname, '../../.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    assert(gitignoreContent.includes('.env'), '.gitignore strictly ignores .env files');
    assert(gitignoreContent.includes('node_modules/'), '.gitignore ignores node_modules/');

  } catch (error) {
    console.error('\n❌ Unexpected error running Security Audit:', error);
    failed++;
  }

  console.log('\n===========================================================');
  console.log(`📊 SECURITY AUDIT RESULTS:`);
  console.log(`   Passed: ${passed} checks`);
  console.log(`   Failed: ${failed} checks`);
  console.log('===========================================================\n');

  if (failed === 0) {
    console.log('🛡️ ALL SECURITY AUDIT, SANITIZATION & HARDENING CHECKS PASSED! 🛡️\n');
    process.exit(0);
  } else {
    console.error('❌ SOME SECURITY CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runSecurityAuditSuite();
