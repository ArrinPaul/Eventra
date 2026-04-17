import ExploreClient from '@/features/events/explore-client';

export const metadata = {
  title: 'Explore Events | Eventra',
  description: 'Discover amazing events happening around you. Filter by category, date, or search for something specific.',
};

export default function ExplorePage() {
  return <ExploreClient />;
}

