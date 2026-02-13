'use client';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import AdminDashboardClient from '@/components/admin/admin-dashboard';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading || user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <p>Unauthorized access...</p>
            </div>
        );
    }

    return <AdminDashboardClient />;
}
