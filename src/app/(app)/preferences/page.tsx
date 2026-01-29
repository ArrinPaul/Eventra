'use client';

import { useSearchParams } from 'next/navigation';
import UserPreferencesPanel from '@/components/preferences/user-preferences-panel';

export default function PreferencesPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') as 'notifications' | 'privacy' | 'accessibility' | 'general' | null;

  return (
    <div className="container mx-auto px-4 py-8">
      <UserPreferencesPanel initialTab={tab || 'notifications'} />
    </div>
  );
}