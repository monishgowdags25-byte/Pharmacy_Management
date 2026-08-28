/**
 * Security Middleware Suite for PharmaCare ERP
 */

// In-memory sliding window rate limiter
const rateLimitMap = new Map();

/**
 * Login Rate Limiter Middleware
 * Mitigates brute-force attacks against staff accounts
 */
const loginRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxAttempts = options.max || 30; // 30 attempts per window

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    rateLimitMap.set(ip, record);

    if (record.count > maxAttempts) {
      const retrySecs = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retrySecs);
      return res.status(429).json({
        success: false,
        message: `Too many login attempts from this IP. Please try again in ${retrySecs} seconds.`
      });
    }

    next();
  };
};

/**
 * Security Headers Middleware (OWASP recommended headers)
 */
const secureHeaders = (req, res, next) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // XSS Auditor
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Remove X-Powered-By
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * NoSQL Injection Sanitization Middleware
 * Recursively cleans query parameters and body from Mongo operator injections ($gt, $ne, $where)
 */
const sanitizeNoSQL = (req, res, next) => {
  const cleanObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        cleanObject(obj[key]);
      }
    }
  };

  if (req.body) cleanObject(req.body);
  if (req.query) cleanObject(req.query);
  if (req.params) cleanObject(req.params);

  next();
};

module.exports = {
  loginRateLimiter,
  secureHeaders,
  sanitizeNoSQL
};
