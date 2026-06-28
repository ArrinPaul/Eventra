export interface CampusLocation {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'main-gate',
    name: 'Main Gate',
    description: 'Campus main entrance and security checkpoint',
    lat: 12.863788,
    lng: 77.434897,
    category: 'admin',
  },
  {
    id: 'cross-road',
    name: 'Cross Road',
    description: 'Central intersection connecting campus zones',
    lat: 12.86279,
    lng: 77.437411,
    category: 'outdoor',
  },
  {
    id: 'block-1',
    name: 'Block 1',
    description: 'Academic block with lecture halls',
    lat: 12.863154,
    lng: 77.437718,
    category: 'academic',
  },
  {
    id: 'students-square',
    name: 'Students Square',
    description: 'Open gathering area for students',
    lat: 12.862314,
    lng: 77.43824,
    category: 'outdoor',
  },
  {
    id: 'open-auditorium',
    name: 'Open Auditorium',
    description: 'Outdoor amphitheater for events',
    lat: 12.86251,
    lng: 77.438496,
    category: 'academic',
  },
  {
    id: 'block-4',
    name: 'Block 4',
    description: 'Engineering and technology block',
    lat: 12.862211,
    lng: 77.43886,
    category: 'academic',
  },
  {
    id: 'xpress-cafe',
    name: 'Xpress Cafe',
    description: 'Student cafeteria and food court',
    lat: 12.862045,
    lng: 77.439374,
    category: 'dining',
  },
  {
    id: 'block-6',
    name: 'Block 6',
    description: 'Research and postgraduate block',
    lat: 12.862103,
    lng: 77.439809,
    category: 'academic',
  },
  {
    id: 'amphi-theater',
    name: 'Amphi Theater',
    description: 'Large amphitheater for cultural events',
    lat: 12.861424,
    lng: 77.438057,
    category: 'academic',
  },
  {
    id: 'pu-block',
    name: 'PU Block',
    description: 'Planning and urban studies block',
    lat: 12.860511,
    lng: 77.437249,
    category: 'academic',
  },
  {
    id: 'architecture-block',
    name: 'Architecture Block',
    description: 'Architecture and design department',
    lat: 12.860132,
    lng: 77.438592,
    category: 'academic',
  },
];

export function getCampusLocationById(id: string): CampusLocation | undefined {
  return CAMPUS_LOCATIONS.find((loc) => loc.id === id);
}

export function getCampusLocationsByCategory(category: string): CampusLocation[] {
  return CAMPUS_LOCATIONS.filter((loc) => loc.category === category);
}
