'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export default function ExportFunctionality() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h2 className="text-2xl font-bold">Export Your Data</h2>
        <p className="text-gray-400">Download your Eventra data for backup or analysis</p>
      </div>

      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader><CardTitle>Data Export</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">This feature is being migrated to our new database system. Check back soon!</p>
          <Button disabled className="w-full"><Download className="mr-2 h-4 w-4" /> Export Data (Coming Soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
