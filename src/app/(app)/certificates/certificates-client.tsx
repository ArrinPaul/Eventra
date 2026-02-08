'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Download, 
  ExternalLink, 
  Search, 
  Loader2,
  Calendar,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { format } from 'date-fns';

export function CertificatesClient() {
  const { user } = useAuth();
  const certificates = useQuery(api.certificates.getByUser) || [];
  const [searchTerm, setSearchTerm] = useState('');
  
  const loading = certificates === undefined;

  const filteredCertificates = certificates.filter((cert: any) => 
    cert.event?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Certificates</h1>
          <p className="text-gray-400 mt-2 text-lg">Verified proof of your professional achievements.</p>
        </div>
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
                      <p className="text-xs text-gray-300 italic">"{cert.personalizedMessage}"</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-white text-black hover:bg-gray-200">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="border-white/10 aspect-square p-0 w-10">
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