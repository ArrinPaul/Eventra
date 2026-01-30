/**
 * User Management Service
 * Admin functions for managing users via Firestore
 */

import { db, FIRESTORE_COLLECTIONS } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  Timestamp,
  DocumentSnapshot,
  UpdateData,
  DocumentData,
} from 'firebase/firestore';

// Types
export interface UserData {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'organizer' | 'attendee';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  department?: string;
  year?: string;
  createdAt: Date;
  lastActive: Date;
  lastLoginAt?: Date;
  eventsAttended: number;
  eventsOrganized: number;
  points: number;
  badges: number;
  connections: number;
  isVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  notes?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
}

class UserManagementService {
  /**
   * Get paginated list of users with filters
   */
  async getUsers(
    filters: UserFilters = {},
    pageSize: number = 10,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<UserData>> {
    try {
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const constraints: QueryConstraint[] = [];

      // Apply role filter
      if (filters.role && filters.role !== 'all') {
        constraints.push(where('role', '==', filters.role));
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }

      // Apply sorting
      const sortField = filters.sortBy || 'createdAt';
      const sortDirection = filters.sortOrder || 'desc';
      constraints.push(orderBy(sortField, sortDirection));

      // Apply pagination
      constraints.push(limit(pageSize + 1)); // Get one extra to check if there's more
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(usersRef, ...constraints);
      const snapshot = await getDocs(q);

      const users: UserData[] = [];
      snapshot.docs.slice(0, pageSize).forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.displayName || data.name || 'Unknown',
          displayName: data.displayName,
          email: data.email || '',
          photoURL: data.photoURL,
          role: data.role || 'attendee',
          status: data.status || 'active',
          department: data.department,
          year: data.year,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastActive: data.lastLoginAt?.toDate?.() || data.lastActive?.toDate?.() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate?.(),
          eventsAttended: data.eventsAttended || 0,
          eventsOrganized: data.eventsOrganized || 0,
          points: data.points || 0,
          badges: data.badges?.length || data.badgeCount || 0,
          connections: data.connections?.length || data.connectionCount || 0,
          isVerified: data.isVerified || data.emailVerified || false,
          isBanned: data.isBanned || data.status === 'banned',
          banReason: data.banReason,
          notes: data.notes,
        });
      });

      // Client-side search filter (for name/email)
      let filteredUsers = users;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredUsers = users.filter(user =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.department?.toLowerCase().includes(search)
        );
      }

      return {
        data: filteredUsers,
        total: filteredUsers.length,
        hasMore: snapshot.docs.length > pageSize,
        lastDoc: snapshot.docs[pageSize - 1],
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        id: userDoc.id,
        name: data.displayName || data.name || 'Unknown',
        displayName: data.displayName,
        email: data.email || '',
        photoURL: data.photoURL,
        role: data.role || 'attendee',
        status: data.status || 'active',
        department: data.department,
        year: data.year,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastActive: data.lastLoginAt?.toDate?.() || data.lastActive?.toDate?.() || new Date(),
        eventsAttended: data.eventsAttended || 0,
        eventsOrganized: data.eventsOrganized || 0,
        points: data.points || 0,
        badges: data.badges?.length || 0,
        connections: data.connections?.length || 0,
        isVerified: data.isVerified || data.emailVerified || false,
        isBanned: data.isBanned || data.status === 'banned',
        banReason: data.banReason,
        notes: data.notes,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: 'admin' | 'organizer' | 'attendee'): Promise<boolean> {
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userId), {
        role,
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string, 
    status: 'active' | 'suspended' | 'pending' | 'banned',
    reason?: string
  ): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === 'banned') {
        updateData.isBanned = true;
        updateData.banReason = reason || 'No reason provided';
        updateData.bannedAt = Timestamp.now();
      } else if (status === 'active') {
        updateData.isBanned = false;
        updateData.banReason = null;
      }

      if (status === 'suspended' && reason) {
        updateData.suspensionReason = reason;
      }

      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userId), updateData as UpdateData<DocumentData>);
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }

  /**
   * Verify a user
   */
  async verifyUser(userId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userId), {
        isVerified: true,
        verifiedAt: Timestamp.now(),
        status: 'active',
      });
      return true;
    } catch (error) {
      console.error('Error verifying user:', error);
      return false;
    }
  }

  /**
   * Add admin notes to a user
   */
  async addUserNote(userId: string, note: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTIONS.USERS, userId), {
        notes: note,
        notesUpdatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Error adding user note:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    banned: number;
    pending: number;
    admins: number;
    organizers: number;
    attendees: number;
  }> {
    try {
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      
      // Get all counts in parallel
      const [
        totalSnapshot,
        activeSnapshot,
        suspendedSnapshot,
        bannedSnapshot,
        pendingSnapshot,
        adminsSnapshot,
        organizersSnapshot,
      ] = await Promise.all([
        getDocs(usersRef),
        getDocs(query(usersRef, where('status', '==', 'active'))),
        getDocs(query(usersRef, where('status', '==', 'suspended'))),
        getDocs(query(usersRef, where('status', '==', 'banned'))),
        getDocs(query(usersRef, where('status', '==', 'pending'))),
        getDocs(query(usersRef, where('role', '==', 'admin'))),
        getDocs(query(usersRef, where('role', '==', 'organizer'))),
      ]);

      const total = totalSnapshot.size;
      const active = activeSnapshot.size;
      const suspended = suspendedSnapshot.size;
      const banned = bannedSnapshot.size;
      const pending = pendingSnapshot.size;
      const admins = adminsSnapshot.size;
      const organizers = organizersSnapshot.size;
      const attendees = total - admins - organizers;

      return {
        total,
        active,
        suspended,
        banned,
        pending,
        admins,
        organizers,
        attendees,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        total: 0,
        active: 0,
        suspended: 0,
        banned: 0,
        pending: 0,
        admins: 0,
        organizers: 0,
        attendees: 0,
      };
    }
  }
}

export const userManagementService = new UserManagementService();
