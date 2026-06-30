import { describe, it, expect } from 'vitest';
import { signTicket, verifyTicket, generateQrPayload, parseQrPayload, generateEntryCode } from './crypto';

describe('Crypto Utilities - QR Tickets', () => {
  const testTicketNumber = 'TKT-123456-ABC';

  it('should sign a ticket number consistently', () => {
    const sig1 = signTicket(testTicketNumber);
    const sig2 = signTicket(testTicketNumber);
    
    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(16);
  });

  it('should verify a valid ticket signature', () => {
    const signature = signTicket(testTicketNumber);
    const isValid = verifyTicket(testTicketNumber, signature);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid/forged signature', () => {
    const isValid = verifyTicket(testTicketNumber, 'invalid-signature');
    expect(isValid).toBe(false);
  });

  it('should generate a correct QR payload format', () => {
    const payload = generateQrPayload(testTicketNumber);
    expect(payload).toContain(testTicketNumber);
    expect(payload.split(':').length).toBe(2);
  });

  it('should parse and verify a valid QR payload', () => {
    const payload = generateQrPayload(testTicketNumber);
    const { ticketNumber, isValid } = parseQrPayload(payload);
    
    expect(ticketNumber).toBe(testTicketNumber);
    expect(isValid).toBe(true);
  });

  it('should reject a malformed QR payload', () => {
    const { ticketNumber, isValid } = parseQrPayload('malformed-payload-no-colon');
    expect(ticketNumber).toBeNull();
    expect(isValid).toBe(false);
  });

  it('should generate a valid 6-digit entry code', () => {
    const code = generateEntryCode();
    expect(code).toMatch(/^\d{6}$/);
  });
});
