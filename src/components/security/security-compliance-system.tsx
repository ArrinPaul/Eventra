/**
 * EventOS Security & Compliance System
 * Enterprise security with SSO, audit logging, encryption, and GDPR compliance
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, where, serverTimestamp, limit as firestoreLimit, getDoc, setDoc } from 'firebase/firestore';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
  User,
  Users,
  Building,
  Globe,
  Database,
  Server,
  Cloud,
  FileText,
  Download,
  Upload,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Share2,
  ExternalLink,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Smartphone,
  Monitor,
  Tablet,
  Activity,
  Zap,
  Target,
  Flag,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Signal,
  Network,
  Cpu,
  HardDrive,
  MemoryStick,
  MousePointer,
  Keyboard,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Equal,
  RotateCcw,
  RotateCw,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  StopCircle,
  Square
} from 'lucide-react';
import { EVENTOS_CONFIG } from '@/lib/eventos-config';
import type { User as EventosUser, Organization } from '@/types';

// Security Types
interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data' | 'network' | 'compliance';
  level: 'basic' | 'standard' | 'enhanced' | 'enterprise';
  isEnabled: boolean;
  isRequired: boolean;
  configuration: Record<string, any>;
  lastUpdated: Date;
  updatedBy: string;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'blocked';
}

interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth2';
  logo: string;
  isActive: boolean;
  configuration: {
    issuer?: string;
    clientId?: string;
    clientSecret?: string;
    discoveryEndpoint?: string;
    samlEntityId?: string;
    samlSSOUrl?: string;
    samlCertificate?: string;
    attributeMapping: Record<string, string>;
  };
  organizations: string[];
  userCount: number;
  lastSync?: Date;
}

interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'custom';
  name: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'pending';
  score: number;
  lastAssessment: Date;
  nextAssessment: Date;
  findings: ComplianceFinding[];
  requirements: ComplianceRequirement[];
}

interface ComplianceFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  assignee?: string;
  dueDate?: Date;
}

interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'met' | 'partial' | 'not_met';
  evidence: string[];
  lastVerified: Date;
}

interface EncryptionSettings {
  dataAtRest: {
    enabled: boolean;
    algorithm: string;
    keyRotationInterval: number; // days
    lastRotation?: Date;
  };
  dataInTransit: {
    enabled: boolean;
    tlsVersion: string;
    cipherSuites: string[];
  };
  applicationLevel: {
    sensitiveFields: string[];
    encryptionMethod: string;
    keyManagement: 'internal' | 'aws_kms' | 'azure_kv' | 'gcp_kms';
  };
}

interface AccessControl {
  id: string;
  userId: string;
  organizationId: string;
  permissions: Permission[];
  roles: string[];
  restrictions: Restriction[];
  lastAccess?: Date;
  isActive: boolean;
}

interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

interface Restriction {
  type: 'time' | 'location' | 'device' | 'network';
  configuration: Record<string, any>;
  isActive: boolean;
}

interface SecurityAlert {
  id: string;
  type: 'authentication' | 'authorization' | 'data_breach' | 'suspicious_activity' | 'policy_violation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignee?: string;
  actions: string[];
}

// Form schemas
const ssoProviderSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['saml', 'oidc', 'oauth2']),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  discoveryEndpoint: z.string().url().optional(),
});

const securityPolicySchema = z.object({
  name: z.string().min(1, 'Policy name required'),
  description: z.string().min(1, 'Description required'),
  category: z.enum(['authentication', 'authorization', 'data', 'network', 'compliance']),
  level: z.enum(['basic', 'standard', 'enhanced', 'enterprise']),
});

const complianceAssessmentSchema = z.object({
  type: z.enum(['gdpr', 'ccpa', 'hipaa', 'sox', 'custom']),
  name: z.string().min(1, 'Assessment name required'),
  description: z.string().optional(),
});

// Sample data
const SECURITY_POLICIES: SecurityPolicy[] = [
  {
    id: 'policy_1',
    name: 'Password Complexity',
    description: 'Enforce strong password requirements',
    category: 'authentication',
    level: 'standard',
    isEnabled: true,
    isRequired: true,
    configuration: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      preventReuse: 5,
    },
    lastUpdated: new Date('2024-12-01'),
    updatedBy: 'admin@eventos.com',
  },
  {
    id: 'policy_2',
    name: 'Multi-Factor Authentication',
    description: 'Require MFA for all user accounts',
    category: 'authentication',
    level: 'enhanced',
    isEnabled: true,
    isRequired: true,
    configuration: {
      methods: ['totp', 'sms', 'email', 'hardware'],
      gracePeriod: 7, // days
      enforceForRoles: ['admin', 'organizer', 'speaker'],
    },
    lastUpdated: new Date('2024-12-05'),
    updatedBy: 'admin@eventos.com',
  },
  {
    id: 'policy_3',
    name: 'Data Retention',
    description: 'Automatic data purging and retention policies',
    category: 'data',
    level: 'enterprise',
    isEnabled: true,
    isRequired: false,
    configuration: {
      userDataRetention: 2555, // days (7 years)
      eventDataRetention: 1825, // days (5 years)
      logRetention: 365, // days (1 year)
      autoDelete: true,
    },
    lastUpdated: new Date('2024-11-20'),
    updatedBy: 'admin@eventos.com',
  },
];

const SSO_PROVIDERS: SSOProvider[] = [
  {
    id: 'azure_ad',
    name: 'Microsoft Azure AD',
    type: 'oidc',
    logo: '🔷',
    isActive: true,
    configuration: {
      clientId: 'your-azure-client-id',
      discoveryEndpoint: 'https://login.microsoftonline.com/tenant-id/v2.0/.well-known/openid_configuration',
      attributeMapping: {
        email: 'email',
        name: 'name',
        groups: 'groups',
      },
    },
    organizations: ['org1', 'org2'],
    userCount: 234,
    lastSync: new Date('2024-12-15T10:00:00'),
  },
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    type: 'oauth2',
    logo: '🟡',
    isActive: true,
    configuration: {
      clientId: 'your-google-client-id',
      attributeMapping: {
        email: 'email',
        name: 'name',
        picture: 'picture',
      },
    },
    organizations: ['org1'],
    userCount: 89,
    lastSync: new Date('2024-12-15T09:30:00'),
  },
];

export function SecurityComplianceSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>(SECURITY_POLICIES);
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>(SSO_PROVIDERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSSODialog, setShowSSODialog] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const { user } = useAuth();
  const { toast } = useToast();

  const ssoForm = useForm({
    resolver: zodResolver(ssoProviderSchema),
    defaultValues: {
      type: 'oidc' as const,
    },
  });

  const policyForm = useForm({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: {
      category: 'authentication' as const,
      level: 'standard' as const,
    },
  });

  const complianceForm = useForm({
    resolver: zodResolver(complianceAssessmentSchema),
    defaultValues: {
      type: 'gdpr' as const,
    },
  });

  useEffect(() => {
    loadSecurityData();
  }, []);

  // Load audit logs from Firestore
  const loadAuditLogs = useCallback(async () => {
    try {
      const logsQuery = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(50)
      );
      const snapshot = await getDocs(logsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
      })) as AuditLog[];
    } catch (error) {
      console.error('Error loading audit logs:', error);
      return [];
    }
  }, []);

  // Load compliance reports from Firestore
  const loadComplianceReports = useCallback(async () => {
    try {
      const reportsQuery = query(collection(db, 'compliance_reports'));
      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastAssessment: data.lastAssessment?.toDate ? data.lastAssessment.toDate() : new Date(data.lastAssessment || Date.now()),
          nextAssessment: data.nextAssessment?.toDate ? data.nextAssessment.toDate() : new Date(data.nextAssessment || Date.now()),
          findings: (data.findings || []).map((f: any) => ({
            ...f,
            dueDate: f.dueDate?.toDate ? f.dueDate.toDate() : new Date(f.dueDate || Date.now())
          })),
          requirements: (data.requirements || []).map((r: any) => ({
            ...r,
            lastVerified: r.lastVerified?.toDate ? r.lastVerified.toDate() : new Date(r.lastVerified || Date.now())
          }))
        };
      }) as ComplianceReport[];
    } catch (error) {
      console.error('Error loading compliance reports:', error);
      return [];
    }
  }, []);

  // Load security alerts from Firestore
  const loadSecurityAlerts = useCallback(async () => {
    try {
      const alertsQuery = query(
        collection(db, 'security_alerts'),
        where('status', 'in', ['open', 'investigating']),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(alertsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
      })) as SecurityAlert[];
    } catch (error) {
      console.error('Error loading security alerts:', error);
      return [];
    }
  }, []);

  // Load encryption settings from Firestore
  const loadEncryptionSettings = useCallback(async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'security_settings', 'encryption'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          dataAtRest: {
            ...data.dataAtRest,
            lastRotation: data.dataAtRest?.lastRotation?.toDate ? data.dataAtRest.lastRotation.toDate() : new Date()
          },
          dataInTransit: data.dataInTransit,
          applicationLevel: data.applicationLevel
        } as EncryptionSettings;
      }
      
      // Return default settings if none exist
      return {
        dataAtRest: {
          enabled: true,
          algorithm: 'AES-256-GCM',
          keyRotationInterval: 90,
          lastRotation: new Date(),
        },
        dataInTransit: {
          enabled: true,
          tlsVersion: 'TLS 1.3',
          cipherSuites: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'],
        },
        applicationLevel: {
          sensitiveFields: ['password', 'ssn', 'paymentInfo', 'personalNotes'],
          encryptionMethod: 'AES-256-CBC',
          keyManagement: 'aws_kms',
        },
      } as EncryptionSettings;
    } catch (error) {
      console.error('Error loading encryption settings:', error);
      return null;
    }
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      // Load all security data from Firestore
      const [logs, reports, alerts, encryption] = await Promise.all([
        loadAuditLogs(),
        loadComplianceReports(),
        loadSecurityAlerts(),
        loadEncryptionSettings()
      ]);
      
      setAuditLogs(logs.slice(0, 20)); // Show only recent logs
      setComplianceReports(reports);
      setSecurityAlerts(alerts);
      setEncryptionSettings(encryption);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Unable to load security data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSSOProvider = async (data: any) => {
    try {
      const newProvider: SSOProvider = {
        id: `sso_${Date.now()}`,
        name: data.name,
        type: data.type,
        logo: data.type === 'saml' ? '🔶' : data.type === 'oidc' ? '🔷' : '🟢',
        isActive: false,
        configuration: {
          clientId: data.clientId,
          clientSecret: data.clientSecret,
          discoveryEndpoint: data.discoveryEndpoint,
          attributeMapping: {
            email: 'email',
            name: 'name',
          },
        },
        organizations: [],
        userCount: 0,
      };

      setSsoProviders(prev => [newProvider, ...prev]);
      setShowSSODialog(false);
      ssoForm.reset();

      toast({
        title: 'SSO Provider Added',
        description: 'New SSO provider has been configured successfully.',
      });
    } catch (error) {
      toast({
        title: 'Configuration Failed',
        description: 'Unable to add SSO provider.',
        variant: 'destructive',
      });
    }
  };

  const addSecurityPolicy = async (data: any) => {
    try {
      const newPolicy: SecurityPolicy = {
        id: `policy_${Date.now()}`,
        name: data.name,
        description: data.description,
        category: data.category,
        level: data.level,
        isEnabled: true,
        isRequired: false,
        configuration: {},
        lastUpdated: new Date(),
        updatedBy: user?.email || 'admin@eventos.com',
      };

      setSecurityPolicies(prev => [newPolicy, ...prev]);
      setShowPolicyDialog(false);
      policyForm.reset();

      toast({
        title: 'Security Policy Created',
        description: 'New security policy has been added successfully.',
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Unable to create security policy.',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (date: Date) => date.toLocaleString();
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Excellent
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold">{securityPolicies.filter(p => p.isEnabled).length}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Settings className="w-4 h-4 mr-1" />
                  {securityPolicies.length} total
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SSO Providers</p>
                <p className="text-2xl font-bold">{ssoProviders.filter(p => p.isActive).length}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Key className="w-4 h-4 mr-1" />
                  {ssoProviders.reduce((sum, p) => sum + p.userCount, 0)} users
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Alerts</p>
                <p className="text-2xl font-bold text-amber-600">{securityAlerts.filter(a => a.status === 'open').length}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {securityAlerts.length} total
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Security Alerts</CardTitle>
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'error' ? 'bg-orange-100 text-orange-600' :
                  alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {alert.severity === 'critical' ? <XCircle className="w-4 h-4" /> :
                   alert.severity === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                   alert.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                   <Info className="w-4 h-4" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{alert.title}</h4>
                    <Badge variant={alert.status === 'open' ? 'destructive' : 'secondary'}>
                      {alert.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatTimestamp(alert.timestamp)}
                  </p>
                </div>
                
                <Button size="sm" variant="outline">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status & Encryption Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            {complianceReports.map((report) => (
              <div key={report.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">{report.type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={report.status === 'compliant' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Score: {report.score}%</p>
                  </div>
                </div>
                <Progress value={report.score} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Last assessed: {report.lastAssessment.toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encryption Status</CardTitle>
          </CardHeader>
          <CardContent>
            {encryptionSettings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Data at Rest</h4>
                      <p className="text-sm text-muted-foreground">{encryptionSettings.dataAtRest.algorithm}</p>
                    </div>
                  </div>
                  <Badge variant={encryptionSettings.dataAtRest.enabled ? 'default' : 'secondary'}>
                    {encryptionSettings.dataAtRest.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Network className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Data in Transit</h4>
                      <p className="text-sm text-muted-foreground">{encryptionSettings.dataInTransit.tlsVersion}</p>
                    </div>
                  </div>
                  <Badge variant={encryptionSettings.dataInTransit.enabled ? 'default' : 'secondary'}>
                    {encryptionSettings.dataInTransit.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-purple-500" />
                    <div>
                      <h4 className="font-medium">Application Level</h4>
                      <p className="text-sm text-muted-foreground">{encryptionSettings.applicationLevel.encryptionMethod}</p>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            Detailed log of all system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50">
                <div className={`w-2 h-8 rounded-full ${
                  log.status === 'success' ? 'bg-green-500' :
                  log.status === 'failure' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                
                <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.resource}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm">{log.userName}</p>
                    <p className="text-xs text-muted-foreground">{log.userId}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm">{log.ipAddress}</p>
                    <p className="text-xs text-muted-foreground">{log.location?.city}, {log.location?.country}</p>
                  </div>
                  
                  <div>
                    <Badge className={getRiskColor(log.riskLevel)}>
                      {log.riskLevel}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm">{formatTimestamp(log.timestamp)}</p>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
                
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      {/* Policies Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security Policies</h3>
          <p className="text-sm text-muted-foreground">
            Configure and manage organizational security policies
          </p>
        </div>
        <Button onClick={() => setShowPolicyDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Policy
        </Button>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {securityPolicies.map((policy) => (
          <Card key={policy.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{policy.name}</h4>
                    <Badge variant="outline">{policy.category}</Badge>
                    <Badge variant={policy.level === 'enterprise' ? 'default' : 'secondary'}>
                      {policy.level}
                    </Badge>
                    {policy.isRequired && <Badge variant="destructive">Required</Badge>}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{policy.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Updated: {policy.lastUpdated.toLocaleDateString()}</span>
                    <span>By: {policy.updatedBy}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Switch 
                    checked={policy.isEnabled} 
                    onCheckedChange={(checked) => {
                      setSecurityPolicies(prev => prev.map(p => 
                        p.id === policy.id ? { ...p, isEnabled: checked } : p
                      ));
                    }}
                  />
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSSO = () => (
    <div className="space-y-6">
      {/* SSO Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Single Sign-On (SSO)</h3>
          <p className="text-sm text-muted-foreground">
            Manage SSO providers and identity federation
          </p>
        </div>
        <Button onClick={() => setShowSSODialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add SSO Provider
        </Button>
      </div>

      {/* SSO Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ssoProviders.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{provider.logo}</span>
                  <div>
                    <h4 className="font-semibold">{provider.name}</h4>
                    <Badge variant="outline">{provider.type.toUpperCase()}</Badge>
                  </div>
                </div>
                <Switch checked={provider.isActive} />
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Users:</span>
                  <span className="font-medium">{provider.userCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organizations:</span>
                  <span className="font-medium">{provider.organizations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {provider.lastSync ? provider.lastSync.toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1">
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Security & Compliance</h1>
          <p className="text-muted-foreground">
            Enterprise security with SSO, audit logging, encryption, and GDPR compliance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-red-600 to-pink-600">
            <Shield className="w-4 h-4 mr-1" />
            Security Scan
          </Button>
        </div>
      </div>

      {/* Security Status Banner */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Status: Excellent</strong> - All security policies are active and compliant. 
          Last security scan completed on {new Date().toLocaleDateString()}.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="audit">
          {renderAuditLogs()}
        </TabsContent>

        <TabsContent value="policies">
          {renderPolicies()}
        </TabsContent>

        <TabsContent value="sso">
          {renderSSO()}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compliance Reports</CardTitle>
                <Button onClick={() => setShowComplianceDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {complianceReports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.type.toUpperCase()}</p>
                    </div>
                    <Badge variant={report.status === 'compliant' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Compliance Score</span>
                      <span>{report.score}%</span>
                    </div>
                    <Progress value={report.score} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Findings: {report.findings.length}</p>
                    <p>Requirements: {report.requirements.length}</p>
                    <p>Next assessment: {report.nextAssessment.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add SSO Provider Dialog */}
      <Dialog open={showSSODialog} onOpenChange={setShowSSODialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add SSO Provider</DialogTitle>
            <DialogDescription>
              Configure a new single sign-on provider
            </DialogDescription>
          </DialogHeader>
          
          <Form {...ssoForm}>
            <form onSubmit={ssoForm.handleSubmit(addSSOProvider)} className="space-y-4">
              <FormField
                control={ssoForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Azure AD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={ssoForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="oidc">OpenID Connect</SelectItem>
                        <SelectItem value="saml">SAML 2.0</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowSSODialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  Add Provider
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Security Policy Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Security Policy</DialogTitle>
            <DialogDescription>
              Define a new organizational security policy
            </DialogDescription>
          </DialogHeader>
          
          <Form {...policyForm}>
            <form onSubmit={policyForm.handleSubmit(addSecurityPolicy)} className="space-y-4">
              <FormField
                control={policyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Data Retention Policy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={policyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describes how long data is retained..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowPolicyDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  Create Policy
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}