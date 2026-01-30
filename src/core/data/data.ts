import type { LegacySession as Session, LegacyEvent as Event, User } from '@/types';

export const SESSIONS: Session[] = [
  { id: 's1', title: 'Opening Keynote', speaker: 'Jane Doe', time: '09:00 AM - 10:00 AM', track: 'General', description: 'Join us for the opening keynote to kick off EventOS!', location: 'Main Hall' },
  { id: 's2', title: 'Modern Web Development with Next.js', speaker: 'John Smith', time: '10:30 AM - 11:30 AM', track: 'Tech', description: 'A deep dive into the latest features of Next.js.', location: 'Room A' },
  { id: 's3', title: 'UI/UX Design Principles', speaker: 'Emily White', time: '10:30 AM - 11:30 AM', track: 'Design', description: 'Learn the fundamentals of creating beautiful and intuitive user interfaces.', location: 'Room B' },
  { id: 's4', title: 'Building a Startup', speaker: 'Michael Brown', time: '01:00 PM - 02:00 PM', track: 'Business', description: 'From idea to MVP: a guide to launching your own tech startup.', location: 'Room A' },
  { id: 's5', title: 'AI in Practice', speaker: 'Dr. Alan Grant', time: '02:30 PM - 03:30 PM', track: 'Tech', description: 'Exploring real-world applications of artificial intelligence.', location: 'Main Hall' },
  { id: 's6', title: 'The Art of Pitching', speaker: 'Sarah Green', time: '02:30 PM - 03:30 PM', track: 'Business', description: 'Master the art of presenting your ideas to investors and stakeholders.', location: 'Room B' },
  { id: 's7', title: 'Advanced CSS Animations', speaker: 'Chris Lee', time: '04:00 PM - 05:00 PM', track: 'Design', description: 'Take your web animations to the next level with advanced CSS techniques.', location: 'Room C' },
];

export const EVENTS: Event[] = [
    {
        id: 'e1',
        title: 'React Workshop',
        date: '2024-10-26',
        time: '11:00 AM',
        location: 'Room 101',
        category: 'Workshop',
        targetAudience: 'Student',
        description: 'A hands-on workshop for students to learn the basics of React.'
    },
    {
        id: 'e2',
        title: 'Networking Mixer',
        date: '2024-10-26',
        time: '6:00 PM',
        location: 'Main Hall',
        category: 'Talk',
        targetAudience: 'Both',
        description: 'Meet and greet with professionals and fellow students.'
    },
    {
        id: 'e3',
        title: 'Fireside Chat with Tech Leaders',
        date: '2024-10-27',
        time: '3:00 PM',
        location: 'Auditorium',
        category: 'Panel',
        targetAudience: 'Professional',
        description: 'An exclusive panel discussion with industry leaders for professionals.'
    }
];

export const ORGANIZERS: User[] = [
  {
    id: 'org1',
    name: 'Admin Organizer',
    email: 'organizer@eventos.com',
    role: 'organizer',
    company: 'EventOS',
    designation: 'Lead Organizer',
    mobile: '1234567890',
    foodChoice: 'veg',
    emergencyContact: { name: 'Admin', number: '0987654321' },
    registrationId: 'ORG-001',
    checkedIn: true,
    myEvents: [],
    interests: 'Event Management, Technology',
    points: 0
  }
];

export const AGENDA_STRING = SESSIONS.map(s => `ID: ${s.id}, Title: ${s.title}, Speaker: ${s.speaker}, Track: ${s.track}, Time: ${s.time}`).join('\n');
