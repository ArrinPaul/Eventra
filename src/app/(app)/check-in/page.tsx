import { getUserRegistrations } from '@/app/actions/registrations';
import { auth } from '@clerk/nextjs/server';
import AttendeeCheckInView from '@/features/check-in/attendee-check-in-view';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
    title: 'Check-in | Eventra',
    description: 'Present your QR code or scan attendees.',
};

export default async function CheckInPage() {
    const { userId } = await auth();
    if (!userId) return null;

    // Fetch user registrations
    const registrations = await getUserRegistrations();
    
    // Fetch user role for organizer check
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

    return (
        <AttendeeCheckInView 
            registrations={registrations} 
            isOrganizer={isOrganizer} 
        />
    );
}


