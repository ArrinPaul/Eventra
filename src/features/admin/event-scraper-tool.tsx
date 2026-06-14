'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Sparkles, Plus, ExternalLink, CheckCircle2 } from 'lucide-react';
import { scrapeEventMetadata, ingestExternalEvent } from '@/app/actions/scraper';
import { getIngestionSources, seedIngestionSources } from '@/app/actions/ingestion';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export function EventScraperTool() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [ingesting, setIngesting] = useState(false);
  const [sources, setSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  
  const [category, setCategory] = useState('Technology');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoadingSources(true);
    const data = await getIngestionSources();
    setSources(data);
    setLoadingSources(false);
  };

  const handleSeedSources = async () => {
    const result = await seedIngestionSources();
    if (result.success) {
      toast({ title: "Trusted Sources Updated" });
      fetchSources();
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const data = await scrapeEventMetadata(url);
      setPreview(data);
      toast({ title: "Metadata Extracted!" });
    } catch (e: any) {
      toast({ title: "Extraction Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!preview) return;
    setIngesting(true);
    try {
      const result = await ingestExternalEvent({
        ...preview,
        category,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(new Date(startDate).getTime() + 4 * 60 * 60 * 1000).toISOString(),
      });

      if (result.success) {
        toast({ title: "Event Ingested!", description: "Slug created and recommendations updated." });
        setPreview(null);
        setUrl('');
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Ingestion Failed", description: e.message, variant: "destructive" });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Neural Event Ingestor
          </CardTitle>
          <CardDescription>
            Enter an external event URL (Eventbrite, Meetup, etc.) to automatically extract details and ingest it into the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="event-url">External URL</Label>
              <Input 
                id="event-url"
                placeholder="https://www.eventbrite.com/e/tech-summit-2026..." 
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="bg-muted/30 border-border"
              />
            </div>
            <Button 
              className="mt-8 bg-primary hover:bg-primary/90" 
              onClick={handleScrape}
              disabled={loading || !url}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Fetch Meta
            </Button>
          </div>

          {preview && (
            <div className="mt-8 p-6 bg-muted/20 border border-border rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <div className="aspect-square relative rounded-xl overflow-hidden bg-black/40 border border-border">
                    {preview.imageUrl ? (
                      <Image src={preview.imageUrl} fill className="object-cover" alt="Preview" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground"><Globe size={32} /></div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-3 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{preview.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{preview.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Category</Label>
                      <select 
                        className="w-full bg-card border border-border rounded-md p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                      >
                        <option>Technology</option>
                        <option>Business</option>
                        <option>Social</option>
                        <option>Design</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Simulated Date</Label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-card border-border" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button variant="ghost" onClick={() => setPreview(null)}>Discard</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleIngest} disabled={ingesting}>
                  {ingesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Ingest & Sync Slug
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!preview && (
        <Card className="bg-card border-border text-foreground overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Trusted Sources Directory</CardTitle>
              <CardDescription>A curated list of high-quality event platforms for manual or automated ingestion.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-border" onClick={handleSeedSources}>
              <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
              Update Directory
            </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-border/50">
                {loadingSources ? (
                  <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                ) : sources.length > 0 ? (
                  sources.map((source) => (
                    <div key={source.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                             <Globe className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                             <p className="font-bold text-sm">{source.name}</p>
                             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{source.category}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] border border-border" onClick={() => setUrl(source.url)}>
                            Use Source
                          </Button>
                          <a href={source.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary">
                             <ExternalLink className="w-4 h-4" />
                          </a>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-muted-foreground">
                    <p className="text-xs">No sources configured yet. Click "Update Directory" to seed.</p>
                  </div>
                )}
             </div>
          </CardContent>
        </Card>
      )}

      {!preview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { title: 'Semantic Slugs', desc: 'Auto-generated SEO paths.', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
             { title: 'Vector Sync', desc: 'Immediate similarity indexing.', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
             { title: 'Proxy Masking', desc: 'Safe external link routing.', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
           ].map((feat, i) => (
             <div key={i} className="p-4 bg-card border border-border rounded-xl flex items-start gap-3">
                <div className="mt-0.5">{feat.icon}</div>
                <div>
                   <p className="text-sm font-bold">{feat.title}</p>
                   <p className="text-[11px] text-muted-foreground">{feat.desc}</p>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
