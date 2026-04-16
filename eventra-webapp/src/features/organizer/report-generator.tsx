'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  FileBarChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateEventSummary } from '@/app/actions/event-insights';
import { jsPDF } from 'jspdf';

interface ReportGeneratorProps {
  eventId: string;
  eventTitle: string;
}

export function ReportGenerator({ eventId, eventTitle }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await generateEventSummary(eventId);
      
      if (!response.success || !response.summary) {
        throw new Error(response.error || "Failed to generate AI summary");
      }

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(8, 145, 178); // Cyan-600
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("EVENTRA INSIGHTS REPORT", 20, 20);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);

      // Body
      doc.setTextColor(26, 26, 26);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(eventTitle.toUpperCase(), 20, 60);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 65, pageWidth - 20, 65);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AI-SYNTHESIZED SUMMARY", 20, 80);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      // Split text to wrap
      const splitSummary = doc.splitTextToSize(response.summary, pageWidth - 40);
      doc.text(splitSummary, 20, 90);

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Confidential Organizer Report - Powered by Eventra AI", pageWidth / 2, 285, { align: "center" });

      doc.save(`${eventTitle.replace(/\s+/g, '-').toLowerCase()}-report.pdf`);
      
      toast({ title: "Report Downloaded", description: "Your professional AI report is ready." });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-white/10 text-white overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg"><FileBarChart className="text-cyan-400" /></div>
          <div>
            <CardTitle>Professional After-Action Report</CardTitle>
            <CardDescription className="text-cyan-100/60">Generate a high-quality PDF summary of event success and feedback.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
         <ul className="space-y-2 mb-6">
           <li className="flex items-center gap-2 text-sm text-cyan-50/80"><CheckCircle2 size={14} className="text-cyan-400" /> Executive summary of attendance</li>
           <li className="flex items-center gap-2 text-sm text-cyan-50/80"><CheckCircle2 size={14} className="text-cyan-400" /> Sentiment analysis of feedback</li>
           <li className="flex items-center gap-2 text-sm text-cyan-50/80"><CheckCircle2 size={14} className="text-cyan-400" /> Key highlights and areas for growth</li>
         </ul>
         <Button 
            className="w-full bg-white text-cyan-900 hover:bg-cyan-50 font-bold"
            onClick={handleGenerateReport}
            disabled={isGenerating}
         >
           {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
           Generate AI Report (PDF)
         </Button>
      </CardContent>
    </Card>
  );
}
