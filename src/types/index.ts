export type UserRole = 'student' | 'professional' | 'organizer';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  foodChoice: 'veg' | 'non-veg' | 'vegan';
  emergencyContact: {
    name: string;
    number: string;
  };
  registrationId: string;
  checkedIn: boolean;
  myEvents: string[]; // array of session IDs
  interests: string;
}

export interface Student extends BaseUser {
  role: 'student';
  college: string;
  degree: 'ug' | 'pg';
  year: number;
}

export interface Professional extends BaseUser {
  role: 'professional';
  company: string;
  designation: string;
  country: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  bloodGroup: string;
}

export interface Organizer extends BaseUser {
  role: 'organizer';
}

export type User = Student | Professional | Organizer;

export interface Session {
  id: string;
  title: string;
  speaker: string;
  time: string;
  track: 'Tech' | 'Design' | 'Business' | 'General';
  description: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'Workshop' | 'Talk' | 'Panel';
  targetAudience: 'Student' | 'Professional' | 'Both';
  description: string;
}

export interface ChatMessage {
  id: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
    isBot?: boolean;
  };
  to?: string; // Organizer ID for private messages
  content: string;
  timestamp: number;
}
