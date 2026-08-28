const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const runAuthVerification = async () => {
  console.log('Starting offline Authentication & Authorization validation suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: [${testName}]`);
      passed++;
    } else {
      console.error(`❌ FAIL: [${testName}]`);
      failed++;
    }
  };

  try {
    // --- TEST 1: Password Hashing Pre-Save Registration ---
    
    // Check if Mongoose has a pre-save hook registered
    const preSaveHooks = User.schema.s.hooks._pres.get('save') || [];
    assert(preSaveHooks.length > 0, 'User schema has a pre-save hook registered');

    // Test hashing functionality
    const rawPassword = 'SecureAdmin@123';
    const mockUser = new User({
      name: 'Admin Test User',
      email: 'test-admin@pharmacare.local',
      password: rawPassword,
      role: 'ADMIN',
      status: 'Active'
    });

    // Hash manually to mock the pre-save outcome for testing comparePassword
    const salt = await bcrypt.genSalt(10);
    mockUser.password = await bcrypt.hash(mockUser.password, salt);

    assert(mockUser.password !== rawPassword, 'Bcrypt successfully hashes raw password');
    assert(mockUser.password.startsWith('$2a$') || mockUser.password.startsWith('$2b$'), 'Hashed password is a valid bcrypt hash');

    // --- TEST 2: Password Comparison ---
    const isCorrectMatch = await mockUser.comparePassword(rawPassword);
    const isIncorrectMatch = await mockUser.comparePassword('WrongPassword@123');
    assert(isCorrectMatch === true, 'comparePassword matches correct password');
    assert(isIncorrectMatch === false, 'comparePassword rejects incorrect password');

    // --- TEST 3: JWT Generation and Verification ---
    const secret = 'test_secret_key_12345';
    process.env.JWT_SECRET = secret;
    
    const token = jwt.sign({ id: mockUser._id.toString() }, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    
    assert(decoded.id === mockUser._id.toString(), 'JWT matches generated user payload ID');

    // --- TEST 4: Middleware Authenticate Checks ---
    
    // Stub User.findById
    const originalFindById = User.findById;
    User.findById = async (id) => {
      if (id === mockUser._id.toString()) {
        return mockUser;
      }
      return null;
    };

    // Helper to generate mock req, res, next
    const createMockHttp = (authHeaderValue) => {
      const req = {
        headers: {
          authorization: authHeaderValue
        }
      };
      let responseStatus = 200;
      let responseJson = null;
      const res = {
        status: function(code) {
          responseStatus = code;
          return this;
        },
        json: function(payload) {
          responseJson = payload;
          return this;
        }
      };
      const nextMock = jestNextMock();
      return { req, res, nextMock, getStatus: () => responseStatus, getJson: () => responseJson };
    };

    function jestNextMock() {
      let called = false;
      let errorPassed = null;
      const fn = (err) => {
        called = true;
        errorPassed = err;
      };
      fn.isCalled = () => called;
      fn.getError = () => errorPassed;
      return fn;
    }

    // 4.1 Missing Token
    const http1 = createMockHttp(undefined);
    await authenticate(http1.req, http1.res, http1.nextMock);
    assert(http1.nextMock.isCalled() === false, 'authenticate blocks requests missing authorization header');
    assert(http1.getStatus() === 401, 'authenticate returns 401 status code on missing token');

    // 4.2 Invalid/Malformed Token
    const http2 = createMockHttp('Bearer invalid-token-string');
    await authenticate(http2.req, http2.res, http2.nextMock);
    assert(http2.nextMock.isCalled() === false, 'authenticate blocks requests with invalid signature');
    assert(http2.getStatus() === 401, 'authenticate returns 401 status code on invalid token');

    // 4.3 Valid Token
    const http3 = createMockHttp(`Bearer ${token}`);
    await authenticate(http3.req, http3.res, http3.nextMock);
    assert(http3.nextMock.isCalled() === true, 'authenticate allows request with valid JWT');
    assert(http3.req.user !== undefined && http3.req.user.role === 'ADMIN', 'authenticate attaches user context to req.user');

    // --- TEST 5: Middleware Authorize Check ---

    // 5.1 Cashier tries to access Admin route (Should fail)
    const cashierUser = new User({ role: 'CASHIER', status: 'Active' });
    const reqRestricted = { user: cashierUser };
    const resRestricted = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(payload) {
        this.jsonPayload = payload;
        return this;
      }
    };
    const nextRestricted = jestNextMock();
    
    // Create authorize middleware
    const adminOnlyGuard = authorize('ADMIN');
    adminOnlyGuard(reqRestricted, resRestricted, nextRestricted);
    
    assert(nextRestricted.isCalled() === false, 'authorize blocks restricted roles');
    assert(resRestricted.statusCode === 403, 'authorize returns 403 Forbidden status code on role mismatch');

    // 5.2 Admin tries to access Admin route (Should pass)
    const adminUser = new User({ role: 'ADMIN', status: 'Active' });
    const reqAdmin = { user: adminUser };
    const nextAdmin = jestNextMock();
    
    adminOnlyGuard(reqAdmin, null, nextAdmin);
    assert(nextAdmin.isCalled() === true, 'authorize passes matching allowed roles');

    // Restore stub
    User.findById = originalFindById;

  } catch (error) {
    console.error('Unexpected error running auth verification tests:', error);
    failed++;
  }

  console.log('\n--- AUTH VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL AUTHENTICATION AND AUTHORIZATION CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME AUTHENTICATION VERIFICATION CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runAuthVerification();
