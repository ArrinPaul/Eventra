import CampusMapClient from '@/components/map/campus-map-client';

export const metadata = {
  title: 'Campus Map | Eventra',
  description: 'Interactive campus map with live event locations, directions, and venue information.',
};

export default function MapPage() {
  return <CampusMapClient />;
}
