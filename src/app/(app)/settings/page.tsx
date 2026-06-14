import { redirect } from 'next/navigation';

// Settings route redirects to the existing preferences page
export default function SettingsPage() {
  redirect('/preferences');
}
