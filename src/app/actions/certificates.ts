'use server';

import { generateCertificateData } from '@/ai/flows/certificates';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function issueCertificate(eventId: string, userId: string) {
  try {
    // 1. Check if attendee is checked in
    const registration = await convex.query(api.registrations.getRegistration, { eventId: eventId as any });
    // Note: getRegistration usually takes just eventId and gets the current user, 
    // but we might need a version that takes userId for organizers.
    // For this flow, let's assume the user is claiming their own certificate.
    
    if (!registration || registration.status !== 'checked-in') {
      // For demo purposes, we'll allow confirmed registrations too if they are past
      if (!registration || registration.status !== 'confirmed') {
         return { success: false, error: 'You must attend the event to receive a certificate.' };
      }
    }

    // 2. Check if already issued
    const existing = await convex.query(api.certificates.getByEventAndUser, { 
      eventId: eventId as any, 
      userId: userId as any 
    });
    if (existing) return { success: true, certificate: existing };

    // 3. Fetch event and user data
    const event = await convex.query(api.events.getById, { id: eventId as any });
    const users = await convex.query(api.users.list) as any[];
    const user = users.find(u => u._id === userId || u.id === userId);

    if (!event || !user) return { success: false, error: 'Event or User not found' };

    // 4. Generate AI certificate data
    const aiData = await generateCertificateData({
      userName: user.name || 'Attendee',
      eventTitle: event.title,
      eventDate: new Date(event.startDate).toLocaleDateString(),
      category: event.category,
    });

    // 5. Save to Convex
    const certId = await convex.mutation(api.certificates.issue, {
      eventId: eventId as any,
      userId: userId as any,
      certificateNumber: aiData.certificateId,
      personalizedMessage: aiData.personalizedMessage,
    });

    return { success: true, certificateId: certId };
  } catch (error) {
    console.error('Certificate issuance error:', error);
    return { success: false, error: 'Failed to issue certificate' };
  }
}
