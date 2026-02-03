'use client';

import { useAuth } from "@/hooks/use-auth";
import OrganizerDashboard from "@/components/dashboard/organizer-dashboard-client";
import { AttendeeDashboard } from "@/components/dashboard/attendee-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardClient() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0a0b14]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
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