import { createHmac, timingSafeEqual, randomInt } from 'crypto';

const SECRET = process.env.QR_SECRET;
if (!SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: QR_SECRET environment variable is not configured in production.');
  }
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
 * Verify a ticket signature using timing-safe comparison.
 */
export function verifyTicket(ticketNumber: string, signature: string): boolean {
  const expected = signTicket(ticketNumber);
  
  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');
  
  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }
  
  return timingSafeEqual(expectedBuf, signatureBuf);
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

export function generateEntryCode(): string {
  return randomInt(100000, 1000000).toString();
}
