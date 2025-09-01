import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}

/**
 * Sanitize user input for safe database storage and display
 */
export function sanitizeInput(input: any): string {
  if (input === null || input === undefined) {
    return '';
  }
  
  const str = String(input).trim();
  return sanitizeHtml(str);
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize numeric inputs
 */
export function sanitizeNumber(input: any): number {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number format');
  }
  return num;
}

/**
 * Sanitize Bitcoin addresses
 */
export function sanitizeBitcoinAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid Bitcoin address');
  }
  
  const sanitized = address.trim();
  // Basic Bitcoin address validation (legacy, SegWit, native SegWit)
  const bitcoinAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
  
  if (!bitcoinAddressRegex.test(sanitized)) {
    throw new Error('Invalid Bitcoin address format');
  }
  
  return sanitized;
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(req: any, res: any, next: any) {
  // Additional security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
}

/**
 * Enhanced error handling for security
 */
export function secureErrorHandler(error: any, req: any, res: any, next: any) {
  // Log error details securely (avoid exposing sensitive info)
  console.error('Security Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Return generic error message to client
  const status = error.status || error.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'An internal error occurred';

  res.status(status).json({ error: message });
}