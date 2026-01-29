'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Award, 
  Search, 
  Download,
  Filter,
  Calendar,
  CheckCircle,
  ExternalLink,
  Loader2,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getUserCertificates, Certificate, getCertificateTemplates, CertificateTemplate } from '@/app/actions/certificates';
import { CertificateCard } from '@/components/certificates/certificate-card';
import Link from 'next/link';

type CertificateCategory = 'all' | 'attendance' | 'completion' | 'achievement' | 'speaker' | 'organizer';

const categoryConfig = {
  all: { label: 'All', icon: Award },
  attendance: { label: 'Attendance', icon: CheckCircle, color: 'text-blue-500' },
  completion: { label: 'Completion', icon: Award, color: 'text-green-500' },
  achievement: { label: 'Achievement', icon: Award, color: 'text-purple-500' },
  speaker: { label: 'Speaker', icon: Award, color: 'text-amber-500' },
  organizer: { label: 'Organizer', icon: Award, color: 'text-rose-500' },
};

export function CertificatesClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Map<string, CertificateTemplate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CertificateCategory>('all');

  useEffect(() => {
    if (user?.uid) {
      loadCertificates();
    }
  }, [user?.uid]);

  const loadCertificates = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const [certsData, templatesData] = await Promise.all([
        getUserCertificates(user.uid),
        getCertificateTemplates(),
      ]);
      
      setCertificates(certsData);
      
      // Create template lookup map
      const templateMap = new Map<string, CertificateTemplate>();
      templatesData.forEach(t => templateMap.set(t.id, t));
      setTemplates(templateMap);
    } catch (error) {
      console.error('Error loading certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your certificates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemplateCategory = (templateId: string): CertificateCategory => {
    const template = templates.get(templateId);
    return template?.category || 'attendance';
  };

  const getTemplateName = (templateId: string): string => {
    const template = templates.get(templateId);
    return template?.name || 'Certificate';
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const category = getTemplateCategory(cert.templateId);
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = certificates.reduce((acc, cert) => {
    const category = getTemplateCategory(cert.templateId);
    acc[category] = (acc[category] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view your certificates</h2>
        <p className="text-muted-foreground mb-4">
          Your earned certificates will appear here once you sign in.
        </p>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="text-muted-foreground">
            View and download your earned certificates from events you've attended.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Award className="h-5 w-5 mr-2" />
            {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['attendance', 'completion', 'achievement', 'speaker', 'organizer'] as const).map(cat => {
          const config = categoryConfig[cat];
          const Icon = config.icon;
          const count = categoryCounts[cat] || 0;
          
          return (
            <Card 
              key={cat} 
              className={cn(
                'cursor-pointer transition-colors hover:border-primary',
                categoryFilter === cat && 'border-primary bg-primary/5'
              )}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            >
              <CardContent className="p-4 text-center">
                <Icon className={cn('h-6 w-6 mx-auto mb-2', config.color)} />
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certificates by event name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {categoryFilter !== 'all' && (
          <Button variant="outline" onClick={() => setCategoryFilter('all')}>
            Clear Filter
          </Button>
        )}
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            {certificates.length === 0 ? (
              <>
                <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Attend events and complete activities to earn certificates!
                </p>
                <Button asChild>
                  <Link href="/explore">Explore Events</Link>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">No matching certificates</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map(cert => (
            <CertificateCard
              key={cert.id}
              id={cert.id}
              templateName={getTemplateName(cert.templateId)}
              category={getTemplateCategory(cert.templateId) as 'attendance' | 'completion' | 'achievement' | 'speaker' | 'organizer'}
              data={{
                recipientName: cert.recipientName,
                eventTitle: cert.eventTitle,
                eventDate: cert.data?.eventDate || new Date(cert.issuedAt).toLocaleDateString(),
                verificationCode: cert.verificationCode,
              }}
              issuedAt={new Date(cert.issuedAt)}
              downloadUrl={cert.downloadUrl}
            />
          ))}
        </div>
      )}

      {/* Verify Certificate Link */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground mb-2">
            Need to verify a certificate?
          </p>
          <Button variant="outline" asChild>
            <Link href="/certificates/verify">
              <ExternalLink className="h-4 w-4 mr-2" />
              Certificate Verification Portal
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
