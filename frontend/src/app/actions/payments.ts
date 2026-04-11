'use server';

export async function processTicketCancellation(_ticketId: string) {
  return { success: true };
}

export async function createCheckoutSession(_data: any) {
  return { url: '#' };
}
