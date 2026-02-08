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
  gender?: string;
  points?: number;
  level?: number;
  checkedIn?: boolean;
  myEvents?: string[];
  wishlist?: string[];
  eventRatings?: Record<string, number>;
  organizationId?: string;
  mobile?: string;
  registrationId?: string;
  notificationPreferences?: Record<string, boolean>;
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
  location: any;
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
  agenda?: any[];
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

export function getUserSkills(_user: User | null): string[] {
  return [];
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
