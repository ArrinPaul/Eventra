import { describe, expect, it } from 'vitest';
import {
  isValidCapacity,
  isValidPrice,
  isValidEventDateRange,
  isDateInFuture,
} from '@/core/utils/validation';

describe('Registration Related Validation', () => {
  it('accepts valid capacity values and rejects invalid ones', () => {
    expect(isValidCapacity(1)).toBe(true);
    expect(isValidCapacity(500)).toBe(true);
    expect(isValidCapacity(0)).toBe(false);
    expect(isValidCapacity(100001)).toBe(false);
  });

  it('accepts paid and free ticket prices in allowed range', () => {
    expect(isValidPrice(0)).toBe(true);
    expect(isValidPrice(49.99)).toBe(true);
    expect(isValidPrice(-1)).toBe(false);
  });

  it('validates event date windows for upcoming events', () => {
    const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    expect(isDateInFuture(start)).toBe(true);
    expect(isValidEventDateRange(start, end)).toBe(true);
  });

  it('rejects invalid date ranges where end is before start', () => {
    const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    expect(isValidEventDateRange(start, end)).toBe(false);
  });
});
