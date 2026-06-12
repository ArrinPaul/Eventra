'use client';

import { useAuth } from "@/hooks/use-auth";
import OrganizerDashboard from "@/features/dashboard/organizer-dashboard-client";
import AttendeeDashboard from "@/features/dashboard/attendee-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardClient() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-notion-hairline border-t-notion-primary animate-spin" />
                    <p className="text-body-sm text-notion-ink-muted">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Auth wrapper usually handles redirect
    }

    // Role-based routing
    if (user.role === 'organizer' || user.role === 'admin') {
        return <OrganizerDashboard />;
    }
    
    // Default to Attendee Dashboard for students and professionals
    return <AttendeeDashboard />;
}
