import { z } from 'zod';

export const eventWizardSchema = z.object({
  // Basic Info
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),
  
  // Date & Location
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date().optional(),
  startTime: z.string(),
  endTime: z.string(),
  locationType: z.enum(['physical', 'virtual', 'hybrid']),
  venue: z.string().optional(),
  address: z.string().optional(),
  virtualLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // Ticketing
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  isFree: z.boolean(),
  price: z.number().min(0).default(0),
  ticketTiers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    description: z.string().optional(),
  })).default([]),
  
  // Settings
  visibility: z.enum(['public', 'private', 'unlisted']),
  targetAudience: z.string(),
  requiresApproval: z.boolean(),
  enableWaitlist: z.boolean(),
  
  // AI Content (Optional)
  agenda: z.array(z.any()).optional(),
  checklist: z.array(z.any()).optional(),
  imageUrl: z.string().optional(),
});

export type EventWizardData = z.infer<typeof eventWizardSchema>;

export const defaultEventValues: EventWizardData = {
  title: '',
  description: '',
  category: '',
  tags: [],
  startDate: new Date(), // Will need handling in form init
  startTime: '09:00',
  endTime: '17:00',
  locationType: 'physical',
  capacity: 100,
  isFree: true,
  price: 0,
  visibility: 'public',
  targetAudience: 'all',
  requiresApproval: false,
  enableWaitlist: false,
  ticketTiers: [],
};
