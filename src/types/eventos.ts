/**
 * Enhanced User Types for EventOS Multi-Tenant Platform
 */

export type EventOSRole = 
  | 'attendee' 
  | 'speaker' 
  | 'organizer' 
  | 'admin' 
  | 'moderator' 
  | 'vendor' 
  | 'volunteer' 
  | 'sponsor' 
  | 'media';

// Organization/Tenant Types
export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  
  // Subscription & Billing
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  billingEmail: string;
  customerId?: string; // Stripe customer ID
  subscriptionId?: string;
  trialEndsAt?: Date;
  
  // Customization
  customDomain?: string;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    favicon: string;
  };
  
  // Settings
  settings: OrganizationSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  
  // Multi-tenant features
  isActive: boolean;
  features: string[]; // Array of enabled features
}

export interface OrganizationSettings {
  // General settings
  timezone: string;
  language: string;
  dateFormat: string;
  
  // Event settings
  defaultEventDuration: number; // minutes
  allowPublicEvents: boolean;
  requireApprovalForEvents: boolean;
  
  // User settings
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: EventOSRole;
  
  // Integration settings
  enabledIntegrations: string[];
  
  // Security settings
  enforceSSO: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

// Enhanced User Types
export interface BaseUser {
  id: string;
  uid: string; // Firebase user ID
  email: string;
  name: string;
  role: EventOSRole;
  
  // Basic profile information
  avatar?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  bio?: string;
  
  // Organization association
  organizationId: string;
  organizationRole: EventOSRole; // Role within the organization
  
  // Authentication & Security
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Privacy & Preferences
  privacy: {
    profileVisibility: 'public' | 'organization' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    allowDirectMessages: boolean;
  };
  
  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    digest: 'none' | 'daily' | 'weekly';
  };
  
  // EventOS specific
  preferences: UserPreferences;
  metadata: Record<string, any>;
}

export interface UserPreferences {
  // Event preferences
  defaultEventView: 'calendar' | 'list' | 'grid';
  autoAcceptMeetings: boolean;
  reminderSettings: {
    beforeEvent: number; // minutes
    method: 'email' | 'push' | 'both';
  };
  
  // AI preferences
  aiAssistantEnabled: boolean;
  aiRecommendations: boolean;
  dataForAI: boolean; // Allow data to be used for AI training
  
  // UI preferences
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  animationsEnabled: boolean;
}

// Role-specific User Types
export interface Attendee extends BaseUser {
  role: 'attendee';
  attendeeProfile: {
    interests: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    jobTitle?: string;
    company?: string;
    industry?: string;
    experience?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    websiteUrl?: string;
  };
  
  // Event-related
  registeredEvents: string[];
  attendedEvents: string[];
  favoriteEvents: string[];
  checkInHistory: EventCheckIn[];
  
  // Networking
  connections: string[]; // User IDs
  networking: {
    lookingFor: string[]; // What they're looking to connect about
    canOffer: string[]; // What they can help with
    preferredContactMethod: 'email' | 'linkedin' | 'app';
  };
}

export interface Speaker extends BaseUser {
  role: 'speaker';
  speakerProfile: {
    title: string; // Professional title
    company: string;
    bio: string;
    expertise: string[];
    socialLinks: {
      linkedin?: string;
      twitter?: string;
      website?: string;
      github?: string;
    };
    
    // Speaking experience
    previousTalks: PreviousTalk[];
    topics: string[]; // Topics they can speak about
    
    // Availability
    availableForSpeaking: boolean;
    travelWillingness: 'local' | 'national' | 'international';
    speakingFee?: {
      amount: number;
      currency: string;
      negotiable: boolean;
    };
  };
  
  // Sessions
  submittedSessions: string[];
  approvedSessions: string[];
  completedSessions: string[];
}

export interface Organizer extends BaseUser {
  role: 'organizer';
  organizerProfile: {
    title: string;
    department?: string;
    permissions: OrganizerPermission[];
    
    // Experience
    eventsOrganized: number;
    yearsExperience?: number;
    specializations: string[]; // Types of events they specialize in
    
    // Contact preferences for vendors/speakers
    preferredContactHours: {
      start: string; // "09:00"
      end: string;   // "17:00"
      timezone: string;
    };
  };
  
  // Events
  managedEvents: string[];
  createdEvents: string[];
}

export interface Admin extends BaseUser {
  role: 'admin';
  adminProfile: {
    level: 'super' | 'organization' | 'event';
    permissions: AdminPermission[];
    accessLevel: number; // 1-10, 10 being highest
    
    // Admin metadata
    lastAdminAction?: Date;
    adminSince: Date;
  };
}

export interface Vendor extends BaseUser {
  role: 'vendor';
  vendorProfile: {
    companyName: string;
    services: string[];
    serviceArea: 'local' | 'regional' | 'national' | 'international';
    website: string;
    portfolio?: string[];
    
    // Business details
    businessType: 'individual' | 'company';
    yearsInBusiness: number;
    teamSize: number;
    
    // Pricing & availability
    hourlyRate?: {
      min: number;
      max: number;
      currency: string;
    };
    availability: 'available' | 'busy' | 'booking-ahead';
    
    // Reviews & ratings
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
  
  // Service history
  serviceHistory: VendorService[];
  pendingRequests: string[];
}

// Supporting Types
export interface EventCheckIn {
  eventId: string;
  sessionId?: string;
  checkInTime: Date;
  location?: string;
  method: 'qr' | 'manual' | 'geolocation';
}

export interface PreviousTalk {
  title: string;
  event: string;
  date: Date;
  attendees?: number;
  rating?: number;
  videoUrl?: string;
  slidesUrl?: string;
}

export interface VendorService {
  eventId: string;
  serviceType: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  rating?: number;
  feedback?: string;
}

export type OrganizerPermission = 
  | 'create_events'
  | 'edit_events'
  | 'delete_events'
  | 'manage_users'
  | 'manage_speakers'
  | 'manage_vendors'
  | 'view_analytics'
  | 'export_data'
  | 'manage_settings'
  | 'send_communications';

export type AdminPermission =
  | 'manage_organizations'
  | 'manage_subscriptions'
  | 'view_all_events'
  | 'system_settings'
  | 'user_impersonation'
  | 'data_export'
  | 'audit_logs'
  | 'feature_flags';

// Union type for all user types
export type User = Attendee | Speaker | Organizer | Admin | Vendor;

// Event Types (Enhanced)
export interface Event {
  id: string;
  organizationId: string;
  
  // Basic information
  title: string;
  description: string;
  shortDescription?: string;
  
  // Dates & Location
  startDate: Date;
  endDate: Date;
  timezone: string;
  location: EventLocation;
  
  // Event details
  type: 'conference' | 'workshop' | 'webinar' | 'networking' | 'hybrid' | 'virtual';
  category: string;
  tags: string[];
  
  // Capacity & Registration
  capacity: number;
  registrationLimit?: number;
  registrationDeadline?: Date;
  waitlistEnabled: boolean;
  
  // Pricing
  pricing: EventPricing;
  
  // Status & Visibility
  status: 'draft' | 'published' | 'live' | 'ended' | 'cancelled';
  visibility: 'public' | 'private' | 'organization';
  
  // Content
  image?: string;
  gallery?: string[];
  agenda: Session[];
  speakers: string[]; // User IDs
  
  // Organization
  organizers: string[]; // User IDs
  moderators: string[]; // User IDs
  
  // Registration
  registeredUsers: string[];
  waitlistedUsers: string[];
  attendedUsers: string[];
  
  // Settings
  settings: EventSettings;
  
  // Integrations
  integrations: {
    googleCalendar?: boolean;
    zoom?: string; // Meeting URL
    customFields?: CustomField[];
  };
  
  // AI & Analytics
  aiInsights?: EventInsights;
  analytics: EventAnalytics;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EventLocation {
  type: 'physical' | 'virtual' | 'hybrid';
  venue?: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  virtual?: {
    platform: 'zoom' | 'teams' | 'meet' | 'custom';
    url?: string;
    accessCode?: string;
    instructions?: string;
  };
}

export interface EventPricing {
  type: 'free' | 'paid' | 'tiered';
  currency?: string;
  tiers?: PricingTier[];
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  description: string;
  capacity?: number;
  perks?: string[];
  earlyBird?: {
    price: number;
    deadline: Date;
  };
}

export interface Session {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  track?: string;
  type: 'talk' | 'workshop' | 'panel' | 'break' | 'networking' | 'keynote';
  
  // Speakers & Content
  speakers: string[];
  moderator?: string;
  
  // Location (for multi-room events)
  room?: string;
  virtualRoom?: string;
  
  // Capacity & Registration
  capacity?: number;
  requiresRegistration: boolean;
  registeredUsers: string[];
  
  // Content & Materials
  materials?: SessionMaterial[];
  recordingUrl?: string;
  slidesUrl?: string;
  
  // Status
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  
  // AI-generated content
  aiSummary?: string;
  tags?: string[];
}

export interface SessionMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'document' | 'presentation' | 'video' | 'link';
  url: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';
  required: boolean;
  options?: string[]; // For select/multiselect
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface EventSettings {
  registration: {
    enabled: boolean;
    requireApproval: boolean;
    allowWaitlist: boolean;
    collectDietaryRequirements: boolean;
    customFields: CustomField[];
  };
  
  notifications: {
    sendConfirmation: boolean;
    sendReminders: boolean;
    reminderDays: number[];
  };
  
  networking: {
    enableMatchmaking: boolean;
    enableDirectMessaging: boolean;
    showAttendeeList: boolean;
  };
  
  features: {
    enableQRCheckIn: boolean;
    enableFeedback: boolean;
    enableCertificates: boolean;
    enableLivePolling: boolean;
  };
}

export interface EventInsights {
  predictedAttendance: number;
  popularSessions: string[];
  audienceInterests: string[];
  recommendedSpeakers: string[];
  marketingInsights: string[];
  generatedAt: Date;
}

export interface EventAnalytics {
  registrations: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  
  attendance: {
    total: number;
    checkInRate: number;
    sessionAttendance: Record<string, number>;
  };
  
  engagement: {
    averageSessionRating: number;
    feedbackCount: number;
    networkingConnections: number;
    qrCodeScans: number;
  };
  
  demographics: {
    roleDistribution: Record<EventOSRole, number>;
    locationDistribution: Record<string, number>;
    companyDistribution: Record<string, number>;
  };
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  
  type: 'event' | 'system' | 'social' | 'reminder' | 'announcement';
  title: string;
  message: string;
  
  // Metadata
  data?: Record<string, any>;
  actionUrl?: string;
  
  // Status
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Delivery
  channels: ('email' | 'push' | 'sms' | 'in-app')[];
  deliveredAt?: Record<string, Date>;
  
  // Timing
  createdAt: Date;
  expiresAt?: Date;
}

// Integration Types
export interface GoogleWorkspaceIntegration {
  userId: string;
  organizationId: string;
  
  // Authentication
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  
  // Permissions
  scopes: string[];
  
  // Connected services
  documents: GoogleDocument[];
  spreadsheets: GoogleSpreadsheet[];
  calendarId?: string;
  
  // Settings
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  
  // Metadata
  connectedAt: Date;
  lastSyncAt?: Date;
}

export interface GoogleDocument {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'presentation' | 'form';
  eventId?: string;
  
  // Permissions
  permissions: 'view' | 'comment' | 'edit';
  sharedWith: string[]; // User IDs
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  size?: number;
}

export interface GoogleSpreadsheet {
  id: string;
  title: string;
  url: string;
  eventId?: string;
  
  // Content
  sheets: {
    name: string;
    id: number;
    rowCount: number;
    columnCount: number;
  }[];
  
  // Permissions
  permissions: 'view' | 'comment' | 'edit';
  sharedWith: string[];
  
  // Automation
  autoSync: boolean;
  syncMappings?: {
    sheet: string;
    dataSource: 'registrations' | 'feedback' | 'attendance' | 'custom';
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface PaymentTransaction {
  id: string;
  organizationId: string;
  eventId?: string;
  userId: string;
  
  // Transaction details
  amount: number;
  currency: string;
  description: string;
  
  // Payment method
  provider: 'stripe' | 'razorpay';
  providerTransactionId: string;
  paymentMethod: 'card' | 'bank_transfer' | 'wallet' | 'upi';
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  
  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Refund info
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  organizationId: string;
  eventId?: string;
  
  // Event details
  type: string;
  action: string;
  category: string;
  label?: string;
  value?: number;
  
  // Context
  properties: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  
  // Timing
  timestamp: Date;
}

// Export all types
export * from './eventos-config';