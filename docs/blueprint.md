# **App Name**: IPX Hub

## Core Features:

- Role-Based Authentication: Implement role-based authentication (Student, Professional, Organizer) to control access to features.
- Personalized Dashboard: Display a personalized dashboard after login, showing user profile summary, registration ID, QR code, welcome message, and quick action cards.
- Agenda Page: List sessions (title, speaker, time, track) allowing users to add sessions to their personal agenda.
- AI-Powered Agenda Recommendation: Placeholder to suggest sessions based on the user's role using a recommendation tool.
- My Events: Show user's personal agenda/events, allowing removal from the agenda. Only accessible after login.
- Group Chat: Shared chat for all attendees with emoji support and private messages to organizers.
- Check-in: Attendees check in using Registration ID or QR code.

## Style Guidelines:

- Light Mode: Background color: Very light gray (#F9FAFB) evoking a sense of cleanliness; surface color: White (#FFFFFF) for content areas.
- Light Mode: Primary color: Medium blue (#2563EB) for key actions; secondary color: Deep violet (#7C3AED) for complementary elements; text color: Dark gray (#111827) providing strong contrast.
- Dark Mode: Background color: Dark slate gray (#0F172A) creating a modern feel; surface color: Dark gray (#1E293B) for content separation.
- Dark Mode: Primary color: Light blue (#3B82F6) for a vibrant highlight; secondary color: Mauve (#C084FC) adding a touch of elegance; text color: Off-white (#F9FAFB) ensuring readability.
- Body text font: 'PT Sans', sans-serif. Headline font: 'Playfair', serif, used to bring a fashionable high-end feel.
- Implement Apple-inspired micro-interactions (soft scale 1.03, subtle shadows, smooth easing 120–180ms, gentle click motion 100–200ms) for all buttons, cards, and interactive elements. Use Framer Motion for smooth transitions and animations.
- Use rounded corners (12–14px) and subtle shadows for buttons and cards. Hide all navigation items until login, then reveal role-based navigation with a smooth animation.