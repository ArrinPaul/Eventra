import { CommunityDetailClient } from '@/components/community/community-detail';

interface CommunityDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  const { id } = await params;
  return <CommunityDetailClient communityId={id} />;
}