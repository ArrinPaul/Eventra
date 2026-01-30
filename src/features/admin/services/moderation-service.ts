/**
 * Moderation Service
 * Provides content moderation functionality with Firestore
 */

import { db, FIRESTORE_COLLECTIONS } from '@/core/config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// Types
export interface ReportedEvent {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  organizerId: string;
  organizerName: string;
  reportedBy: string;
  reporterName: string;
  reportType: 'spam' | 'misleading' | 'inappropriate' | 'copyright' | 'other';
  description: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  moderatorNotes?: string;
  moderatorId?: string;
}

export interface PendingEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: Date;
  location: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  capacity: number;
  isPaid: boolean;
  price?: number;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
  reviewNotes?: string;
  flaggedContent?: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ContentReport {
  id: string;
  contentType: 'post' | 'comment' | 'message' | 'profile';
  contentId: string;
  contentPreview: string;
  authorId: string;
  authorName: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  action?: 'removed' | 'warned' | 'no_action';
  moderatorId?: string;
}

class ModerationService {
  /**
   * Get reported events
   */
  async getReportedEvents(status?: string): Promise<ReportedEvent[]> {
    try {
      const reportsRef = collection(db, 'event_reports');
      let q = query(reportsRef, orderBy('createdAt', 'desc'), limit(100));
      
      if (status && status !== 'all') {
        q = query(reportsRef, where('status', '==', status), orderBy('createdAt', 'desc'), limit(100));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          eventId: data.eventId,
          eventTitle: data.eventTitle,
          eventDate: data.eventDate?.toDate?.() || new Date(data.eventDate),
          organizerId: data.organizerId,
          organizerName: data.organizerName,
          reportedBy: data.reportedBy,
          reporterName: data.reporterName,
          reportType: data.reportType,
          description: data.description,
          status: data.status,
          priority: data.priority,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          resolvedAt: data.resolvedAt?.toDate?.(),
          resolution: data.resolution,
          moderatorNotes: data.moderatorNotes,
          moderatorId: data.moderatorId
        };
      });
    } catch (error) {
      console.error('Error fetching reported events:', error);
      return [];
    }
  }

  /**
   * Get pending events for approval
   */
  async getPendingEvents(status?: string): Promise<PendingEvent[]> {
    try {
      const eventsRef = collection(db, FIRESTORE_COLLECTIONS.EVENTS);
      let q = query(eventsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'), limit(50));
      
      if (status && status !== 'all' && status !== 'pending') {
        q = query(eventsRef, where('status', '==', status), orderBy('createdAt', 'desc'), limit(50));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          date: data.startDate?.toDate?.() || new Date(data.startDate),
          location: data.location || data.venue,
          organizerId: data.organizerId,
          organizerName: data.organizerName || 'Unknown',
          organizerEmail: data.organizerEmail || '',
          capacity: data.capacity || 0,
          isPaid: data.isPaid || false,
          price: data.price,
          submittedAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          status: data.status,
          reviewNotes: data.reviewNotes,
          flaggedContent: data.flaggedContent || [],
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt?.toDate?.()
        };
      });
    } catch (error) {
      console.error('Error fetching pending events:', error);
      return [];
    }
  }

  /**
   * Get content reports
   */
  async getContentReports(status?: string): Promise<ContentReport[]> {
    try {
      const reportsRef = collection(db, 'content_reports');
      let q = query(reportsRef, orderBy('createdAt', 'desc'), limit(100));
      
      if (status && status !== 'all') {
        q = query(reportsRef, where('status', '==', status), orderBy('createdAt', 'desc'), limit(100));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          contentType: data.contentType,
          contentId: data.contentId,
          contentPreview: data.contentPreview,
          authorId: data.authorId,
          authorName: data.authorName,
          reportedBy: data.reportedBy,
          reporterName: data.reporterName,
          reason: data.reason,
          status: data.status,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          resolvedAt: data.resolvedAt?.toDate?.(),
          action: data.action,
          moderatorId: data.moderatorId
        };
      });
    } catch (error) {
      console.error('Error fetching content reports:', error);
      return [];
    }
  }

  /**
   * Update event report status
   */
  async updateEventReport(reportId: string, updates: Partial<ReportedEvent>, moderatorId: string): Promise<void> {
    try {
      const reportRef = doc(db, 'event_reports', reportId);
      await updateDoc(reportRef, {
        ...updates,
        moderatorId,
        updatedAt: serverTimestamp(),
        ...(updates.status === 'resolved' && { resolvedAt: serverTimestamp() })
      });
    } catch (error) {
      console.error('Error updating event report:', error);
      throw error;
    }
  }

  /**
   * Approve or reject pending event
   */
  async reviewPendingEvent(
    eventId: string, 
    action: 'approved' | 'rejected' | 'needs_changes',
    reviewNotes: string,
    moderatorId: string
  ): Promise<void> {
    try {
      const eventRef = doc(db, FIRESTORE_COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        status: action,
        reviewNotes,
        reviewedBy: moderatorId,
        reviewedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error reviewing pending event:', error);
      throw error;
    }
  }

  /**
   * Resolve content report
   */
  async resolveContentReport(
    reportId: string, 
    action: 'removed' | 'warned' | 'no_action',
    moderatorId: string
  ): Promise<void> {
    try {
      const reportRef = doc(db, 'content_reports', reportId);
      await updateDoc(reportRef, {
        status: 'resolved',
        action,
        moderatorId,
        resolvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resolving content report:', error);
      throw error;
    }
  }

  /**
   * Create a new event report
   */
  async createEventReport(report: Omit<ReportedEvent, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'event_reports'), {
        ...report,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating event report:', error);
      throw error;
    }
  }

  /**
   * Create a new content report
   */
  async createContentReport(report: Omit<ContentReport, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'content_reports'), {
        ...report,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating content report:', error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<{
    pendingReports: number;
    underReview: number;
    pendingEvents: number;
    needsChanges: number;
    contentReports: number;
    criticalReports: number;
  }> {
    try {
      const [reports, pendingEvents, contentReports] = await Promise.all([
        this.getReportedEvents(),
        this.getPendingEvents(),
        this.getContentReports()
      ]);

      return {
        pendingReports: reports.filter(r => r.status === 'pending').length,
        underReview: reports.filter(r => r.status === 'under_review').length,
        pendingEvents: pendingEvents.filter(e => e.status === 'pending').length,
        needsChanges: pendingEvents.filter(e => e.status === 'needs_changes').length,
        contentReports: contentReports.filter(c => c.status === 'pending').length,
        criticalReports: reports.filter(r => r.priority === 'critical' && r.status !== 'resolved').length
      };
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      return {
        pendingReports: 0,
        underReview: 0,
        pendingEvents: 0,
        needsChanges: 0,
        contentReports: 0,
        criticalReports: 0
      };
    }
  }
}

export const moderationService = new ModerationService();
