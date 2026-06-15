import { OnboardingWizard } from '@/features/auth/onboarding-wizard';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const clerkUser = await currentUser();
  const onboardingCompleted = clerkUser?.publicMetadata?.onboardingCompleted;

  if (onboardingCompleted) {
    redirect('/explore');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <OnboardingWizard />
    </div>
  );
}

