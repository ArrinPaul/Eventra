'use server';

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export interface CertificateTemplate {
  id: string;
  name: string;
  category: 'attendance' | 'completion' | 'achievement' | 'speaker' | 'organizer';
  htmlTemplate: string;
  fields: string[];
  design: {
    backgroundColor: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl?: string;
    backgroundPattern?: string;
  };
  createdBy: string;
  createdAt: Date;
  active: boolean;
}

export interface Certificate {
  id: string;
  templateId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  eventId: string;
  eventTitle: string;
  issuedAt: Date;
  verificationCode: string;
  downloadUrl?: string;
  emailSent: boolean;
  data: Record<string, string>;
}

// Default certificate templates
const DEFAULT_TEMPLATES: Omit<CertificateTemplate, 'id' | 'createdAt' | 'createdBy'>[] = [
  {
    name: 'Classic Attendance',
    category: 'attendance',
    htmlTemplate: `
      <div style="width: 800px; height: 600px; padding: 40px; font-family: {{fontFamily}}; background: {{backgroundColor}}; position: relative; border: 8px solid {{primaryColor}};">
        <div style="text-align: center;">
          <h1 style="color: {{primaryColor}}; font-size: 36px; margin-bottom: 10px;">CERTIFICATE OF ATTENDANCE</h1>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">This is to certify that</p>
          <h2 style="color: #333; font-size: 32px; font-weight: bold; margin-bottom: 20px;">{{recipientName}}</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">has successfully attended</p>
          <h3 style="color: {{primaryColor}}; font-size: 24px; margin-bottom: 30px;">{{eventTitle}}</h3>
          <p style="color: #666; font-size: 14px;">held on {{eventDate}}</p>
          <div style="margin-top: 60px; display: flex; justify-content: space-between; padding: 0 60px;">
            <div style="text-align: center;">
              <div style="border-top: 2px solid #333; width: 150px; margin-bottom: 5px;"></div>
              <p style="font-size: 12px; color: #666;">Organizer Signature</p>
            </div>
            <div style="text-align: center;">
              <p style="font-size: 10px; color: #999;">Verification: {{verificationCode}}</p>
            </div>
            <div style="text-align: center;">
              <div style="border-top: 2px solid #333; width: 150px; margin-bottom: 5px;"></div>
              <p style="font-size: 12px; color: #666;">Date Issued</p>
            </div>
          </div>
        </div>
      </div>
    `,
    fields: ['recipientName', 'eventTitle', 'eventDate', 'verificationCode'],
    design: {
      backgroundColor: '#ffffff',
      primaryColor: '#1e40af',
      accentColor: '#3b82f6',
      fontFamily: 'Georgia, serif',
    },
    active: true,
  },
  {
    name: 'Modern Completion',
    category: 'completion',
    htmlTemplate: `
      <div style="width: 800px; height: 600px; padding: 40px; font-family: {{fontFamily}}; background: linear-gradient(135deg, {{backgroundColor}} 0%, #f0f0f0 100%); position: relative;">
        <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); height: calc(100% - 80px);">
          <div style="text-align: center;">
            <div style="width: 60px; height: 60px; background: {{primaryColor}}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">✓</span>
            </div>
            <h1 style="color: {{primaryColor}}; font-size: 28px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 3px;">Certificate of Completion</h1>
            <p style="color: #999; font-size: 14px; margin-bottom: 30px;">Proudly presented to</p>
            <h2 style="color: #333; font-size: 36px; font-weight: 300; margin-bottom: 20px; border-bottom: 2px solid {{accentColor}}; display: inline-block; padding-bottom: 10px;">{{recipientName}}</h2>
            <p style="color: #666; font-size: 16px; margin: 30px 0;">for successfully completing</p>
            <h3 style="color: {{primaryColor}}; font-size: 22px; margin-bottom: 20px;">{{eventTitle}}</h3>
            <p style="color: #999; font-size: 14px;">{{eventDate}}</p>
            <p style="color: #ccc; font-size: 10px; margin-top: 40px;">ID: {{verificationCode}}</p>
          </div>
        </div>
      </div>
    `,
    fields: ['recipientName', 'eventTitle', 'eventDate', 'verificationCode'],
    design: {
      backgroundColor: '#f8fafc',
      primaryColor: '#059669',
      accentColor: '#10b981',
      fontFamily: 'Inter, sans-serif',
    },
    active: true,
  },
  {
    name: 'Speaker Recognition',
    category: 'speaker',
    htmlTemplate: `
      <div style="width: 800px; height: 600px; padding: 40px; font-family: {{fontFamily}}; background: {{backgroundColor}}; position: relative; background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="%23{{primaryColorHex}}" stroke-width="0.5" opacity="0.1"/></svg>'); background-size: 100px 100px;">
        <div style="text-align: center; padding-top: 40px;">
          <div style="font-size: 40px; margin-bottom: 20px;">🎤</div>
          <h1 style="color: {{primaryColor}}; font-size: 32px; margin-bottom: 10px;">SPEAKER CERTIFICATE</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 40px;">In recognition of outstanding contribution</p>
          <h2 style="color: #333; font-size: 36px; margin-bottom: 30px;">{{recipientName}}</h2>
          <p style="color: #666; font-size: 16px; margin-bottom: 10px;">as a speaker at</p>
          <h3 style="color: {{primaryColor}}; font-size: 24px; margin-bottom: 30px;">{{eventTitle}}</h3>
          <p style="color: #666; font-size: 14px;">Session: {{sessionTitle}}</p>
          <p style="color: #999; font-size: 14px; margin-top: 10px;">{{eventDate}}</p>
          <p style="color: #ccc; font-size: 10px; margin-top: 50px;">Certificate ID: {{verificationCode}}</p>
        </div>
      </div>
    `,
    fields: ['recipientName', 'eventTitle', 'sessionTitle', 'eventDate', 'verificationCode'],
    design: {
      backgroundColor: '#fef3c7',
      primaryColor: '#d97706',
      accentColor: '#f59e0b',
      fontFamily: 'Playfair Display, serif',
    },
    active: true,
  },
];

/**
 * Get all certificate templates
 */
export async function getCertificateTemplates(): Promise<CertificateTemplate[]> {
  try {
    const templatesRef = collection(db, 'certificateTemplates');
    const q = query(templatesRef, where('active', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Return default templates if none exist
      return DEFAULT_TEMPLATES.map((t, i) => ({
        ...t,
        id: `default-${i}`,
        createdAt: new Date(),
        createdBy: 'system',
      }));
    }
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as CertificateTemplate[];
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return DEFAULT_TEMPLATES.map((t, i) => ({
      ...t,
      id: `default-${i}`,
      createdAt: new Date(),
      createdBy: 'system',
    }));
  }
}

/**
 * Generate a certificate for a user
 */
export async function generateCertificate(
  templateId: string,
  recipientId: string,
  recipientName: string,
  recipientEmail: string,
  eventId: string,
  eventTitle: string,
  additionalData: Record<string, string> = {}
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  try {
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    const certificateData: Omit<Certificate, 'id'> = {
      templateId,
      recipientId,
      recipientName,
      recipientEmail,
      eventId,
      eventTitle,
      issuedAt: new Date(),
      verificationCode,
      emailSent: false,
      data: {
        ...additionalData,
        recipientName,
        eventTitle,
        eventDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        verificationCode,
      },
    };

    const docRef = await addDoc(collection(db, 'certificates'), {
      ...certificateData,
      issuedAt: serverTimestamp(),
    });

    // Also add to user's certificates subcollection
    await addDoc(collection(db, 'users', recipientId, 'certificates'), {
      certificateId: docRef.id,
      eventId,
      eventTitle,
      issuedAt: serverTimestamp(),
    });

    return { success: true, certificateId: docRef.id };
  } catch (error) {
    console.error('Error generating certificate:', error);
    return { success: false, error: 'Failed to generate certificate' };
  }
}

/**
 * Get certificates for a user
 */
export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  try {
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('recipientId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedAt: (doc.data().issuedAt as Timestamp)?.toDate() || new Date(),
    })) as Certificate[];
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    return [];
  }
}

/**
 * Get certificates for an event
 */
export async function getEventCertificates(eventId: string): Promise<Certificate[]> {
  try {
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issuedAt: (doc.data().issuedAt as Timestamp)?.toDate() || new Date(),
    })) as Certificate[];
  } catch (error) {
    console.error('Error fetching event certificates:', error);
    return [];
  }
}

/**
 * Bulk generate certificates for event attendees
 */
export async function bulkGenerateCertificates(
  eventId: string,
  eventTitle: string,
  templateId: string,
  attendees: Array<{ id: string; name: string; email: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const attendee of attendees) {
    try {
      const result = await generateCertificate(
        templateId,
        attendee.id,
        attendee.name,
        attendee.email,
        eventId,
        eventTitle
      );
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Failed for ${attendee.name}: ${result.error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error for ${attendee.name}: ${error}`);
    }
  }

  return results;
}

/**
 * Verify a certificate by its code
 */
export async function verifyCertificate(verificationCode: string): Promise<Certificate | null> {
  try {
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('verificationCode', '==', verificationCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      issuedAt: (doc.data().issuedAt as Timestamp)?.toDate() || new Date(),
    } as Certificate;
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return null;
  }
}

/**
 * Generate a unique verification code
 */
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
}

/**
 * Render certificate HTML with data
 */
export function renderCertificateHTML(template: CertificateTemplate, data: Record<string, string>): string {
  let html = template.htmlTemplate;
  
  // Replace design variables
  html = html.replace(/\{\{backgroundColor\}\}/g, template.design.backgroundColor);
  html = html.replace(/\{\{primaryColor\}\}/g, template.design.primaryColor);
  html = html.replace(/\{\{accentColor\}\}/g, template.design.accentColor);
  html = html.replace(/\{\{fontFamily\}\}/g, template.design.fontFamily);
  html = html.replace(/\{\{primaryColorHex\}\}/g, template.design.primaryColor.replace('#', ''));
  
  // Replace data variables
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  
  return html;
}
