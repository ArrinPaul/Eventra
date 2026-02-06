'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import OrganizerDashboard from '@/components/dashboard/organizer-dashboard-client';
import { Loader2 } from 'lucide-react';

export default function OrganizerPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect non-organizers after auth is loaded
        if (!loading && user?.role !== 'organizer' && user?.role !== 'admin') {
            router.push('/explore');
        }
    }, [user, loading, router]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Don't render if not authorized (redirect in progress)
    if (user?.role !== 'organizer' && user?.role !== 'admin') {
        return null;
    }

    return <OrganizerDashboard />;
}