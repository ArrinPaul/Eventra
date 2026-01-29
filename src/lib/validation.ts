/**
 * Input Validation & Sanitization Utilities
 * Comprehensive validation and sanitization for forms, APIs, and user input
 */

// ============================================================
// EMAIL VALIDATION
// ============================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isBusinessEmail(email: string): boolean {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  return isValidEmail(email) && !personalDomains.includes(domain || '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', 'dragon', 'master',
    '12345678', 'abc123', 'iloveyou', 'trustno1', 'baseball',
    'shadow', 'superman', 'michael', 'football', 'batman',
  ];
  return commonPasswords.includes(password.toLowerCase());
}

// ============================================================
// USERNAME VALIDATION
// ============================================================

export function isValidUsername(username: string): boolean {
  // Allow alphanumeric, underscores, and hyphens, 3-30 chars
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export function isReservedUsername(username: string): boolean {
  const reserved = [
    'admin', 'administrator', 'root', 'system', 'moderator',
    'support', 'help', 'info', 'contact', 'api', 'www',
    'mail', 'email', 'ftp', 'blog', 'news', 'events',
    'settings', 'profile', 'dashboard', 'login', 'signup',
    'register', 'oauth', 'auth', 'security', 'private',
  ];
  return reserved.includes(username.toLowerCase());
}

// ============================================================
// PHONE VALIDATION
// ============================================================

export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Valid if 10-15 digits
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// ============================================================
// URL VALIDATION
// ============================================================

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

// ============================================================
// DATE VALIDATION
// ============================================================

export function isValidDateString(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

export function isDateInFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function isDateWithinRange(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function isValidEventDateRange(startDate: Date, endDate: Date): boolean {
  return (
    isDateInFuture(startDate) &&
    endDate.getTime() > startDate.getTime() &&
    // Events shouldn't be more than 30 days long
    endDate.getTime() - startDate.getTime() <= 30 * 24 * 60 * 60 * 1000
  );
}

// ============================================================
// NUMERIC VALIDATION
// ============================================================

export function isValidCapacity(capacity: number): boolean {
  return Number.isInteger(capacity) && capacity > 0 && capacity <= 100000;
}

export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && price <= 1000000;
}

export function isValidPercentage(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

export function isValidAge(age: number): boolean {
  return Number.isInteger(age) && age >= 0 && age <= 150;
}

// ============================================================
// TEXT SANITIZATION
// ============================================================

export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}

export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function truncateText(text: string, maxLength: number, ellipsis = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length).trim() + ellipsis;
}

export function removeControlCharacters(text: string): string {
  return text.replace(/[\x00-\x1F\x7F]/g, '');
}

export function sanitizeForFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s.-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// ============================================================
// XSS PREVENTION
// ============================================================

export function sanitizeInput(input: string): string {
  return escapeHtml(stripHtmlTags(normalizeWhitespace(removeControlCharacters(input))));
}

export function sanitizeRichText(html: string): string {
  // Allow only safe HTML tags
  const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const tagPattern = new RegExp(`<(?!\\/?(${allowedTags.join('|')})\\b)[^>]*>`, 'gi');
  
  // Remove disallowed tags
  let sanitized = html.replace(tagPattern, '');
  
  // Remove javascript: URLs from links
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  
  // Remove onclick and other event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
}

// ============================================================
// FORM FIELD VALIDATORS
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

export function validateMinLength(value: string, min: number, fieldName: string): ValidationResult {
  if (value.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  return { isValid: true };
}

export function validateMaxLength(value: string, max: number, fieldName: string): ValidationResult {
  if (value.length > max) {
    return { isValid: false, error: `${fieldName} must be no more than ${max} characters` };
  }
  return { isValid: true };
}

export function validatePattern(value: string, pattern: RegExp, errorMessage: string): ValidationResult {
  if (!pattern.test(value)) {
    return { isValid: false, error: errorMessage };
  }
  return { isValid: true };
}

// ============================================================
// EVENT-SPECIFIC VALIDATORS
// ============================================================

export function validateEventTitle(title: string): ValidationResult {
  const sanitized = sanitizeInput(title);
  
  if (!sanitized) {
    return { isValid: false, error: 'Event title is required' };
  }
  
  if (sanitized.length < 5) {
    return { isValid: false, error: 'Event title must be at least 5 characters' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Event title must be no more than 100 characters' };
  }
  
  return { isValid: true };
}

export function validateEventDescription(description: string): ValidationResult {
  const sanitized = stripHtmlTags(description);
  
  if (!sanitized) {
    return { isValid: false, error: 'Event description is required' };
  }
  
  if (sanitized.length < 50) {
    return { isValid: false, error: 'Event description must be at least 50 characters' };
  }
  
  if (sanitized.length > 5000) {
    return { isValid: false, error: 'Event description must be no more than 5000 characters' };
  }
  
  return { isValid: true };
}

export function validateTicketPrice(price: number, currency: string): ValidationResult {
  if (price < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }
  
  if (price > 100000) {
    return { isValid: false, error: 'Price exceeds maximum allowed value' };
  }
  
  // Check for valid decimal places based on currency
  const decimalParts = price.toString().split('.');
  if (decimalParts[1] && decimalParts[1].length > 2) {
    return { isValid: false, error: 'Price cannot have more than 2 decimal places' };
  }
  
  return { isValid: true };
}

export function validateEventCapacity(capacity: number): ValidationResult {
  if (!Number.isInteger(capacity)) {
    return { isValid: false, error: 'Capacity must be a whole number' };
  }
  
  if (capacity < 1) {
    return { isValid: false, error: 'Capacity must be at least 1' };
  }
  
  if (capacity > 100000) {
    return { isValid: false, error: 'Capacity exceeds maximum allowed value' };
  }
  
  return { isValid: true };
}

// ============================================================
// REGISTRATION VALIDATORS
// ============================================================

export function validateRegistrationData(data: {
  name: string;
  email: string;
  phone?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validate name
  const nameResult = validateRequired(data.name, 'Name');
  if (!nameResult.isValid) {
    errors.name = nameResult.error!;
  } else if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  // Validate email
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Validate phone if provided
  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================
// API INPUT VALIDATION
// ============================================================

export function validateApiKey(key: string): boolean {
  // API keys should be at least 32 characters and alphanumeric
  return /^[a-zA-Z0-9]{32,}$/.test(key);
}

export function validateWebhookUrl(url: string): ValidationResult {
  if (!isValidHttpsUrl(url)) {
    return { isValid: false, error: 'Webhook URL must use HTTPS' };
  }
  
  // Prevent localhost in production
  const domain = extractDomain(url);
  if (domain === 'localhost' || domain === '127.0.0.1') {
    return { isValid: false, error: 'Localhost URLs are not allowed for webhooks' };
  }
  
  return { isValid: true };
}

// ============================================================
// EXPORT COMBINED VALIDATORS
// ============================================================

export const validators = {
  email: {
    isValid: isValidEmail,
    isBusiness: isBusinessEmail,
    normalize: normalizeEmail,
  },
  password: {
    validate: validatePassword,
    isCommon: isCommonPassword,
  },
  username: {
    isValid: isValidUsername,
    sanitize: sanitizeUsername,
    isReserved: isReservedUsername,
  },
  phone: {
    isValid: isValidPhoneNumber,
    format: formatPhoneNumber,
    normalize: normalizePhoneNumber,
  },
  url: {
    isValid: isValidUrl,
    isHttps: isValidHttpsUrl,
    extractDomain,
  },
  date: {
    isValid: isValidDateString,
    isFuture: isDateInFuture,
    isPast: isDateInPast,
    isWithinRange: isDateWithinRange,
  },
  number: {
    isValidCapacity,
    isValidPrice,
    isValidPercentage,
    isValidAge,
  },
  text: {
    escapeHtml,
    stripHtmlTags,
    normalizeWhitespace,
    truncateText,
    sanitize: sanitizeInput,
    sanitizeRichText,
  },
};

export default validators;
