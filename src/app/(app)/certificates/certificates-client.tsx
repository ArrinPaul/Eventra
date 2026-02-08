'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Award, 
  Download, 
  ExternalLink, 
  Search, 
  Loader2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useConvex } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CertificatesClient() {
  const { user } = useAuth();
  const convex = useConvex();
  const certificatesRaw = useQuery(api.certificates.getByUser);
  const certificates = certificatesRaw ?? [];
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  
  const loading = certificatesRaw === undefined;

  const filteredCertificates = certificates.filter((cert: any) => 
    cert.event?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (cert: any) => {
    // Generate a simple text certificate for download
    const content = `
═══════════════════════════════════════════════════
              CERTIFICATE OF COMPLETION
═══════════════════════════════════════════════════

This is to certify that

    ${user?.name ?? 'Attendee'}

has successfully completed

    ${cert.event?.title ?? 'Event'}

Certificate Number: ${cert.certificateNumber}
Issue Date: ${format(cert.issueDate, 'MMMM dd, yyyy')}

${cert.personalizedMessage ? `Message: ${cert.personalizedMessage}` : ''}

Verified by Eventra Platform
═══════════════════════════════════════════════════
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${cert.certificateNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerify = async () => {
    if (!verifyNumber.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      // Use Convex query to search all certificates, not just local ones
      const result = await convex.query(api.certificates.verify, { certificateNumber: verifyNumber.trim() });
      if (result) {
        setVerifyResult({
          valid: true,
          certificateNumber: result.certificateNumber,
          eventTitle: result.eventTitle ?? 'Unknown',
          userName: result.userName ?? 'Unknown',
          issueDate: result.issueDate,
        });
      } else {
        setVerifyResult({ valid: false });
      }
    } catch {
      setVerifyResult({ valid: false });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container py-8 space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Certificates</h1>
          <p className="text-gray-400 mt-2 text-lg">Verified proof of your professional achievements.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search by event or ID..." 
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10 hover:bg-white/10">
                <ShieldCheck className="w-4 h-4 mr-2" /> Verify
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white border-white/10">
              <DialogHeader>
                <DialogTitle>Verify Certificate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter certificate number..."
                    value={verifyNumber}
                    onChange={(e) => setVerifyNumber(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                  <Button onClick={handleVerify} disabled={verifying}>
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
                {verifyResult && (
                  <div className={`p-4 rounded-lg border ${verifyResult.valid ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    {verifyResult.valid ? (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-400">Valid Certificate</p>
                          <p className="text-sm text-gray-400">Event: {verifyResult.eventTitle}</p>
                          <p className="text-sm text-gray-400">Issued: {format(verifyResult.issueDate, 'MMMM dd, yyyy')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <p className="text-red-400">Certificate not found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
          <Award size={64} className="mx-auto mb-6 text-gray-700" />
          <h3 className="text-xl font-bold mb-2">No certificates found</h3>
          <p className="text-gray-500 mb-8">Attend events and complete surveys to earn verified certificates.</p>
          <Button variant="outline" className="border-white/20 hover:bg-white/10">Browse Events</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert: any) => (
            <Card key={cert._id} className="bg-white/5 border-white/10 overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-purple-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-cyan-500/10 p-3 rounded-2xl">
                    <Award className="w-8 h-8 text-cyan-400" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-white/10 text-gray-400">
                    ID: {cert.certificateNumber}
                  </Badge>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors">
                    {cert.event?.title}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={14} className="text-gray-600" />
                      <span>Issued on {format(cert.issueDate, 'MMMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-green-500/80 font-medium">Verified Completion</span>
                    </div>
                  </div>

                  {cert.personalizedMessage && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-xs text-gray-300 italic">&quot;{cert.personalizedMessage}&quot;</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-white text-black hover:bg-gray-200" onClick={() => handleDownload(cert)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" className="border-white/10 aspect-square p-0 w-10" onClick={() => { setVerifyNumber(cert.certificateNumber); }}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verification Badge */}
      <div className="flex justify-center pt-8">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/5 border border-green-500/20 rounded-full">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-green-400">All Eventra certificates are cryptographically verifiable.</span>
        </div>
      </div>
    </div>
  );
}