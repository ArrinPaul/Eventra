import { StakeholderReportView } from '@/components/analytics/stakeholder-share-view';

export const metadata = {
  title: 'Shared Report | Eventra',
  description: 'View real-time event analytics and registration data.',
};

export default function SharedReportPage({ params }: { params: { token: string } }) {
  return <StakeholderReportView token={params.token} />;
}
