/**
 * Unit Tests for Input Validation Utilities
 * Tests email, password, and form validation
 */

import { describe, it, expect } from 'vitest';

// Validation utilities
const validators = {
  email: (email: string): { valid: boolean; error?: string } => {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    if (email.length > 254) {
      return { valid: false, error: 'Email is too long' };
    }
    return { valid: true };
  },

  password: (
    password: string,
    options: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    } = {}
  ): { valid: boolean; errors: string[] } => {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
    } = options;

    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  },

  username: (username: string): { valid: boolean; error?: string } => {
    if (!username) {
      return { valid: false, error: 'Username is required' };
    }
    if (username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 30) {
      return { valid: false, error: 'Username must be at most 30 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
  },

  phoneNumber: (phone: string): { valid: boolean; error?: string } => {
    if (!phone) {
      return { valid: true }; // Optional field
    }
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
    return { valid: true };
  },

  url: (url: string): { valid: boolean; error?: string } => {
    if (!url) {
      return { valid: true }; // Optional field
    }
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  },

  date: (dateStr: string): { valid: boolean; error?: string } => {
    if (!dateStr) {
      return { valid: false, error: 'Date is required' };
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }
    return { valid: true };
  },

  futureDate: (dateStr: string): { valid: boolean; error?: string } => {
    const dateValidation = validators.date(dateStr);
    if (!dateValidation.valid) {
      return dateValidation;
    }
    const date = new Date(dateStr);
    if (date <= new Date()) {
      return { valid: false, error: 'Date must be in the future' };
    }
    return { valid: true };
  },

  positiveNumber: (value: number): { valid: boolean; error?: string } => {
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, error: 'Must be a valid number' };
    }
    if (value < 0) {
      return { valid: false, error: 'Must be a positive number' };
    }
    return { valid: true };
  },

  capacity: (capacity: number): { valid: boolean; error?: string } => {
    const numValidation = validators.positiveNumber(capacity);
    if (!numValidation.valid) {
      return numValidation;
    }
    if (capacity < 1) {
      return { valid: false, error: 'Capacity must be at least 1' };
    }
    if (capacity > 100000) {
      return { valid: false, error: 'Capacity cannot exceed 100,000' };
    }
    return { valid: true };
  },

  price: (price: number): { valid: boolean; error?: string } => {
    const numValidation = validators.positiveNumber(price);
    if (!numValidation.valid) {
      return numValidation;
    }
    if (price > 10000) {
      return { valid: false, error: 'Price cannot exceed $10,000' };
    }
    // Check for valid currency format (max 2 decimal places)
    if (Math.round(price * 100) / 100 !== price) {
      return { valid: false, error: 'Price can have at most 2 decimal places' };
    }
    return { valid: true };
  },
};

// Sanitization utilities
const sanitizers = {
  trimAndLowercase: (str: string): string => str.trim().toLowerCase(),
  
  escapeHtml: (str: string): string => {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>"']/g, char => htmlEntities[char]);
  },

  stripTags: (str: string): string => str.replace(/<[^>]*>/g, ''),

  normalizeWhitespace: (str: string): string => str.replace(/\s+/g, ' ').trim(),
};

// Tests
describe('Email Validation', () => {
  it('should accept valid emails', () => {
    expect(validators.email('test@example.com').valid).toBe(true);
    expect(validators.email('user.name@domain.co.uk').valid).toBe(true);
    expect(validators.email('user+tag@example.org').valid).toBe(true);
  });

  it('should reject empty email', () => {
    const result = validators.email('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should reject invalid email formats', () => {
    expect(validators.email('notanemail').valid).toBe(false);
    expect(validators.email('missing@domain').valid).toBe(false);
    expect(validators.email('@nodomain.com').valid).toBe(false);
    expect(validators.email('spaces in@email.com').valid).toBe(false);
  });

  it('should reject excessively long emails', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = validators.email(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email is too long');
  });
});

describe('Password Validation', () => {
  it('should accept valid passwords', () => {
    const result = validators.password('SecureP@ss1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty password', () => {
    const result = validators.password('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('should reject short passwords', () => {
    const result = validators.password('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should require uppercase letters', () => {
    const result = validators.password('lowercase1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should require lowercase letters', () => {
    const result = validators.password('UPPERCASE1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should require numbers', () => {
    const result = validators.password('NoNumbers!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should require special characters', () => {
    const result = validators.password('NoSpecial1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('should respect custom options', () => {
    const result = validators.password('simple', {
      minLength: 6,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    });
    expect(result.valid).toBe(true);
  });
});

describe('Username Validation', () => {
  it('should accept valid usernames', () => {
    expect(validators.username('john_doe').valid).toBe(true);
    expect(validators.username('User123').valid).toBe(true);
    expect(validators.username('abc').valid).toBe(true);
  });

  it('should reject empty username', () => {
    const result = validators.username('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username is required');
  });

  it('should reject too short usernames', () => {
    const result = validators.username('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be at least 3 characters');
  });

  it('should reject too long usernames', () => {
    const result = validators.username('a'.repeat(31));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be at most 30 characters');
  });

  it('should reject special characters', () => {
    expect(validators.username('user@name').valid).toBe(false);
    expect(validators.username('user name').valid).toBe(false);
    expect(validators.username('user-name').valid).toBe(false);
  });
});

describe('Phone Number Validation', () => {
  it('should accept valid phone numbers', () => {
    expect(validators.phoneNumber('+1 (555) 123-4567').valid).toBe(true);
    expect(validators.phoneNumber('555-123-4567').valid).toBe(true);
    expect(validators.phoneNumber('+44 20 7946 0958').valid).toBe(true);
  });

  it('should accept empty phone (optional)', () => {
    expect(validators.phoneNumber('').valid).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(validators.phoneNumber('123').valid).toBe(false);
    expect(validators.phoneNumber('phone').valid).toBe(false);
  });
});

describe('URL Validation', () => {
  it('should accept valid URLs', () => {
    expect(validators.url('https://example.com').valid).toBe(true);
    expect(validators.url('http://localhost:3000').valid).toBe(true);
    expect(validators.url('https://sub.domain.com/path?query=1').valid).toBe(true);
  });

  it('should accept empty URL (optional)', () => {
    expect(validators.url('').valid).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(validators.url('not-a-url').valid).toBe(false);
    expect(validators.url('example.com').valid).toBe(false);
  });
});

describe('Date Validation', () => {
  it('should accept valid dates', () => {
    expect(validators.date('2026-01-29').valid).toBe(true);
    expect(validators.date('January 29, 2026').valid).toBe(true);
  });

  it('should reject empty date', () => {
    const result = validators.date('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Date is required');
  });

  it('should reject invalid dates', () => {
    expect(validators.date('not-a-date').valid).toBe(false);
    expect(validators.date('2026-13-45').valid).toBe(false);
  });
});

describe('Future Date Validation', () => {
  it('should accept future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(validators.futureDate(futureDate.toISOString()).valid).toBe(true);
  });

  it('should reject past dates', () => {
    const result = validators.futureDate('2020-01-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Date must be in the future');
  });
});

describe('Capacity Validation', () => {
  it('should accept valid capacities', () => {
    expect(validators.capacity(1).valid).toBe(true);
    expect(validators.capacity(100).valid).toBe(true);
    expect(validators.capacity(50000).valid).toBe(true);
  });

  it('should reject zero capacity', () => {
    const result = validators.capacity(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Capacity must be at least 1');
  });

  it('should reject negative capacity', () => {
    expect(validators.capacity(-10).valid).toBe(false);
  });

  it('should reject excessive capacity', () => {
    const result = validators.capacity(100001);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Capacity cannot exceed 100,000');
  });
});

describe('Price Validation', () => {
  it('should accept valid prices', () => {
    expect(validators.price(0).valid).toBe(true);
    expect(validators.price(9.99).valid).toBe(true);
    expect(validators.price(100).valid).toBe(true);
  });

  it('should reject negative prices', () => {
    expect(validators.price(-10).valid).toBe(false);
  });

  it('should reject excessive prices', () => {
    const result = validators.price(10001);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Price cannot exceed $10,000');
  });

  it('should reject prices with too many decimal places', () => {
    const result = validators.price(9.999);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Price can have at most 2 decimal places');
  });
});

describe('Sanitizers', () => {
  describe('trimAndLowercase', () => {
    it('should trim and lowercase', () => {
      expect(sanitizers.trimAndLowercase('  HELLO World  ')).toBe('hello world');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(sanitizers.escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should handle all special characters', () => {
      expect(sanitizers.escapeHtml('& < > " \'')).toBe('&amp; &lt; &gt; &quot; &#39;');
    });
  });

  describe('stripTags', () => {
    it('should remove HTML tags', () => {
      expect(sanitizers.stripTags('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should normalize whitespace', () => {
      expect(sanitizers.normalizeWhitespace('  multiple   spaces   here  ')).toBe('multiple spaces here');
    });
  });
});
