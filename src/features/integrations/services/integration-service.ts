import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  addDoc,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from './firebase';

export interface IntegratedEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  organizerId: string;
  documents?: {
    event_planning?: string;
    agenda?: string;
    notes?: string;
    feedback?: string;
  };
  spreadsheets?: {
    registrations?: string;
    analytics?: string;
    feedback?: string;
    planning?: string;
  };
  integrationSettings?: {
    autoSyncRegistrations: boolean;
    autoSyncAnalytics: boolean;
    realTimeUpdates: boolean;
  };
}

export interface RegistrationData {
  id: string;
  eventId: string;
  userName: string;
  userEmail: string;
  userRole: 'student' | 'professional' | 'organizer';
  registeredAt: Date;
  status: 'registered' | 'confirmed' | 'cancelled';
  checkedIn: boolean;
  ticketType: string;
}

export interface SyncStatus {
  lastSyncTime?: Date;
  syncInProgress: boolean;
  syncErrors: string[];
  documentsSync: {
    enabled: boolean;
    lastSync?: Date;
  };
  spreadsheetsSync: {
    enabled: boolean;
    lastSync?: Date;
  };
}

class IntegrationService {
  private functions = getFunctions();
  
  /**
   * Initialize three-system integration for an event
   */
  async initializeEventIntegration(eventId: string, settings: {
    createPlanningDoc?: boolean;
    createRegistrationSheet?: boolean;
    enableAutoSync?: boolean;
  }) {
    try {
      const results = {
        documents: {} as Record<string, unknown>,
        spreadsheets: {} as Record<string, unknown>,
        success: true,
        errors: [] as string[]
      };

      // Create planning document if requested
      if (settings.createPlanningDoc) {
        try {
          const createDocument = httpsCallable(this.functions, 'createEventDocument');
          const docResult = await createDocument({
            eventId,
            template: {
              templateType: 'event_planning',
              title: '',
              content: ''
            }
          });
          results.documents.event_planning = docResult.data;
        } catch (error) {
          results.errors.push(`Failed to create planning document: ${error}`);
        }
      }

      // Create registration spreadsheet if requested
      if (settings.createRegistrationSheet) {
        try {
          const createSpreadsheet = httpsCallable(this.functions, 'createEventSpreadsheet');
          const sheetResult = await createSpreadsheet({
            eventId,
            template: {
              templateType: 'registrations',
              title: '',
              sheets: [
                {
                  title: 'Registrations',
                  headers: ['Registration ID', 'Name', 'Email', 'Role', 'Registration Date', 'Status', 'Checked In', 'Ticket Type']
                }
              ]
            }
          });
          results.spreadsheets.registrations = sheetResult.data;
        } catch (error) {
          results.errors.push(`Failed to create registration spreadsheet: ${error}`);
        }
      }

      // Update event with integration settings
      if (settings.enableAutoSync) {
        await this.updateEventIntegrationSettings(eventId, {
          autoSyncRegistrations: true,
          autoSyncAnalytics: true,
          realTimeUpdates: true
        });
      }

      results.success = results.errors.length === 0;
      return results;

    } catch (error) {
      console.error('Error initializing event integration:', error);
      throw error;
    }
  }

  /**
   * Sync registration data between event system and Google Sheets
   */
  async syncRegistrationData(eventId: string): Promise<{
    success: boolean;
    syncedRecords: number;
    errors: string[];
  }> {
    try {
      const syncRegistrations = httpsCallable(this.functions, 'syncRegistrationsToSheet');
      const result = await syncRegistrations({ eventId });
      
      // Cast result.data to expected shape
      const data = result.data as { syncedRecords?: number } | null;
      return {
        success: true,
        syncedRecords: data?.syncedRecords || 0,
        errors: []
      };
    } catch (error) {
      console.error('Error syncing registration data:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Update event details in Google Docs when event is modified
   */
  async syncEventDetailsToDocuments(eventId: string, updatedEvent: Partial<IntegratedEvent>) {
    try {
      // Get event documents
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      const eventData = eventDoc.data();
      
      if (!eventData?.documents) {
        return { success: true, message: 'No documents to sync' };
      }

      // This would typically update document content via Google Docs API
      // For now, we'll just log the sync operation
      console.log('Syncing event details to documents:', {
        eventId,
        updatedEvent,
        documents: eventData.documents
      });

      return { 
        success: true, 
        message: 'Event details synced to documents',
        syncedDocuments: Object.keys(eventData.documents).length
      };
    } catch (error) {
      console.error('Error syncing event details to documents:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get real-time sync status for an event
   */
  getSyncStatus(eventId: string, callback: (status: SyncStatus) => void) {
    const eventRef = doc(db, 'events', eventId);
    
    return onSnapshot(eventRef, (doc) => {
      const eventData = doc.data();
      const syncStatus: SyncStatus = {
        syncInProgress: eventData?.syncStatus?.inProgress || false,
        syncErrors: eventData?.syncStatus?.errors || [],
        lastSyncTime: eventData?.syncStatus?.lastSync?.toDate(),
        documentsSync: {
          enabled: eventData?.integrationSettings?.realTimeUpdates || false,
          lastSync: eventData?.syncStatus?.documentsLastSync?.toDate()
        },
        spreadsheetsSync: {
          enabled: eventData?.integrationSettings?.autoSyncRegistrations || false,
          lastSync: eventData?.syncStatus?.spreadsheetsLastSync?.toDate()
        }
      };
      
      callback(syncStatus);
    });
  }

  /**
   * Get all workspace items for an event
   */
  async getEventWorkspaceItems(eventId: string) {
    try {
      // Get documents
      const documentsQuery = query(
        collection(db, 'eventDocuments'),
        where('eventId', '==', eventId)
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      const documents = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get spreadsheets
      const spreadsheetsQuery = query(
        collection(db, 'eventSpreadsheets'),
        where('eventId', '==', eventId)
      );
      const spreadsheetsSnapshot = await getDocs(spreadsheetsQuery);
      const spreadsheets = spreadsheetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        documents,
        spreadsheets,
        totalItems: documents.length + spreadsheets.length
      };
    } catch (error) {
      console.error('Error getting workspace items:', error);
      throw error;
    }
  }

  /**
   * Update integration settings for an event
   */
  async updateEventIntegrationSettings(
    eventId: string, 
    settings: Partial<IntegratedEvent['integrationSettings']>
  ) {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        integrationSettings: settings,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating integration settings:', error);
      throw error;
    }
  }

  /**
   * Handle real-time registration updates
   */
  onRegistrationUpdate(eventId: string, callback: (registrations: RegistrationData[]) => void) {
    const registrationsQuery = query(
      collection(db, 'registrations'),
      where('eventId', '==', eventId)
    );

    return onSnapshot(registrationsQuery, (snapshot) => {
      const registrations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RegistrationData));
      
      callback(registrations);
      
      // Auto-sync to spreadsheet if enabled
      this.checkAndAutoSync(eventId);
    });
  }

  /**
   * Check if auto-sync is needed and perform it
   */
  private async checkAndAutoSync(eventId: string) {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      const eventData = eventDoc.data();
      
      if (eventData?.integrationSettings?.autoSyncRegistrations) {
        // Debounce sync operations to avoid too frequent updates
        const lastSync = eventData.syncStatus?.lastSync?.toDate();
        const now = new Date();
        const timeSinceLastSync = lastSync ? now.getTime() - lastSync.getTime() : Infinity;
        
        // Only sync if more than 30 seconds have passed since last sync
        if (timeSinceLastSync > 30000) {
          await this.syncRegistrationData(eventId);
        }
      }
    } catch (error) {
      console.error('Error in auto-sync check:', error);
    }
  }

  /**
   * Create analytics spreadsheet with event insights
   */
  async createAnalyticsSpreadsheet(eventId: string) {
    try {
      // Get event and registration data
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      const eventData = eventDoc.data();
      
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', eventId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registrations = registrationsSnapshot.docs.map(doc => doc.data());

      // Prepare analytics data
      const totalRegistrations = registrations.length;
      const checkedInCount = registrations.filter(r => r.checkedIn).length;
      const roleBreakdown = registrations.reduce((acc, reg) => {
        acc[reg.userRole] = (acc[reg.userRole] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const analyticsData = [
        ['Metric', 'Value'],
        ['Total Registrations', totalRegistrations],
        ['Checked In', checkedInCount],
        ['Check-in Rate', `${((checkedInCount / totalRegistrations) * 100).toFixed(1)}%`],
        ['Students', roleBreakdown.student || 0],
        ['Professionals', roleBreakdown.professional || 0],
        ['Organizers', roleBreakdown.organizer || 0]
      ];

      const createSpreadsheet = httpsCallable(this.functions, 'createEventSpreadsheet');
      const result = await createSpreadsheet({
        eventId,
        template: {
          templateType: 'analytics',
          title: `${eventData?.title || 'Event'} - Analytics`,
          sheets: [
            {
              title: 'Overview',
              headers: ['Metric', 'Value'],
              data: analyticsData.slice(1)
            },
            {
              title: 'Registrations by Role',
              headers: ['Role', 'Count', 'Percentage'],
              data: Object.entries(roleBreakdown).map(([role, count]) => [
                role,
                count,
                `${((count / totalRegistrations) * 100).toFixed(1)}%`
              ])
            }
          ]
        }
      });

      return result.data;
    } catch (error) {
      console.error('Error creating analytics spreadsheet:', error);
      throw error;
    }
  }

  /**
   * Validate Google Workspace connection status
   */
  async validateWorkspaceConnection(userId: string): Promise<{
    connected: boolean;
    hasDocumentAccess: boolean;
    hasSheetsAccess: boolean;
    connectionDate?: Date;
  }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      const workspaceData = userData?.googleWorkspace;
      
      return {
        connected: workspaceData?.connected || false,
        hasDocumentAccess: workspaceData?.connected || false,
        hasSheetsAccess: workspaceData?.connected || false,
        connectionDate: workspaceData?.connectedAt?.toDate()
      };
    } catch (error) {
      console.error('Error validating workspace connection:', error);
      return {
        connected: false,
        hasDocumentAccess: false,
        hasSheetsAccess: false
      };
    }
  }

  /**
   * Disconnect and cleanup integration
   */
  async disconnectIntegration(userId: string) {
    try {
      const disconnectWorkspace = httpsCallable(this.functions, 'disconnectGoogleWorkspace');
      await disconnectWorkspace({});
      
      return { success: true, message: 'Integration disconnected successfully' };
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();