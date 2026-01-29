/**
 * Unit Tests for Event Registration Flow
 * Tests the core registration transaction logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock types
interface Event {
  id: string;
  title: string;
  capacity: number;
  registeredCount: number;
  waitlistEnabled: boolean;
  ticketTiers: TicketTier[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Registration {
  id: string;
  userId: string;
  eventId: string;
  ticketTierId: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'waitlisted';
  createdAt: Date;
  ticketNumber: string;
}

// Mock registration functions
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVT-${timestamp}-${random}`;
}

function validateRegistration(event: Event, user: User, ticketTierId: string): { valid: boolean; error?: string } {
  // Check event status
  if (event.status !== 'published') {
    return { valid: false, error: 'Event is not available for registration' };
  }

  // Check capacity
  if (event.registeredCount >= event.capacity && !event.waitlistEnabled) {
    return { valid: false, error: 'Event is at full capacity' };
  }

  // Check ticket tier
  const tier = event.ticketTiers.find(t => t.id === ticketTierId);
  if (!tier) {
    return { valid: false, error: 'Invalid ticket tier' };
  }

  // Check tier availability
  if (tier.sold >= tier.quantity) {
    return { valid: false, error: 'Selected ticket tier is sold out' };
  }

  return { valid: true };
}

function createRegistration(
  event: Event, 
  user: User, 
  ticketTierId: string
): Registration | null {
  const validation = validateRegistration(event, user, ticketTierId);
  if (!validation.valid) {
    return null;
  }

  const isWaitlisted = event.registeredCount >= event.capacity;

  return {
    id: `reg_${Date.now()}`,
    userId: user.id,
    eventId: event.id,
    ticketTierId,
    status: isWaitlisted ? 'waitlisted' : 'confirmed',
    createdAt: new Date(),
    ticketNumber: generateTicketNumber(),
  };
}

function calculateRegistrationStats(event: Event) {
  const totalCapacity = event.capacity;
  const registered = event.registeredCount;
  const available = Math.max(0, totalCapacity - registered);
  const fillRate = totalCapacity > 0 ? (registered / totalCapacity) * 100 : 0;
  const isSoldOut = available === 0;
  const isAlmostFull = fillRate >= 90 && !isSoldOut;

  return {
    totalCapacity,
    registered,
    available,
    fillRate: Math.round(fillRate * 10) / 10,
    isSoldOut,
    isAlmostFull,
  };
}

// Tests
describe('Event Registration', () => {
  let mockEvent: Event;
  let mockUser: User;

  beforeEach(() => {
    mockEvent = {
      id: 'event_1',
      title: 'Tech Conference 2026',
      capacity: 100,
      registeredCount: 50,
      waitlistEnabled: false,
      ticketTiers: [
        { id: 'tier_1', name: 'General', price: 0, quantity: 80, sold: 40 },
        { id: 'tier_2', name: 'VIP', price: 50, quantity: 20, sold: 10 },
      ],
      status: 'published',
    };

    mockUser = {
      id: 'user_1',
      name: 'John Doe',
      email: 'john@example.com',
    };
  });

  describe('Ticket Number Generation', () => {
    it('should generate a unique ticket number', () => {
      const ticket1 = generateTicketNumber();
      const ticket2 = generateTicketNumber();
      
      expect(ticket1).toMatch(/^EVT-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(ticket2).toMatch(/^EVT-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(ticket1).not.toBe(ticket2);
    });

    it('should generate ticket numbers with correct prefix', () => {
      const ticket = generateTicketNumber();
      expect(ticket.startsWith('EVT-')).toBe(true);
    });
  });

  describe('Registration Validation', () => {
    it('should allow registration for published events with capacity', () => {
      const result = validateRegistration(mockEvent, mockUser, 'tier_1');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject registration for draft events', () => {
      mockEvent.status = 'draft';
      const result = validateRegistration(mockEvent, mockUser, 'tier_1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Event is not available for registration');
    });

    it('should reject registration for cancelled events', () => {
      mockEvent.status = 'cancelled';
      const result = validateRegistration(mockEvent, mockUser, 'tier_1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Event is not available for registration');
    });

    it('should reject registration when at full capacity without waitlist', () => {
      mockEvent.registeredCount = 100;
      mockEvent.waitlistEnabled = false;
      const result = validateRegistration(mockEvent, mockUser, 'tier_1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Event is at full capacity');
    });

    it('should allow registration when at capacity with waitlist enabled', () => {
      mockEvent.registeredCount = 100;
      mockEvent.waitlistEnabled = true;
      // Also need to update tier to have availability
      mockEvent.ticketTiers[0].quantity = 150;
      const result = validateRegistration(mockEvent, mockUser, 'tier_1');
      expect(result.valid).toBe(true);
    });

    it('should reject registration for invalid ticket tier', () => {
      const result = validateRegistration(mockEvent, mockUser, 'invalid_tier');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid ticket tier');
    });

    it('should reject registration when ticket tier is sold out', () => {
      mockEvent.ticketTiers[0].sold = 80; // Equal to quantity
      const result = validateRegistration(mockEvent, mockUser, 'tier_1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Selected ticket tier is sold out');
    });
  });

  describe('Registration Creation', () => {
    it('should create a confirmed registration', () => {
      const registration = createRegistration(mockEvent, mockUser, 'tier_1');
      
      expect(registration).not.toBeNull();
      expect(registration!.userId).toBe(mockUser.id);
      expect(registration!.eventId).toBe(mockEvent.id);
      expect(registration!.ticketTierId).toBe('tier_1');
      expect(registration!.status).toBe('confirmed');
      expect(registration!.ticketNumber).toMatch(/^EVT-/);
    });

    it('should create a waitlisted registration when at capacity', () => {
      mockEvent.registeredCount = 100;
      mockEvent.waitlistEnabled = true;
      mockEvent.ticketTiers[0].quantity = 150;
      
      const registration = createRegistration(mockEvent, mockUser, 'tier_1');
      
      expect(registration).not.toBeNull();
      expect(registration!.status).toBe('waitlisted');
    });

    it('should return null for invalid registration', () => {
      mockEvent.status = 'cancelled';
      const registration = createRegistration(mockEvent, mockUser, 'tier_1');
      expect(registration).toBeNull();
    });

    it('should set createdAt timestamp', () => {
      const before = new Date();
      const registration = createRegistration(mockEvent, mockUser, 'tier_1');
      const after = new Date();
      
      expect(registration!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(registration!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Registration Statistics', () => {
    it('should calculate correct fill rate', () => {
      const stats = calculateRegistrationStats(mockEvent);
      
      expect(stats.totalCapacity).toBe(100);
      expect(stats.registered).toBe(50);
      expect(stats.available).toBe(50);
      expect(stats.fillRate).toBe(50);
      expect(stats.isSoldOut).toBe(false);
      expect(stats.isAlmostFull).toBe(false);
    });

    it('should detect sold out events', () => {
      mockEvent.registeredCount = 100;
      const stats = calculateRegistrationStats(mockEvent);
      
      expect(stats.available).toBe(0);
      expect(stats.isSoldOut).toBe(true);
      expect(stats.fillRate).toBe(100);
    });

    it('should detect almost full events', () => {
      mockEvent.registeredCount = 92;
      const stats = calculateRegistrationStats(mockEvent);
      
      expect(stats.isAlmostFull).toBe(true);
      expect(stats.isSoldOut).toBe(false);
    });

    it('should handle zero capacity events', () => {
      mockEvent.capacity = 0;
      mockEvent.registeredCount = 0;
      const stats = calculateRegistrationStats(mockEvent);
      
      expect(stats.fillRate).toBe(0);
      expect(stats.available).toBe(0);
    });
  });
});

describe('Ticket Tier Management', () => {
  it('should calculate total available tickets across tiers', () => {
    const tiers: TicketTier[] = [
      { id: '1', name: 'Early Bird', price: 20, quantity: 50, sold: 30 },
      { id: '2', name: 'Regular', price: 40, quantity: 100, sold: 45 },
      { id: '3', name: 'VIP', price: 100, quantity: 20, sold: 15 },
    ];

    const totalAvailable = tiers.reduce((sum, tier) => sum + (tier.quantity - tier.sold), 0);
    const totalSold = tiers.reduce((sum, tier) => sum + tier.sold, 0);

    expect(totalAvailable).toBe(80); // (50-30) + (100-45) + (20-15)
    expect(totalSold).toBe(90);
  });

  it('should identify sold out tiers', () => {
    const tiers: TicketTier[] = [
      { id: '1', name: 'Early Bird', price: 20, quantity: 50, sold: 50 },
      { id: '2', name: 'Regular', price: 40, quantity: 100, sold: 45 },
    ];

    const soldOutTiers = tiers.filter(tier => tier.sold >= tier.quantity);
    const availableTiers = tiers.filter(tier => tier.sold < tier.quantity);

    expect(soldOutTiers).toHaveLength(1);
    expect(soldOutTiers[0].id).toBe('1');
    expect(availableTiers).toHaveLength(1);
  });

  it('should calculate revenue from ticket sales', () => {
    const tiers: TicketTier[] = [
      { id: '1', name: 'Early Bird', price: 20, quantity: 50, sold: 30 },
      { id: '2', name: 'Regular', price: 40, quantity: 100, sold: 45 },
      { id: '3', name: 'VIP', price: 100, quantity: 20, sold: 15 },
    ];

    const totalRevenue = tiers.reduce((sum, tier) => sum + (tier.price * tier.sold), 0);
    expect(totalRevenue).toBe(20*30 + 40*45 + 100*15); // 600 + 1800 + 1500 = 3900
  });
});
