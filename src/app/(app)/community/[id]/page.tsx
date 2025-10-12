import { CommunityDetailClient } from '@/components/community/community-detail';

interface CommunityDetailPageProps {
  params: {
    id: string;
  };
}

export default function CommunityDetailPage({ params }: CommunityDetailPageProps) {
  return <CommunityDetailClient communityId={params.id} />;
}