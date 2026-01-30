import { User } from '../types';

export type Permission = 
  | 'view_events'
  | 'create_events' 
  | 'edit_events'
  | 'delete_events'
  | 'manage_registrations'
  | 'view_analytics'
  | 'connect_google_workspace'
  | 'create_documents'
  | 'edit_documents'
  | 'create_spreadsheets'
  | 'sync_data'
  | 'manage_integrations'
  | 'view_workspace_items';

export type UserRole = 'student' | 'professional' | 'organizer';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'view_events',
    'view_workspace_items'
  ],
  professional: [
    'view_events',
    'create_events',
    'edit_events',
    'manage_registrations',
    'view_analytics',
    'connect_google_workspace',
    'create_documents',
    'edit_documents',
    'create_spreadsheets',
    'sync_data',
    'view_workspace_items'
  ],
  organizer: [
    'view_events',
    'create_events',
    'edit_events',
    'delete_events',
    'manage_registrations',
    'view_analytics',
    'connect_google_workspace',
    'create_documents',
    'edit_documents',
    'create_spreadsheets',
    'sync_data',
    'manage_integrations',
    'view_workspace_items'
  ]
};

export interface GoogleWorkspacePermissions {
  canConnect: boolean;
  canCreateDocuments: boolean;
  canEditDocuments: boolean;
  canCreateSpreadsheets: boolean;
  canSyncData: boolean;
  canManageIntegrations: boolean;
  canViewWorkspaceItems: boolean;
}

export interface EventPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageRegistrations: boolean;
  canViewAnalytics: boolean;
  isOwner: boolean;
}

class PermissionsService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user: User | null, permission: Permission): boolean {
    if (!user || !user.role) return false;
    
    return ROLE_PERMISSIONS[user.role as UserRole]?.includes(permission) || false;
  }

  /**
   * Check multiple permissions at once
   */
  hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Get Google Workspace permissions for a user
   */
  getGoogleWorkspacePermissions(user: User | null): GoogleWorkspacePermissions {
    return {
      canConnect: this.hasPermission(user, 'connect_google_workspace'),
      canCreateDocuments: this.hasPermission(user, 'create_documents'),
      canEditDocuments: this.hasPermission(user, 'edit_documents'),
      canCreateSpreadsheets: this.hasPermission(user, 'create_spreadsheets'),
      canSyncData: this.hasPermission(user, 'sync_data'),
      canManageIntegrations: this.hasPermission(user, 'manage_integrations'),
      canViewWorkspaceItems: this.hasPermission(user, 'view_workspace_items')
    };
  }

  /**
   * Get event-specific permissions for a user
   */
  getEventPermissions(user: User | null, event: { organizerId?: string } | null): EventPermissions {
    const isOwner = user && event && user.uid === event.organizerId;
    
    return {
      canView: this.hasPermission(user, 'view_events'),
      canEdit: isOwner || this.hasPermission(user, 'edit_events'),
      canDelete: isOwner || this.hasPermission(user, 'delete_events'),
      canManageRegistrations: isOwner || this.hasPermission(user, 'manage_registrations'),
      canViewAnalytics: isOwner || this.hasPermission(user, 'view_analytics'),
      isOwner: Boolean(isOwner)
    };
  }

  /**
   * Check if user can access Google Workspace integration for an event
   */
  canAccessWorkspaceIntegration(
    user: User | null, 
    event: { organizerId?: string } | null
  ): boolean {
    if (!user) return false;

    const workspacePermissions = this.getGoogleWorkspacePermissions(user);
    const eventPermissions = this.getEventPermissions(user, event);

    // User must have workspace permissions and either own the event or have edit permissions
    return workspacePermissions.canConnect && 
           (eventPermissions.isOwner || eventPermissions.canEdit);
  }

  /**
   * Check document creation permissions
   */
  canCreateDocument(
    user: User | null, 
    event: { organizerId?: string } | null,
    documentType: 'event_planning' | 'agenda' | 'notes' | 'feedback' | 'custom' | 'event_summary' | 'meeting_notes' | 'planning' | 'template'
  ): boolean {
    if (!this.canAccessWorkspaceIntegration(user, event)) return false;

    const workspacePermissions = this.getGoogleWorkspacePermissions(user);
    
    // Different document types may have different permission requirements
    switch (documentType) {
      case 'event_planning':
      case 'agenda':
      case 'planning':
        // Only organizers and professionals can create planning documents
        return workspacePermissions.canCreateDocuments && user?.role !== 'student';
      
      case 'notes':
      case 'meeting_notes':
        // Anyone with document creation permissions can create notes
        return workspacePermissions.canCreateDocuments;
      
      case 'feedback':
        // Only event owners can create feedback documents
        return workspacePermissions.canCreateDocuments && 
               this.getEventPermissions(user, event).isOwner;
      
      case 'event_summary':
        // Only organizers and professionals can create event summaries
        return workspacePermissions.canCreateDocuments && user?.role !== 'student';
      
      case 'template':
      case 'custom':
        return workspacePermissions.canCreateDocuments;
      
      default:
        return false;
    }
  }

  /**
   * Check spreadsheet creation permissions
   */
  canCreateSpreadsheet(
    user: User | null, 
    event: { organizerId?: string } | null,
    spreadsheetType: 'registrations' | 'analytics' | 'feedback' | 'planning' | 'custom'
  ): boolean {
    if (!this.canAccessWorkspaceIntegration(user, event)) return false;

    const workspacePermissions = this.getGoogleWorkspacePermissions(user);
    const eventPermissions = this.getEventPermissions(user, event);
    
    switch (spreadsheetType) {
      case 'registrations':
      case 'analytics':
        // Only event owners can create registration/analytics spreadsheets
        return workspacePermissions.canCreateSpreadsheets && eventPermissions.isOwner;
      
      case 'feedback':
        // Only event owners can create feedback spreadsheets
        return workspacePermissions.canCreateSpreadsheets && eventPermissions.isOwner;
      
      case 'planning':
        // Organizers and professionals can create planning spreadsheets
        return workspacePermissions.canCreateSpreadsheets && user?.role !== 'student';
      
      case 'custom':
        return workspacePermissions.canCreateSpreadsheets;
      
      default:
        return false;
    }
  }

  /**
   * Check data sync permissions
   */
  canSyncData(
    user: User | null, 
    event: { organizerId?: string } | null,
    syncType: 'registrations' | 'analytics' | 'documents' | 'feedback' | 'all'
  ): boolean {
    if (!this.canAccessWorkspaceIntegration(user, event)) return false;

    const workspacePermissions = this.getGoogleWorkspacePermissions(user);
    const eventPermissions = this.getEventPermissions(user, event);
    
    switch (syncType) {
      case 'registrations':
      case 'analytics':
      case 'feedback':
        // Only event owners can sync sensitive data
        return workspacePermissions.canSyncData && eventPermissions.isOwner;
      
      case 'all':
        // Only event owners can sync all data
        return workspacePermissions.canSyncData && eventPermissions.isOwner;
      
      case 'documents':
        // Anyone with document edit permissions can sync document data
        return workspacePermissions.canSyncData && workspacePermissions.canEditDocuments;
      
      default:
        return false;
    }
  }

  /**
   * Filter workspace items based on user permissions
   */
  filterWorkspaceItems(
    user: User | null,
    event: { organizerId?: string } | null,
    items: Array<{
      id: string;
      templateType: string;
      createdBy: string;
      [key: string]: any;
    }>
  ) {
    if (!user) return [];

    const eventPermissions = this.getEventPermissions(user, event);
    const workspacePermissions = this.getGoogleWorkspacePermissions(user);

    if (!workspacePermissions.canViewWorkspaceItems) return [];

    return items.filter(item => {
      // Event owners can see all items
      if (eventPermissions.isOwner) return true;
      
      // Users can see items they created
      if (item.createdBy === user.uid) return true;
      
      // Professionals can see planning and note documents
      if (user.role === 'professional' && 
          ['event_planning', 'agenda', 'notes', 'planning'].includes(item.templateType)) {
        return true;
      }
      
      // Students can only see notes and agenda items
      if (user.role === 'student' && 
          ['notes', 'agenda'].includes(item.templateType)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Get permission summary for UI display
   */
  getPermissionSummary(user: User | null, event: { organizerId?: string } | null) {
    if (!user) {
      return {
        level: 'none' as const,
        description: 'Not authenticated',
        capabilities: []
      };
    }

    const workspacePermissions = this.getGoogleWorkspacePermissions(user);
    const eventPermissions = this.getEventPermissions(user, event);
    
    if (eventPermissions.isOwner) {
      return {
        level: 'owner' as const,
        description: 'Full access as event owner',
        capabilities: [
          'Create and edit all documents',
          'Create and sync all spreadsheets', 
          'Manage integration settings',
          'Access analytics data'
        ]
      };
    }
    
    if (user.role === 'professional') {
      return {
        level: 'professional' as const,
        description: 'Professional access',
        capabilities: [
          'Create planning documents',
          'View analytics',
          'Create custom spreadsheets'
        ]
      };
    }
    
    if (user.role === 'student') {
      return {
        level: 'student' as const,
        description: 'Read-only access',
        capabilities: [
          'View shared documents',
          'Access meeting notes'
        ]
      };
    }
    
    return {
      level: 'limited' as const,
      description: 'Limited access',
      capabilities: []
    };
  }

  /**
   * Validate action before execution
   */
  validateAction(
    user: User | null,
    action: string,
    resource: { type: string; eventId?: string; ownerId?: string }
  ): { allowed: boolean; reason?: string } {
    if (!user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    const event = resource.eventId ? { organizerId: resource.ownerId } : null;
    
    switch (action) {
      case 'connect_google_workspace':
        return {
          allowed: this.hasPermission(user, 'connect_google_workspace'),
          reason: !this.hasPermission(user, 'connect_google_workspace') 
            ? 'Insufficient permissions to connect Google Workspace' 
            : undefined
        };
      
      case 'create_document':
        return {
          allowed: this.canCreateDocument(user, event, resource.type as 'event_summary' | 'meeting_notes' | 'planning' | 'template'),
          reason: !this.canCreateDocument(user, event, resource.type as 'event_summary' | 'meeting_notes' | 'planning' | 'template')
            ? `Cannot create ${resource.type} document`
            : undefined
        };
      
      case 'create_spreadsheet':
        return {
          allowed: this.canCreateSpreadsheet(user, event, resource.type as 'registrations' | 'analytics' | 'feedback' | 'planning' | 'custom'),
          reason: !this.canCreateSpreadsheet(user, event, resource.type as 'registrations' | 'analytics' | 'feedback' | 'planning' | 'custom')
            ? `Cannot create ${resource.type} spreadsheet`
            : undefined
        };
      
      case 'sync_data':
        return {
          allowed: this.canSyncData(user, event, resource.type as 'registrations' | 'feedback' | 'analytics' | 'all'),
          reason: !this.canSyncData(user, event, resource.type as 'registrations' | 'feedback' | 'analytics' | 'all')
            ? `Cannot sync ${resource.type} data`
            : undefined
        };
      
      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  }
}

export const permissionsService = new PermissionsService();