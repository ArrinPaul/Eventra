'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Copy, Check, Twitter, Linkedin, Instagram, Share2 } from 'lucide-react';
import { generateSocialMediaPosts } from '@/app/actions/event-insights';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SocialPostGenerator({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateSocialMediaPosts(eventId);
      if (result.success) {
        setPosts(result.posts);
        toast({ title: 'Social posts generated! 🚀' });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-purple-400" />
          AI Social Promo
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs">
          Generate platform-ready posts to promote your event.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!posts ? (
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-500"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Promo Posts
          </Button>
        ) : (
          <Tabs defaultValue="X (Twitter)" className="w-full">
            <TabsList className="bg-white/5 border-white/10 w-full justify-start overflow-x-auto">
              {posts.map((p) => (
                <TabsTrigger key={p.platform} value={p.platform} className="text-xs data-[state=active]:bg-purple-600">
                  {p.platform === 'X (Twitter)' && <Twitter className="h-3 w-3 mr-1" />}
                  {p.platform === 'LinkedIn' && <Linkedin className="h-3 w-3 mr-1" />}
                  {p.platform === 'Instagram' && <Instagram className="h-3 w-3 mr-1" />}
                  {p.platform.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            {posts.map((p, i) => (
              <TabsContent key={p.platform} value={p.platform} className="mt-4 space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 relative group">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.hashtags.map((h: string) => (
                      <span key={h} className="text-[10px] text-purple-400 font-medium">{h}</span>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(p.content + '

' + p.hashtags.join(' '), i)}
                  >
                    {copiedIndex === i ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            ))}
            <Button 
              variant="link" 
              size="sm" 
              className="text-gray-500 text-[10px] w-full mt-2"
              onClick={() => setPosts(null)}
            >
              Regenerate
            </Button>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
