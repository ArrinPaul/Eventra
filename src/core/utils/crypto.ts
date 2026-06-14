import { createHmac } from 'crypto';

const SECRET = process.env.QR_SECRET || 'eventra-default-secret-change-me-in-production';

/**
 * Sign a ticket number to prevent QR spoofing.
 */
export function signTicket(ticketNumber: string): string {
  return createHmac('sha256', SECRET)
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
