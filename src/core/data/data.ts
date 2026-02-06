import type { Session, Event, User } from '@/types';

export const SESSIONS: Session[] = [
  { id: 's1', title: 'Opening Keynote', speaker: 'Jane Doe', time: '09:00 AM - 10:00 AM', track: 'General', description: 'Join us for the opening keynote to kick off Eventra!', location: 'Main Hall' },
  { id: 's2', title: 'Modern Web Development with Next.js', speaker: 'John Smith', time: '10:30 AM - 11:30 AM', track: 'Tech', description: 'A deep dive into the latest features of Next.js.', location: 'Room A' },
];

export const EVENTS: Event[] = [
    {
        id: 'e1',
        title: 'React Workshop',
        startDate: new Date('2024-10-26T11:00:00'),
        endDate: new Date('2024-10-26T13:00:00'),
        location: 'Room 101',
        category: 'Workshop',
        type: 'workshop',
        status: 'published',
        organizerId: 'org1',
        capacity: 100,
        registeredCount: 0,
        description: 'A hands-on workshop for students to learn the basics of React.'
    }
];

export const ORGANIZERS: User[] = [
  {
    id: 'org1',
    name: 'Admin Organizer',
    email: 'organizer@eventra.app',
    role: 'organizer',
    onboardingCompleted: true,
    points: 0
  }
];

export const AGENDA_STRING = SESSIONS.map(s => `ID: ${s.id}, Title: ${s.title}, Speaker: ${s.speaker}, Track: ${s.track}, Time: ${s.time}`).join('\n');