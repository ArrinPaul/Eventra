'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Award, 
  Send, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Download,
  Eye,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  getCertificateTemplates, 
  getEventCertificates, 
  bulkGenerateCertificates,
  renderCertificateHTML,
  CertificateTemplate,
  Certificate
} from '@/app/actions/certificates';
import { CertificateViewer } from './certificate-card';

interface Attendee {
  id: string;
  name: string;
  email: string;
  checkedIn: boolean;
}

interface CertificateManagerProps {
  eventId: string;
  eventTitle: string;
  attendees: Attendee[];
  onCertificatesGenerated?: () => void;
}

export function CertificateManager({
  eventId,
  eventTitle,
  attendees,
  onCertificatesGenerated,
}: CertificateManagerProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewCertId, setPreviewCertId] = useState<string>('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'checked-in' | 'not-issued'>('checked-in');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, certificatesData] = await Promise.all([
        getCertificateTemplates(),
        getEventCertificates(eventId),
      ]);
      setTemplates(templatesData);
      setCertificates(certificatesData);
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificate data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAttendees = (): Attendee[] => {
    const issuedIds = new Set(certificates.map(c => c.recipientId));
    
    switch (recipientFilter) {
      case 'checked-in':
        return attendees.filter(a => a.checkedIn && !issuedIds.has(a.id));
      case 'not-issued':
        return attendees.filter(a => !issuedIds.has(a.id));
      case 'all':
      default:
        return attendees.filter(a => !issuedIds.has(a.id));
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Select Template',
        description: 'Please select a certificate template first',
        variant: 'destructive',
      });
      return;
    }

    const eligibleAttendees = getFilteredAttendees();
    if (eligibleAttendees.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'No eligible attendees found for certificate generation',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const result = await bulkGenerateCertificates(
        eventId,
        eventTitle,
        selectedTemplate,
        eligibleAttendees
      );

      toast({
        title: 'Certificates Generated',
        description: `Successfully generated ${result.success} certificates. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
        variant: result.failed > 0 ? 'default' : 'default',
      });

      // Reload certificates
      const updatedCerts = await getEventCertificates(eventId);
      setCertificates(updatedCerts);
      onCertificatesGenerated?.();
    } catch (error) {
      console.error('Error generating certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificates',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const sampleData = {
      recipientName: 'John Doe',
      eventTitle: eventTitle,
      eventDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      verificationCode: 'XXXX-XXXX-XXXX',
      sessionTitle: 'Sample Session',
    };

    const html = renderCertificateHTML(template, sampleData);
    setPreviewHtml(html);
    setPreviewCertId('preview');
  };

  const handleViewCertificate = (cert: Certificate) => {
    const template = templates.find(t => t.id === cert.templateId);
    if (!template) return;

    const html = renderCertificateHTML(template, cert.data);
    setPreviewHtml(html);
    setPreviewCertId(cert.id);
  };

  const filteredAttendees = getFilteredAttendees();
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const issuedCount = certificates.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certificate Management
              </CardTitle>
              <CardDescription>Generate and manage certificates for event attendees</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{checkedInCount} checked in</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-blue-500" />
                <span>{issuedCount} issued</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="generate" className="space-y-4">
            <TabsList>
              <TabsTrigger value="generate">Generate Certificates</TabsTrigger>
              <TabsTrigger value="issued">Issued ({issuedCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              {/* Template Selection */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Certificate Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select value={recipientFilter} onValueChange={(v: any) => setRecipientFilter(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checked-in">Checked-in Attendees</SelectItem>
                      <SelectItem value="not-issued">Not Yet Issued</SelectItem>
                      <SelectItem value="all">All Attendees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview & Generate */}
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={handlePreviewTemplate} disabled={!selectedTemplate}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Template
                </Button>
                <Button 
                  onClick={handleGenerateCertificates} 
                  disabled={generating || filteredAttendees.length === 0}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Generate for {filteredAttendees.length} Recipients
                </Button>
              </div>

              {/* Eligible Recipients Preview */}
              {filteredAttendees.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Eligible Recipients ({filteredAttendees.length})</h4>
                  <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                    {filteredAttendees.slice(0, 10).map(attendee => (
                      <div 
                        key={attendee.id} 
                        className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{attendee.name}</span>
                        </div>
                        <span className="text-muted-foreground">{attendee.email}</span>
                      </div>
                    ))}
                    {filteredAttendees.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        +{filteredAttendees.length - 10} more recipients
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="issued" className="space-y-4">
              {certificates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No certificates have been issued yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map(cert => (
                    <div 
                      key={cert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{cert.recipientName}</p>
                          <p className="text-sm text-muted-foreground">{cert.recipientEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {cert.verificationCode}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewCertificate(cert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Certificate Preview Modal */}
      {previewHtml && (
        <CertificateViewer
          html={previewHtml}
          certificateId={previewCertId}
          onClose={() => setPreviewHtml(null)}
        />
      )}
    </>
  );
}

export default CertificateManager;
