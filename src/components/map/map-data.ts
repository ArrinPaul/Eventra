// Campus Map Data Types and Sample Data

export interface CampusZone {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'library' | 'lab' | 'sports' | 'dining' | 'outdoor' | 'parking' | 'admin';
  floor?: number;
  capacity?: number;
  amenities?: string[];
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  connections: string[]; // IDs of connected zones for pathfinding
}

export interface MapEvent {
  id: string;
  title: string;
  zoneId: string;
  startTime: string;
  endTime: string;
  category: string;
  attendees: number;
  description?: string;
}

export interface PathNode {
  id: string;
  name: string;
  x: number;
  y: number;
  instruction?: string;
  distance?: number;
}

// Campus Zones Data
export const CAMPUS_ZONES: CampusZone[] = [
  // Main Entrance
  {
    id: 'main-entrance',
    name: 'Main Entrance',
    description: 'Campus main gate and security checkpoint',
    category: 'admin',
    floor: 0,
    capacity: 200,
    amenities: ['Security', 'Information Desk', 'Wheelchair Access'],
    coordinates: { x: 400, y: 520, width: 80, height: 40 },
    color: '#6366f1',
    connections: ['admin-building', 'central-plaza'],
  },
  // Central Plaza
  {
    id: 'central-plaza',
    name: 'Central Plaza',
    description: 'Open area for gatherings and outdoor events',
    category: 'outdoor',
    floor: 0,
    capacity: 500,
    amenities: ['Seating', 'Fountain', 'WiFi', 'Shade'],
    coordinates: { x: 340, y: 380, width: 200, height: 120 },
    color: '#22c55e',
    connections: ['main-entrance', 'main-hall', 'library', 'science-building', 'cafeteria'],
  },
  // Main Hall
  {
    id: 'main-hall',
    name: 'Main Auditorium',
    description: 'Large auditorium for conferences and presentations',
    category: 'academic',
    floor: 0,
    capacity: 800,
    amenities: ['Projector', 'Sound System', 'AC', 'Stage', 'Backstage'],
    coordinates: { x: 180, y: 280, width: 140, height: 100 },
    color: '#f59e0b',
    connections: ['central-plaza', 'seminar-rooms', 'admin-building'],
  },
  // Library
  {
    id: 'library',
    name: 'Central Library',
    description: 'Multi-floor library with study rooms and digital resources',
    category: 'library',
    floor: 0,
    capacity: 400,
    amenities: ['Study Rooms', 'Computers', 'Printing', 'WiFi', 'Quiet Zones'],
    coordinates: { x: 560, y: 280, width: 120, height: 100 },
    color: '#8b5cf6',
    connections: ['central-plaza', 'computer-lab', 'research-center'],
  },
  // Science Building
  {
    id: 'science-building',
    name: 'Science Complex',
    description: 'Chemistry, Physics, and Biology departments',
    category: 'academic',
    floor: 0,
    capacity: 600,
    amenities: ['Labs', 'Lecture Halls', 'Research Facilities'],
    coordinates: { x: 340, y: 160, width: 160, height: 100 },
    color: '#ef4444',
    connections: ['central-plaza', 'chemistry-lab', 'physics-lab', 'research-center'],
  },
  // Chemistry Lab
  {
    id: 'chemistry-lab',
    name: 'Chemistry Laboratory',
    description: 'Advanced chemistry research and teaching lab',
    category: 'lab',
    floor: 1,
    capacity: 60,
    amenities: ['Fume Hoods', 'Safety Equipment', 'Lab Stations'],
    coordinates: { x: 280, y: 80, width: 100, height: 60 },
    color: '#06b6d4',
    connections: ['science-building', 'physics-lab'],
  },
  // Physics Lab
  {
    id: 'physics-lab',
    name: 'Physics Laboratory',
    description: 'Physics experiments and demonstrations',
    category: 'lab',
    floor: 1,
    capacity: 50,
    amenities: ['Equipment', 'Experiment Stations', 'Observatory Access'],
    coordinates: { x: 400, y: 80, width: 100, height: 60 },
    color: '#06b6d4',
    connections: ['science-building', 'chemistry-lab'],
  },
  // Computer Lab
  {
    id: 'computer-lab',
    name: 'Computer Lab',
    description: 'High-performance computing facility',
    category: 'lab',
    floor: 0,
    capacity: 80,
    amenities: ['High-end PCs', 'Software Suite', 'Printing', '3D Printers'],
    coordinates: { x: 620, y: 160, width: 100, height: 80 },
    color: '#06b6d4',
    connections: ['library', 'tech-hub'],
  },
  // Research Center
  {
    id: 'research-center',
    name: 'Research Center',
    description: 'Graduate research and innovation hub',
    category: 'academic',
    floor: 0,
    capacity: 150,
    amenities: ['Meeting Rooms', 'Lab Space', 'Collaboration Areas'],
    coordinates: { x: 520, y: 160, width: 80, height: 80 },
    color: '#f59e0b',
    connections: ['library', 'science-building'],
  },
  // Cafeteria
  {
    id: 'cafeteria',
    name: 'Main Cafeteria',
    description: 'Food court with multiple dining options',
    category: 'dining',
    floor: 0,
    capacity: 300,
    amenities: ['Multiple Cuisines', 'Veg Options', 'Seating', 'AC'],
    coordinates: { x: 180, y: 400, width: 120, height: 80 },
    color: '#ec4899',
    connections: ['central-plaza', 'sports-complex'],
  },
  // Sports Complex
  {
    id: 'sports-complex',
    name: 'Sports Complex',
    description: 'Indoor and outdoor sports facilities',
    category: 'sports',
    floor: 0,
    capacity: 1000,
    amenities: ['Gymnasium', 'Swimming Pool', 'Courts', 'Track'],
    coordinates: { x: 80, y: 400, width: 80, height: 120 },
    color: '#14b8a6',
    connections: ['cafeteria', 'outdoor-field'],
  },
  // Outdoor Field
  {
    id: 'outdoor-field',
    name: 'Outdoor Sports Field',
    description: 'Football field and running track',
    category: 'outdoor',
    floor: 0,
    capacity: 2000,
    amenities: ['Track', 'Football Field', 'Bleachers', 'Lights'],
    coordinates: { x: 80, y: 200, width: 80, height: 180 },
    color: '#22c55e',
    connections: ['sports-complex', 'main-hall'],
  },
  // Seminar Rooms
  {
    id: 'seminar-rooms',
    name: 'Seminar Block',
    description: 'Multiple seminar and workshop rooms',
    category: 'academic',
    floor: 0,
    capacity: 200,
    amenities: ['Projectors', 'Whiteboards', 'Video Conferencing'],
    coordinates: { x: 180, y: 160, width: 80, height: 100 },
    color: '#f59e0b',
    connections: ['main-hall', 'admin-building'],
  },
  // Admin Building
  {
    id: 'admin-building',
    name: 'Administration Building',
    description: 'Administrative offices and student services',
    category: 'admin',
    floor: 0,
    capacity: 100,
    amenities: ['Offices', 'Student Services', 'Meeting Rooms'],
    coordinates: { x: 280, y: 420, width: 100, height: 60 },
    color: '#6366f1',
    connections: ['main-entrance', 'central-plaza', 'main-hall'],
  },
  // Tech Hub
  {
    id: 'tech-hub',
    name: 'Innovation Hub',
    description: 'Startup incubator and tech workshops',
    category: 'lab',
    floor: 0,
    capacity: 100,
    amenities: ['Co-working Space', 'Maker Lab', 'Meeting Pods'],
    coordinates: { x: 620, y: 260, width: 100, height: 80 },
    color: '#06b6d4',
    connections: ['computer-lab', 'library'],
  },
  // Parking Lot
  {
    id: 'parking',
    name: 'Parking Area',
    description: 'Student and staff parking',
    category: 'parking',
    floor: 0,
    capacity: 500,
    amenities: ['Covered Parking', 'EV Charging', 'Security'],
    coordinates: { x: 620, y: 420, width: 120, height: 100 },
    color: '#64748b',
    connections: ['main-entrance', 'library'],
  },
];

// Sample Events
export const SAMPLE_EVENTS: MapEvent[] = [
  {
    id: 'event-1',
    title: 'AI/ML Workshop',
    zoneId: 'computer-lab',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    category: 'Workshop',
    attendees: 45,
    description: 'Hands-on machine learning workshop',
  },
  {
    id: 'event-2',
    title: 'Startup Pitch Day',
    zoneId: 'main-hall',
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    category: 'Conference',
    attendees: 200,
    description: 'Annual startup pitch competition',
  },
  {
    id: 'event-3',
    title: 'Robotics Demo',
    zoneId: 'tech-hub',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    category: 'Demo',
    attendees: 30,
    description: 'Robotics club demonstration',
  },
  {
    id: 'event-4',
    title: 'Study Group: Data Structures',
    zoneId: 'library',
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    category: 'Study',
    attendees: 15,
    description: 'Collaborative study session',
  },
  {
    id: 'event-5',
    title: 'Chemistry Symposium',
    zoneId: 'chemistry-lab',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    category: 'Symposium',
    attendees: 40,
    description: 'Research presentations',
  },
  {
    id: 'event-6',
    title: 'Basketball Tournament',
    zoneId: 'sports-complex',
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    category: 'Sports',
    attendees: 150,
    description: 'Inter-department basketball tournament',
  },
  {
    id: 'event-7',
    title: 'Outdoor Movie Night',
    zoneId: 'central-plaza',
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
    category: 'Entertainment',
    attendees: 250,
    description: 'Weekly outdoor movie screening',
  },
];

// Pathfinding using BFS
export function findPath(startId: string, endId: string): PathNode[] {
  const zones = new Map(CAMPUS_ZONES.map(z => [z.id, z]));
  const startZone = zones.get(startId);
  const endZone = zones.get(endId);
  
  if (!startZone || !endZone) return [];
  
  // BFS to find shortest path
  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);
  
  while (queue.length > 0) {
    const path = queue.shift()!;
    const currentId = path[path.length - 1];
    const current = zones.get(currentId)!;
    
    if (currentId === endId) {
      // Convert path IDs to PathNodes with instructions
      return path.map((id, index) => {
        const zone = zones.get(id)!;
        const nextZone = index < path.length - 1 ? zones.get(path[index + 1]) : null;
        
        let instruction = '';
        if (index === 0) {
          instruction = 'Start here';
        } else if (index === path.length - 1) {
          instruction = 'You have arrived at your destination';
        } else if (nextZone) {
          // Calculate direction
          const dx = nextZone.coordinates.x - zone.coordinates.x;
          const dy = nextZone.coordinates.y - zone.coordinates.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            instruction = dx > 0 ? 'Head east towards ' + nextZone.name : 'Head west towards ' + nextZone.name;
          } else {
            instruction = dy > 0 ? 'Head south towards ' + nextZone.name : 'Head north towards ' + nextZone.name;
          }
        }
        
        // Calculate distance to next node
        let distance = 0;
        if (nextZone) {
          const dx = nextZone.coordinates.x - zone.coordinates.x;
          const dy = nextZone.coordinates.y - zone.coordinates.y;
          distance = Math.round(Math.sqrt(dx * dx + dy * dy) * 0.5); // Scale to approximate meters
        }
        
        return {
          id: zone.id,
          name: zone.name,
          x: zone.coordinates.x + zone.coordinates.width / 2,
          y: zone.coordinates.y + zone.coordinates.height / 2,
          instruction,
          distance,
        };
      });
    }
    
    // Explore neighbors
    for (const neighborId of current.connections) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push([...path, neighborId]);
      }
    }
  }
  
  return []; // No path found
}

// Get zone center coordinates
export function getZoneCenter(zone: CampusZone): { x: number; y: number } {
  return {
    x: zone.coordinates.x + zone.coordinates.width / 2,
    y: zone.coordinates.y + zone.coordinates.height / 2,
  };
}

// Check if a zone has live events
export function hasLiveEvents(zoneId: string, events: MapEvent[]): boolean {
  const now = new Date();
  return events.some(event => {
    if (event.zoneId !== zoneId) return false;
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return now >= start && now <= end;
  });
}
