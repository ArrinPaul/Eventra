import { Metadata } from 'next';
import { StakeholderReportView } from '@/components/analytics/stakeholder-share-view';

export const metadata: Metadata = {
  title: 'Event Report | Eventra',
  description: 'View shared event analytics report'
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedReportPage() {
  return <StakeholderReportView />;
}