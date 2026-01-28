import { OnboardingWizard } from '@/components/auth/onboarding-wizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <OnboardingWizard />
    </div>
  );
}
