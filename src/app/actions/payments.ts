'use server';

export async function createCheckoutSession(
  _eventId: string,
  _userId: string,
  _tierName?: string,
  _discountCode?: string
): Promise<{ url: string | null }> {
  return { url: null };
}

export async function processTicketCancellation(_ticketId: string): Promise<{ success: boolean; message?: string }> {
  return {
    success: true,
    message: 'Cancellation processed.',
  };
}
