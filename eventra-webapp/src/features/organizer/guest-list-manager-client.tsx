'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  FileUp, 
  Download, 
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  Table as TableIcon,
  Trash2,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importAttendees } from '@/app/actions/registrations';
import Papa from 'papaparse';

interface GuestListManagerProps {
  eventId: string;
  eventTitle: string;
  ticketTiers: any[];
}

export function GuestListManagerClient({ eventId, eventTitle, ticketTiers }: GuestListManagerProps) {
  const { toast } = useToast();
  const [isImporting, setIsInviting] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<{ success: number, failed: number, errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data.slice(0, 10)); // Show first 10 for preview
        toast({ title: "File Parsed", description: `Found ${results.data.length} records.` });
      }
    });
  };

  const handleImport = async () => {
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    setIsInviting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const guestList = rows.map(row => ({
          email: row.email || row.Email,
          name: row.name || row.Name,
          tierId: selectedTierId || undefined
        })).filter(g => !!g.email);

        try {
          const res = await importAttendees(eventId, guestList);
          setImportResults(res);
          toast({ 
            title: "Import Complete", 
            description: `Successfully imported ${res.success} guests.` 
          });
        } catch (error: any) {
          toast({ title: "Import Failed", description: error.message, variant: "destructive" });
        } finally {
          setIsInviting(false);
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "email,name\nguest@example.com,John Doe\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "eventra_guest_template.csv";
    link.click();
  };

  return (
    <div className="space-y-8 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Card */}
        <Card className="bg-muted/40 border-border text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileUp size={20} className="text-emerald-400" />
              Bulk Guest Import
            </CardTitle>
            <CardDescription>Upload a CSV file to bulk-register attendees for {eventTitle}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="p-6 border-2 border-dashed border-border rounded-xl bg-muted/40 text-center space-y-4">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                   <p className="text-sm font-bold">Select CSV File</p>
                   <p className="text-xs text-muted-foreground">Columns required: email, name (optional)</p>
                </div>
                <Input 
                  id="csv-upload"
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  className="bg-muted/40 border-border"
                />
             </div>

             <div className="space-y-2">
                <Label>Assign Ticket Tier (Optional)</Label>
                <select 
                  className="w-full bg-muted/40 border border-border rounded-md p-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={selectedTierId}
                  onChange={e => setSelectedTierId(e.target.value)}
                >
                  <option value="" className="bg-gray-900">No Tier / General</option>
                  {ticketTiers.map(tier => (
                    <option key={tier.id} value={tier.id} className="bg-gray-900">{tier.name} (${tier.price})</option>
                  ))}
                </select>
             </div>

             <div className="flex gap-4">
                <Button variant="outline" className="flex-1 border-border" onClick={downloadTemplate}>
                   <Download className="w-4 h-4 mr-2" /> Template
                </Button>
                <Button 
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white" 
                  onClick={handleImport}
                  disabled={isImporting || previewData.length === 0}
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Import Guests
                </Button>
             </div>
          </CardContent>
        </Card>

        {/* Preview / Results Card */}
        <Card className="bg-muted/40 border-border text-white overflow-hidden">
          <CardHeader className="border-b border-border/60">
             <CardTitle className="text-sm font-bold flex items-center gap-2">
                {importResults ? <Info size={16} className="text-primary" /> : <TableIcon size={16} className="text-muted-foreground" />}
                {importResults ? "Import Summary" : "CSV Preview (First 10)"}
             </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {importResults ? (
               <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-xs text-muted-foreground uppercase font-black mb-1">Success</p>
                        <p className="text-3xl font-black text-emerald-500">{importResults.success}</p>
                     </div>
                     <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <p className="text-xs text-muted-foreground uppercase font-black mb-1">Failed</p>
                        <p className="text-3xl font-black text-red-500">{importResults.failed}</p>
                     </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-muted-foreground uppercase">Error Logs</p>
                       <div className="max-h-48 overflow-y-auto rounded-lg bg-background/40 border border-border/60 p-3 font-mono text-[10px] text-red-400">
                          {importResults.errors.map((err, i) => <div key={i}>{err}</div>)}
                       </div>
                    </div>
                  )}

                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setImportResults(null)}>
                     Clear and Upload New
                  </Button>
               </div>
             ) : previewData.length > 0 ? (
                <div className="divide-y divide-border/60">
                   {previewData.map((row, i) => (
                     <div key={i} className="px-6 py-3 flex justify-between items-center hover:bg-muted/40 transition-colors">
                        <div>
                           <p className="text-sm font-bold">{row.name || 'No Name'}</p>
                           <p className="text-xs text-muted-foreground">{row.email}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-border opacity-50">Row {i + 1}</Badge>
                     </div>
                   ))}
                </div>
             ) : (
                <div className="py-24 text-center text-muted-foreground">
                   <p className="text-sm italic">No file selected for preview.</p>
                </div>
             )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
