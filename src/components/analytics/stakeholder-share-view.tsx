'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Share2,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Settings,
  Link2,
  Mail,
  QrCode,
  Download,
  RefreshCw,
  Shield,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ShareableReportConfig {
  id: string;
  eventId: string;
  eventName: string;
  createdAt: Date;
  expiresAt: Date | null;
  isPasswordProtected: boolean;
  password?: string;
  shareUrl: string;
  viewCount: number;
  lastViewed: Date | null;
  settings: {
    showRevenue: boolean;
    showDemographics: boolean;
    showAttendeeNames: boolean;
    showCheckInRate: boolean;
    showFeedback: boolean;
    anonymizeDemographics: boolean;
  };
}

interface StakeholderReportData {
  eventName: string;
  eventDate: string;
  organizer: string;
  summary: {
    totalRegistrations: number;
    totalCheckIns: number;
    checkInRate: number;
    capacity: number;
    fillRate: number;
  };
  revenue?: {
    total: number;
    byTicketType: Array<{ type: string; count: number; revenue: number }>;
  };
  demographics?: {
    departments: Array<{ name: string; percentage: number }>;
    years: Array<{ year: string; percentage: number }>;
  };
  feedback?: {
    averageRating: number;
    totalResponses: number;
    highlights: string[];
  };
  timeline: Array<{ date: string; registrations: number; checkIns: number }>;
}

interface StakeholderShareViewProps {
  eventId: string;
  eventName: string;
  onClose?: () => void;
}

export function StakeholderShareDialog({ eventId, eventName, onClose }: StakeholderShareViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shareConfig, setShareConfig] = useState<ShareableReportConfig | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Share settings
  const [settings, setSettings] = useState({
    showRevenue: false,
    showDemographics: true,
    showAttendeeNames: false,
    showCheckInRate: true,
    showFeedback: true,
    anonymizeDemographics: true
  });
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('7'); // days

  const generateShareLink = () => {
    // In production, this would create a unique link in Firestore
    const uniqueId = Math.random().toString(36).substring(2, 10);
    return `${window.location.origin}/reports/share/${uniqueId}`;
  };

  const handleCreateShareLink = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newConfig: ShareableReportConfig = {
        id: Math.random().toString(36).substring(2, 10),
        eventId,
        eventName,
        createdAt: new Date(),
        expiresAt: expiresIn !== 'never' ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000) : null,
        isPasswordProtected,
        password: isPasswordProtected ? password : undefined,
        shareUrl: generateShareLink(),
        viewCount: 0,
        lastViewed: null,
        settings
      };
      
      setShareConfig(newConfig);
      setShowCreateDialog(false);
      
      toast({
        title: 'Share Link Created',
        description: 'Your shareable report link is ready!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareConfig?.shareUrl) {
      navigator.clipboard.writeText(shareConfig.shareUrl);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard'
      });
    }
  };

  const handleEmailShare = () => {
    if (shareConfig?.shareUrl) {
      const subject = encodeURIComponent(`Event Report: ${eventName}`);
      const body = encodeURIComponent(`View the event analytics report here: ${shareConfig.shareUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const handleRevokeLink = () => {
    setShareConfig(null);
    toast({
      title: 'Link Revoked',
      description: 'The share link has been deactivated.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Share Analytics Report</h3>
        <p className="text-sm text-muted-foreground">
          Create a shareable link for sponsors, stakeholders, or administrators
        </p>
      </div>

      {shareConfig ? (
        /* Existing Share Link */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Share Link Active</span>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Input 
                  value={shareConfig.shareUrl} 
                  readOnly 
                  className="bg-white"
                />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => window.open(shareConfig.shareUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                  <Eye className="w-3 h-3" />
                  {shareConfig.viewCount} views
                </Badge>
                {shareConfig.isPasswordProtected && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="w-3 h-3" />
                    Password protected
                  </Badge>
                )}
                {shareConfig.expiresAt && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    Expires {shareConfig.expiresAt.toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEmailShare} className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Email Link
            </Button>
            <Button variant="outline" className="flex-1">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Privacy Settings Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {shareConfig.settings.showRevenue ? (
                    <Eye className="w-3 h-3 text-green-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-red-600" />
                  )}
                  <span>Revenue Data</span>
                </div>
                <div className="flex items-center gap-2">
                  {shareConfig.settings.showDemographics ? (
                    <Eye className="w-3 h-3 text-green-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-red-600" />
                  )}
                  <span>Demographics</span>
                </div>
                <div className="flex items-center gap-2">
                  {shareConfig.settings.showAttendeeNames ? (
                    <Eye className="w-3 h-3 text-green-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-red-600" />
                  )}
                  <span>Attendee Names</span>
                </div>
                <div className="flex items-center gap-2">
                  {shareConfig.settings.anonymizeDemographics ? (
                    <Lock className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Unlock className="w-3 h-3 text-amber-600" />
                  )}
                  <span>Anonymized</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
            <Button variant="destructive" onClick={handleRevokeLink} className="flex-1">
              Revoke Link
            </Button>
          </div>
        </motion.div>
      ) : (
        /* Create New Share Link */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Share2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Create Shareable Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate a secure link to share event analytics with stakeholders
                  </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Create Share Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <Shield className="w-6 h-6 mx-auto text-blue-600 mb-2" />
              <p className="text-xs font-medium">Password Protection</p>
            </Card>
            <Card className="p-3 text-center">
              <Clock className="w-6 h-6 mx-auto text-amber-600 mb-2" />
              <p className="text-xs font-medium">Expiration Dates</p>
            </Card>
            <Card className="p-3 text-center">
              <EyeOff className="w-6 h-6 mx-auto text-green-600 mb-2" />
              <p className="text-xs font-medium">Privacy Controls</p>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Settings</DialogTitle>
            <DialogDescription>
              Configure what information to include in the shareable report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Data to Include */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Data to Include</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Revenue Data</span>
                  </div>
                  <Switch 
                    checked={settings.showRevenue}
                    onCheckedChange={(checked) => setSettings({...settings, showRevenue: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Demographics</span>
                  </div>
                  <Switch 
                    checked={settings.showDemographics}
                    onCheckedChange={(checked) => setSettings({...settings, showDemographics: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Check-in Rate</span>
                  </div>
                  <Switch 
                    checked={settings.showCheckInRate}
                    onCheckedChange={(checked) => setSettings({...settings, showCheckInRate: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Feedback & Ratings</span>
                  </div>
                  <Switch 
                    checked={settings.showFeedback}
                    onCheckedChange={(checked) => setSettings({...settings, showFeedback: checked})}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Privacy */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Privacy & Security</Label>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Anonymize Demographics</span>
                </div>
                <Switch 
                  checked={settings.anonymizeDemographics}
                  onCheckedChange={(checked) => setSettings({...settings, anonymizeDemographics: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Password Protection</span>
                </div>
                <Switch 
                  checked={isPasswordProtected}
                  onCheckedChange={setIsPasswordProtected}
                />
              </div>

              {isPasswordProtected && (
                <Input 
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </div>

            <Separator />

            {/* Expiration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Link Expiration</Label>
              <div className="flex gap-2">
                {['7', '30', '90', 'never'].map((days) => (
                  <Button
                    key={days}
                    variant={expiresIn === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpiresIn(days)}
                  >
                    {days === 'never' ? 'Never' : `${days} days`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShareLink} disabled={loading}>
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {shareConfig ? 'Update Link' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Public Stakeholder Report View (for shared links)
export function StakeholderReportView({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<StakeholderReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    
    // Simulate loading - in production, fetch from Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data
    setData({
      eventName: 'Tech Summit 2026',
      eventDate: 'February 15, 2026',
      organizer: 'EventOS Team',
      summary: {
        totalRegistrations: 485,
        totalCheckIns: 412,
        checkInRate: 84.9,
        capacity: 500,
        fillRate: 97.0
      },
      demographics: {
        departments: [
          { name: 'Computer Science', percentage: 35 },
          { name: 'Business', percentage: 25 },
          { name: 'Engineering', percentage: 20 },
          { name: 'Other', percentage: 20 }
        ],
        years: [
          { year: 'Undergraduate', percentage: 60 },
          { year: 'Graduate', percentage: 30 },
          { year: 'Faculty/Staff', percentage: 10 }
        ]
      },
      feedback: {
        averageRating: 4.7,
        totalResponses: 312,
        highlights: [
          'Excellent speakers and content quality',
          'Great networking opportunities',
          'Well-organized event logistics'
        ]
      },
      timeline: [
        { date: 'Week 1', registrations: 85, checkIns: 0 },
        { date: 'Week 2', registrations: 156, checkIns: 0 },
        { date: 'Week 3', registrations: 298, checkIns: 0 },
        { date: 'Week 4', registrations: 485, checkIns: 412 }
      ]
    });

    setLoading(false);
  };

  const handlePasswordSubmit = () => {
    // Validate password
    setRequiresPassword(false);
    loadReport();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              This report is password protected. Enter the password to view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handlePasswordSubmit} className="w-full">
              View Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Report Unavailable</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="mb-2">Event Report</Badge>
                <h1 className="text-2xl font-bold">{data.eventName}</h1>
                <p className="text-muted-foreground">{data.eventDate} • {data.organizer}</p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{data.summary.totalRegistrations}</p>
              <p className="text-sm text-muted-foreground">Registrations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{data.summary.totalCheckIns}</p>
              <p className="text-sm text-muted-foreground">Check-ins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{data.summary.checkInRate}%</p>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto text-amber-600 mb-2" />
              <p className="text-2xl font-bold">{data.summary.fillRate}%</p>
              <p className="text-sm text-muted-foreground">Fill Rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Demographics */}
          {data.demographics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendee Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">By Department</p>
                  {data.demographics.departments.map((dept) => (
                    <div key={dept.name} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{dept.name}</span>
                        <span>{dept.percentage}%</span>
                      </div>
                      <Progress value={dept.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">By Level</p>
                  {data.demographics.years.map((year) => (
                    <div key={year.year} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{year.year}</span>
                        <span>{year.percentage}%</span>
                      </div>
                      <Progress value={year.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {data.feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feedback Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-amber-500">{data.feedback.averageRating}</p>
                  <div className="flex justify-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={star <= Math.round(data.feedback!.averageRating) ? 'text-amber-500' : 'text-gray-300'}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {data.feedback.totalResponses} responses
                  </p>
                </div>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium mb-2">Top Highlights</p>
                  <ul className="space-y-2">
                    {data.feedback.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Report generated by EventOS • {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
