/**
 * Eventra Types - Consolidated
 */

export * from '../core/config/eventos-config';

export type UserRole = 'student' | 'professional' | 'organizer' | 'admin' | 'speaker' | 'attendee' | 'vendor';

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  onboardingCompleted?: boolean;
  bio?: string;
  interests?: string;
  college?: string;
  degree?: 'ug' | 'pg';
  year?: number;
  company?: string;
  designation?: string;
  country?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  points?: number;
  level?: number;
  xp?: number;
  checkedIn?: boolean;
  myEvents?: string[];
  wishlist?: string[];
  eventRatings?: Record<string, number>;
  organizationId?: string;
  mobile?: string;
  phone?: string;
  bloodGroup?: string;
  foodChoice?: 'veg' | 'non-veg' | 'vegan';
  emergencyContact?: { name: string; number: string };
  registrationId?: string;
  status?: string;
  notificationPreferences?: Record<string, boolean>;
  referralCode?: string;
  referredBy?: string;
}

export interface EventLocation {
  venue?: string | {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  virtualLink?: string;
}

export interface AgendaItem {
  title: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  speaker?: string;
  type?: string;
}

export interface Event {
  _id?: string;
  id: string;
  title: string;
  description: string;
  startDate: number | Date;
  endDate: number | Date;
  date?: string;
  time?: string;
  location?: EventLocation;
  type: string;
  category: string;
  status: string;
  organizerId: string;
  imageUrl?: string;
  capacity: number;
  registeredCount: number;
  visibility?: 'public' | 'private' | 'unlisted';
  tags?: string[];
  isPaid?: boolean;
  price?: number;
  currency?: string;
  targetAudience?: string;
  agenda?: AgendaItem[];
  speakers?: string[];
  createdAt?: number | Date;
  timezone?: string;
  waitlistEnabled?: boolean;
}

export interface EventTicket {
  _id?: string;
  id: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked-in' | 'refunded';
  purchaseDate: number | Date;
  price: number;
  currency?: string;
  qrCode?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  event?: Partial<Event>;
}

export interface Session {
  id: string;
  title: string;
  speaker: string;
  speakers?: string[];
  time: string;
  startTime?: number | Date;
  endTime?: number | Date;
  track: 'General' | 'Tech' | 'Design' | 'Business' | string;
  type?: string;
  description: string;
  location: string;
  room?: string;
}

export function getUserInterests(user: User | null): string[] {
  if (!user?.interests) return [];
  return user.interests.split(',').map(s => s.trim());
}

export function getUserSkills(user: User | null): string[] {
  if (!user) return [];
  // Extract from interests or provide based on role
  const interests = getUserInterests(user);
  const roleSkills: Record<string, string[]> = {
    'student': ['learning', 'collaboration', 'curiosity'],
    'professional': ['leadership', 'networking', 'strategy'],
    'organizer': ['event management', 'planning', 'logistics'],
    'speaker': ['public speaking', 'presentation', 'expertise'],
    'attendee': ['networking', 'engagement'],
    'vendor': ['sales', 'marketing', 'customer service'],
    'admin': ['oversight', 'management', 'security'],
  };
  
  const skills = new Set([...interests, ...(roleSkills[user.role] || [])]);
  return Array.from(skills);
}

export function getUserAttendedEvents(user: User | null): string[] {
  return user?.myEvents || [];
}

export interface ChatRoom {
  _id?: string;
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'event';
  participants: string[];
  lastMessageAt?: number;
}

export interface ChatMessage {
  _id?: string;
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  sentAt: number;
  senderName?: string;
  senderImage?: string;
}

export interface Community {
  _id?: string;
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  isPrivate?: boolean;
}

export interface FeedPost {
  _id?: string;
  id: string;
  authorId: string;
  content: string;
  likes: number;
  createdAt: number;
  authorName?: string;
  authorImage?: string;
  communityId?: string;
}

export interface UserProfile extends User {}
