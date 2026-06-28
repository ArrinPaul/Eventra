import { createHmac } from 'crypto';

const SECRET = process.env.QR_SECRET;
if (!SECRET) {
  console.warn('[crypto] QR_SECRET not set - using fallback for development only');
}
const EFFECTIVE_SECRET = SECRET || 'eventra-dev-only-not-for-production';

/**
 * Sign a ticket number to prevent QR spoofing.
 */
export function signTicket(ticketNumber: string): string {
  return createHmac('sha256', EFFECTIVE_SECRET)
    .update(ticketNumber)
    .digest('hex')
    .substring(0, 16); // 16 chars is enough for this purpose
}

/**
 * Verify a ticket signature.
 */
export function verifyTicket(ticketNumber: string, signature: string): boolean {
  const expected = signTicket(ticketNumber);
  return expected === signature;
}

/**
 * Generate the full QR payload.
 * Format: TKT-NUMBER:SIGNATURE
 */
export function generateQrPayload(ticketNumber: string): string {
  const signature = signTicket(ticketNumber);
  return `${ticketNumber}:${signature}`;
}

/**
 * Parse and verify a QR payload.
 */
export function parseQrPayload(payload: string): { ticketNumber: string | null; isValid: boolean } {
  const [ticketNumber, signature] = payload.split(':');

  if (!ticketNumber || !signature) {
    return { ticketNumber: null, isValid: false };
  }

  const isValid = verifyTicket(ticketNumber, signature);
  return { ticketNumber, isValid };
}

/**
 * Generate a 6-digit entry code for ticket verification.
 * Range: 100000-999999 (always 6 digits).
 */
export function generateEntryCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
