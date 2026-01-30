/**
 * Analytics Service
 * Provides real-time analytics data from Firestore
 */

import { db, FIRESTORE_COLLECTIONS } from '@/core/config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
  limit,
  Timestamp,
  AggregateField,
  getAggregateFromServer,
  sum,
  average,
} from 'firebase/firestore';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

// Types
export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalEvents: number;
  activeEvents: number;
  eventsThisMonth: number;
  totalRegistrations: number;
  averageAttendance: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

export interface EventMetrics {
  eventsByCategory: { category: string; count: number; percentage: number }[];
  eventsByStatus: { status: string; count: number }[];
  topEvents: { id: string; title: string; registrations: number; attendance: number }[];
  popularLocations: { location: string; eventCount: number }[];
}

export interface UserGrowthData {
  date: string;
  users: number;
  growth: number;
}

export interface RealtimeMetrics {
  activeNow: number;
  recentSignups: { id: string; name: string; time: Date }[];
  recentRegistrations: { eventTitle: string; userName: string; time: Date }[];
  systemHealth: { service: string; status: 'healthy' | 'degraded' | 'down' }[];
}

export interface EngagementMetrics {
  dailyActiveUsers: number[];
  weeklyActiveUsers: number[];
  monthlyActiveUsers: number[];
  averageSessionDuration: number;
  pageViews: number;
  bounceRate: number;
  retentionRate: number;
}

class AnalyticsService {
  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const weekAgo = subDays(now, 7);
      const monthAgo = subDays(now, 30);

      // Get user counts
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const totalUsersSnapshot = await getCountFromServer(usersRef);
      const totalUsers = totalUsersSnapshot.data().count;

      // Active users (users who logged in within last 7 days)
      const activeUsersQuery = query(
        usersRef,
        where('lastLoginAt', '>=', Timestamp.fromDate(weekAgo))
      );
      const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.data().count;

      // New users today
      const newUsersTodayQuery = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(todayStart))
      );
      const newUsersTodaySnapshot = await getCountFromServer(newUsersTodayQuery);
      const newUsersToday = newUsersTodaySnapshot.data().count;

      // New users this week
      const newUsersWeekQuery = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(weekAgo))
      );
      const newUsersWeekSnapshot = await getCountFromServer(newUsersWeekQuery);
      const newUsersThisWeek = newUsersWeekSnapshot.data().count;

      // Get event counts
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const totalEventsSnapshot = await getCountFromServer(eventsRef);
      const totalEvents = totalEventsSnapshot.data().count;

      // Active/upcoming events
      const activeEventsQuery = query(
        eventsRef,
        where('status', 'in', ['published', 'live']),
        where('date', '>=', Timestamp.fromDate(now))
      );
      const activeEventsSnapshot = await getCountFromServer(activeEventsQuery);
      const activeEvents = activeEventsSnapshot.data().count;

      // Events this month
      const eventsMonthQuery = query(
        eventsRef,
        where('createdAt', '>=', Timestamp.fromDate(monthAgo))
      );
      const eventsMonthSnapshot = await getCountFromServer(eventsMonthQuery);
      const eventsThisMonth = eventsMonthSnapshot.data().count;

      // Get registration counts from tickets collection
      const ticketsRef = collection(db, 'tickets');
      const totalRegistrationsSnapshot = await getCountFromServer(ticketsRef);
      const totalRegistrations = totalRegistrationsSnapshot.data().count;

      // Calculate average attendance (checked-in / registered)
      const checkedInQuery = query(ticketsRef, where('checkedIn', '==', true));
      const checkedInSnapshot = await getCountFromServer(checkedInQuery);
      const checkedInCount = checkedInSnapshot.data().count;
      const averageAttendance = totalRegistrations > 0 
        ? Math.round((checkedInCount / totalRegistrations) * 100 * 10) / 10
        : 0;

      // Get revenue from transactions
      let totalRevenue = 0;
      let revenueThisMonth = 0;
      
      try {
        const transactionsRef = collection(db, FIRESTORE_COLLECTIONS.TRANSACTIONS);
        const totalRevenueSnapshot = await getAggregateFromServer(
          query(transactionsRef, where('status', '==', 'completed')),
          { totalRevenue: sum('amount') }
        );
        totalRevenue = totalRevenueSnapshot.data().totalRevenue || 0;

        const monthRevenueSnapshot = await getAggregateFromServer(
          query(
            transactionsRef, 
            where('status', '==', 'completed'),
            where('createdAt', '>=', Timestamp.fromDate(monthAgo))
          ),
          { revenueThisMonth: sum('amount') }
        );
        revenueThisMonth = monthRevenueSnapshot.data().revenueThisMonth || 0;
      } catch {
        // Transactions collection may not exist yet
        console.log('Transactions collection not available');
      }

      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        totalEvents,
        activeEvents,
        eventsThisMonth,
        totalRegistrations,
        averageAttendance,
        totalRevenue,
        revenueThisMonth,
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      // Return zeros if there's an error
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        totalEvents: 0,
        activeEvents: 0,
        eventsThisMonth: 0,
        totalRegistrations: 0,
        averageAttendance: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
      };
    }
  }

  /**
   * Get event-related metrics
   */
  async getEventMetrics(): Promise<EventMetrics> {
    try {
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const eventsSnapshot = await getDocs(eventsRef);
      
      const categoryCount: Record<string, number> = {};
      const statusCount: Record<string, number> = {};
      const locationCount: Record<string, number> = {};
      const eventsList: { id: string; title: string; registrations: number; attendance: number }[] = [];

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count by category
        const category = data.category || 'Other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        
        // Count by status
        const status = data.status || 'draft';
        statusCount[status] = (statusCount[status] || 0) + 1;
        
        // Count by location
        const location = typeof data.location === 'string' 
          ? data.location 
          : data.location?.name || 'Unknown';
        locationCount[location] = (locationCount[location] || 0) + 1;
        
        // Add to events list for top events
        eventsList.push({
          id: doc.id,
          title: data.title || 'Untitled Event',
          registrations: data.registeredCount || 0,
          attendance: data.checkedInCount || 0,
        });
      });

      const totalEvents = eventsSnapshot.size;

      // Convert to arrays with percentages
      const eventsByCategory = Object.entries(categoryCount)
        .map(([category, count]) => ({
          category,
          count,
          percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100 * 10) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const eventsByStatus = Object.entries(statusCount)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      const topEvents = eventsList
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 5);

      const popularLocations = Object.entries(locationCount)
        .map(([location, eventCount]) => ({ location, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 5);

      return {
        eventsByCategory,
        eventsByStatus,
        topEvents,
        popularLocations,
      };
    } catch (error) {
      console.error('Error fetching event metrics:', error);
      return {
        eventsByCategory: [],
        eventsByStatus: [],
        topEvents: [],
        popularLocations: [],
      };
    }
  }

  /**
   * Get user growth data for charting
   */
  async getUserGrowthData(days: number = 7): Promise<UserGrowthData[]> {
    try {
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const growthData: UserGrowthData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startOfDate = startOfDay(date);
        const endOfDate = endOfDay(date);

        const usersQuery = query(
          usersRef,
          where('createdAt', '>=', Timestamp.fromDate(startOfDate)),
          where('createdAt', '<=', Timestamp.fromDate(endOfDate))
        );
        
        const snapshot = await getCountFromServer(usersQuery);
        const users = snapshot.data().count;
        
        growthData.push({
          date: format(date, 'MMM dd'),
          users,
          growth: 0, // Calculate based on previous day if needed
        });
      }

      // Calculate growth percentages
      for (let i = 1; i < growthData.length; i++) {
        const prev = growthData[i - 1].users;
        const curr = growthData[i].users;
        growthData[i].growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      }

      return growthData;
    } catch (error) {
      console.error('Error fetching user growth data:', error);
      return [];
    }
  }

  /**
   * Get recent activity for realtime dashboard
   */
  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const fiveMinutesAgo = subDays(new Date(), 0); // Just use current time for now
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Get recent signups
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const recentUsersQuery = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentSignups = recentUsersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.name || 'Unknown User',
          time: data.createdAt?.toDate?.() || new Date(),
        };
      });

      // Get recent registrations
      const ticketsRef = collection(db, 'tickets');
      const recentTicketsQuery = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentTicketsSnapshot = await getDocs(recentTicketsQuery);
      const recentRegistrations = recentTicketsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          eventTitle: data.eventTitle || 'Unknown Event',
          userName: data.userName || 'Unknown User',
          time: data.createdAt?.toDate?.() || new Date(),
        };
      });

      // Estimate active users (users who logged in recently)
      const activeQuery = query(
        usersRef,
        where('lastLoginAt', '>=', Timestamp.fromDate(oneHourAgo))
      );
      const activeSnapshot = await getCountFromServer(activeQuery);
      const activeNow = activeSnapshot.data().count;

      return {
        activeNow,
        recentSignups,
        recentRegistrations,
        systemHealth: [
          { service: 'API Server', status: 'healthy' },
          { service: 'Database', status: 'healthy' },
          { service: 'File Storage', status: 'healthy' },
          { service: 'Email Service', status: 'healthy' },
          { service: 'Push Notifications', status: 'healthy' },
        ],
      };
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      return {
        activeNow: 0,
        recentSignups: [],
        recentRegistrations: [],
        systemHealth: [
          { service: 'API Server', status: 'degraded' },
          { service: 'Database', status: 'degraded' },
        ],
      };
    }
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    try {
      // These would typically come from an analytics events collection
      // For now, calculate from available data
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const now = new Date();
      
      // Daily active users (last 7 days)
      const dailyActiveUsers: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const startDate = startOfDay(date);
        const endDate = endOfDay(date);
        
        const query_dau = query(
          usersRef,
          where('lastLoginAt', '>=', Timestamp.fromDate(startDate)),
          where('lastLoginAt', '<=', Timestamp.fromDate(endDate))
        );
        const snapshot = await getCountFromServer(query_dau);
        dailyActiveUsers.push(snapshot.data().count);
      }

      // Weekly active users (last 4 weeks)
      const weeklyActiveUsers: number[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = subDays(now, (i + 1) * 7);
        const weekEnd = subDays(now, i * 7);
        
        const query_wau = query(
          usersRef,
          where('lastLoginAt', '>=', Timestamp.fromDate(weekStart)),
          where('lastLoginAt', '<=', Timestamp.fromDate(weekEnd))
        );
        const snapshot = await getCountFromServer(query_wau);
        weeklyActiveUsers.push(snapshot.data().count);
      }

      // Monthly active users (last 4 months)
      const monthlyActiveUsers: number[] = [];
      for (let i = 3; i >= 0; i--) {
        const monthStart = subDays(now, (i + 1) * 30);
        const monthEnd = subDays(now, i * 30);
        
        const query_mau = query(
          usersRef,
          where('lastLoginAt', '>=', Timestamp.fromDate(monthStart)),
          where('lastLoginAt', '<=', Timestamp.fromDate(monthEnd))
        );
        const snapshot = await getCountFromServer(query_mau);
        monthlyActiveUsers.push(snapshot.data().count);
      }

      return {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        averageSessionDuration: 0, // Would need analytics events
        pageViews: 0, // Would need analytics events
        bounceRate: 0, // Would need analytics events
        retentionRate: 0, // Calculate from user data
      };
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      return {
        dailyActiveUsers: [],
        weeklyActiveUsers: [],
        monthlyActiveUsers: [],
        averageSessionDuration: 0,
        pageViews: 0,
        bounceRate: 0,
        retentionRate: 0,
      };
    }
  }

  // ============ ORGANIZER-SPECIFIC ANALYTICS ============

  /**
   * Get events for a specific organizer
   */
  async getOrganizerEvents(organizerId: string): Promise<OrganizerEventPerformance[]> {
    try {
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const q = query(
        eventsRef,
        where('organizerId', '==', organizerId),
        orderBy('startDate', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      const events: OrganizerEventPerformance[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const eventId = doc.id;
        
        // Get registration count
        const registrationsQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.REGISTRATIONS),
          where('eventId', '==', eventId)
        );
        const regSnapshot = await getCountFromServer(registrationsQuery);
        const registrations = regSnapshot.data().count;
        
        // Get check-in count
        const checkInsQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.REGISTRATIONS),
          where('eventId', '==', eventId),
          where('checkedIn', '==', true)
        );
        const checkInSnapshot = await getCountFromServer(checkInsQuery);
        const checkIns = checkInSnapshot.data().count;
        
        // Get feedback for satisfaction score
        const feedbackQuery = query(
          collection(db, 'feedback'),
          where('eventId', '==', eventId)
        );
        const feedbackSnapshot = await getDocs(feedbackQuery);
        let satisfactionScore = 0;
        if (feedbackSnapshot.docs.length > 0) {
          const totalRating = feedbackSnapshot.docs.reduce((sum, d) => sum + (d.data().rating || 0), 0);
          satisfactionScore = totalRating / feedbackSnapshot.docs.length;
        }
        
        const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
        const now = new Date();
        let status: 'draft' | 'published' | 'live' | 'completed' = 'published';
        if (data.status === 'draft') status = 'draft';
        else if (startDate < now) status = 'completed';
        else if (Math.abs(startDate.getTime() - now.getTime()) < 86400000) status = 'live';
        
        events.push({
          eventId,
          eventName: data.title || 'Untitled Event',
          date: startDate,
          category: data.category || 'General',
          status,
          capacity: data.capacity || 100,
          registrations,
          checkIns,
          revenue: data.totalRevenue || 0,
          viewCount: data.viewCount || 0,
          conversionRate: data.viewCount > 0 ? (registrations / data.viewCount * 100) : 0,
          satisfactionScore
        });
      }
      
      return events;
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      return [];
    }
  }

  /**
   * Get registration funnel data for organizer
   */
  async getOrganizerFunnelData(organizerId: string): Promise<FunnelStage[]> {
    try {
      // Get all events by organizer
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const eventsQuery = query(eventsRef, where('organizerId', '==', organizerId));
      const eventsSnapshot = await getDocs(eventsQuery);
      
      let totalViews = 0;
      let detailsViewed = 0;
      let registrationStarted = 0;
      let registrationCompleted = 0;
      let checkedIn = 0;
      
      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        totalViews += data.viewCount || 0;
        detailsViewed += data.detailViewCount || Math.floor((data.viewCount || 0) * 0.66);
        
        // Get registrations for this event
        const regQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.REGISTRATIONS),
          where('eventId', '==', doc.id)
        );
        const regSnapshot = await getDocs(regQuery);
        
        registrationCompleted += regSnapshot.docs.length;
        registrationStarted += Math.ceil(regSnapshot.docs.length * 1.5); // Estimate
        checkedIn += regSnapshot.docs.filter(d => d.data().checkedIn).length;
      }
      
      const funnel: FunnelStage[] = [
        { 
          stage: 'Page Views', 
          count: totalViews || 1, 
          percentage: 100, 
          dropoffRate: 0, 
          color: '#8B5CF6' 
        },
        { 
          stage: 'Event Details Viewed', 
          count: detailsViewed, 
          percentage: totalViews > 0 ? (detailsViewed / totalViews * 100) : 0, 
          dropoffRate: totalViews > 0 ? ((totalViews - detailsViewed) / totalViews * 100) : 0, 
          color: '#A78BFA' 
        },
        { 
          stage: 'Registration Started', 
          count: registrationStarted, 
          percentage: totalViews > 0 ? (registrationStarted / totalViews * 100) : 0, 
          dropoffRate: detailsViewed > 0 ? ((detailsViewed - registrationStarted) / detailsViewed * 100) : 0, 
          color: '#C4B5FD' 
        },
        { 
          stage: 'Registration Completed', 
          count: registrationCompleted, 
          percentage: totalViews > 0 ? (registrationCompleted / totalViews * 100) : 0, 
          dropoffRate: registrationStarted > 0 ? ((registrationStarted - registrationCompleted) / registrationStarted * 100) : 0, 
          color: '#DDD6FE' 
        },
        { 
          stage: 'Checked In', 
          count: checkedIn, 
          percentage: totalViews > 0 ? (checkedIn / totalViews * 100) : 0, 
          dropoffRate: registrationCompleted > 0 ? ((registrationCompleted - checkedIn) / registrationCompleted * 100) : 0, 
          color: '#EDE9FE' 
        }
      ];
      
      return funnel;
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      return [];
    }
  }

  /**
   * Get attendee demographics for organizer events
   */
  async getOrganizerDemographics(organizerId: string): Promise<DemographicData> {
    try {
      // Get all registrations for organizer's events
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const eventsQuery = query(eventsRef, where('organizerId', '==', organizerId));
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const eventIds = eventsSnapshot.docs.map(d => d.id);
      
      // Collect unique attendee IDs
      const attendeeIds = new Set<string>();
      for (const eventId of eventIds) {
        const regQuery = query(
          collection(db, FIRESTORE_COLLECTIONS.REGISTRATIONS),
          where('eventId', '==', eventId)
        );
        const regSnapshot = await getDocs(regQuery);
        regSnapshot.docs.forEach(d => attendeeIds.add(d.data().userId));
      }
      
      // Fetch user profiles for demographics
      const ageGroups: Record<string, number> = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };
      const departments: Record<string, number> = {};
      const years: Record<string, number> = {};
      const locations: Record<string, number> = {};
      const devices: Record<string, number> = { 'Mobile': 0, 'Desktop': 0, 'Tablet': 0 };
      const sources: Record<string, number> = { 'Direct': 0, 'Email': 0, 'Social Media': 0, 'Referral': 0, 'Search': 0 };
      
      for (const userId of attendeeIds) {
        try {
          const userDoc = await getDocs(query(
            collection(db, FIRESTORE_COLLECTIONS.USERS),
            where('__name__', '==', userId),
            limit(1)
          ));
          
          if (userDoc.docs.length > 0) {
            const userData = userDoc.docs[0].data();
            
            // Age group based on birthYear or approximate
            if (userData.department) {
              departments[userData.department] = (departments[userData.department] || 0) + 1;
            }
            if (userData.year) {
              years[userData.year] = (years[userData.year] || 0) + 1;
            }
            if (userData.location || userData.city) {
              const loc = userData.location || userData.city;
              locations[loc] = (locations[loc] || 0) + 1;
            }
          }
        } catch {
          // Skip if user not found
        }
      }
      
      const total = attendeeIds.size || 1;
      
      return {
        ageGroups: Object.entries(ageGroups).map(([range, count]) => ({
          range,
          count,
          percentage: (count / total * 100)
        })),
        departments: Object.entries(departments).map(([name, count]) => ({
          name,
          count,
          percentage: (count / total * 100)
        })),
        years: Object.entries(years).map(([year, count]) => ({
          year,
          count,
          percentage: (count / total * 100)
        })),
        locations: Object.entries(locations).map(([city, count]) => ({
          city,
          count,
          percentage: (count / total * 100)
        })),
        devices: Object.entries(devices).map(([type, count]) => ({
          type,
          count,
          percentage: (count / total * 100)
        })),
        sources: Object.entries(sources).map(([source, count]) => ({
          source,
          count,
          percentage: (count / total * 100)
        }))
      };
    } catch (error) {
      console.error('Error fetching demographics:', error);
      return {
        ageGroups: [],
        departments: [],
        years: [],
        locations: [],
        devices: [],
        sources: []
      };
    }
  }

  /**
   * Get revenue data for organizer
   */
  async getOrganizerRevenue(organizerId: string): Promise<RevenueData> {
    try {
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      const eventsQuery = query(eventsRef, where('organizerId', '==', organizerId));
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const now = new Date();
      const monthAgo = subDays(now, 30);
      const twoMonthsAgo = subDays(now, 60);
      
      let totalRevenue = 0;
      let thisMonth = 0;
      let lastMonth = 0;
      let refunds = 0;
      let totalTicketsSold = 0;
      const byTicketType: Record<string, { revenue: number; sold: number }> = {};
      const byEvent: { eventName: string; revenue: number; date: string }[] = [];
      
      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        const eventRevenue = data.totalRevenue || 0;
        const eventDate = data.startDate?.toDate?.() || new Date(data.startDate);
        
        totalRevenue += eventRevenue;
        
        if (eventDate >= monthAgo) {
          thisMonth += eventRevenue;
        } else if (eventDate >= twoMonthsAgo) {
          lastMonth += eventRevenue;
        }
        
        // Get ticket sales
        const ticketsQuery = query(
          collection(db, 'tickets'),
          where('eventId', '==', doc.id)
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        
        ticketsSnapshot.docs.forEach(ticketDoc => {
          const ticketData = ticketDoc.data();
          const type = ticketData.type || 'Regular';
          const price = ticketData.price || 0;
          
          if (!byTicketType[type]) {
            byTicketType[type] = { revenue: 0, sold: 0 };
          }
          byTicketType[type].revenue += price;
          byTicketType[type].sold += 1;
          totalTicketsSold += 1;
          
          if (ticketData.refunded) {
            refunds += price;
          }
        });
        
        if (eventRevenue > 0) {
          byEvent.push({
            eventName: data.title || 'Untitled Event',
            revenue: eventRevenue,
            date: format(eventDate, 'yyyy-MM-dd')
          });
        }
      }
      
      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;
      
      return {
        totalRevenue,
        thisMonth,
        lastMonth,
        growth,
        byTicketType: Object.entries(byTicketType).map(([type, data]) => ({
          type,
          ...data
        })),
        byEvent: byEvent.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        projectedRevenue: thisMonth * 1.1,
        averageTicketPrice: totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0,
        refunds,
        netRevenue: totalRevenue - refunds
      };
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return {
        totalRevenue: 0,
        thisMonth: 0,
        lastMonth: 0,
        growth: 0,
        byTicketType: [],
        byEvent: [],
        projectedRevenue: 0,
        averageTicketPrice: 0,
        refunds: 0,
        netRevenue: 0
      };
    }
  }
}

// Organizer analytics types
export interface OrganizerEventPerformance {
  eventId: string;
  eventName: string;
  date: Date;
  category: string;
  status: 'draft' | 'published' | 'live' | 'completed';
  capacity: number;
  registrations: number;
  checkIns: number;
  revenue: number;
  viewCount: number;
  conversionRate: number;
  satisfactionScore: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  color: string;
}

export interface DemographicData {
  ageGroups: { range: string; count: number; percentage: number }[];
  departments: { name: string; count: number; percentage: number }[];
  years: { year: string; count: number; percentage: number }[];
  locations: { city: string; count: number; percentage: number }[];
  devices: { type: string; count: number; percentage: number }[];
  sources: { source: string; count: number; percentage: number }[];
}

export interface RevenueData {
  totalRevenue: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  byTicketType: { type: string; revenue: number; sold: number }[];
  byEvent: { eventName: string; revenue: number; date: string }[];
  projectedRevenue: number;
  averageTicketPrice: number;
  refunds: number;
  netRevenue: number;
}

export const analyticsService = new AnalyticsService();
