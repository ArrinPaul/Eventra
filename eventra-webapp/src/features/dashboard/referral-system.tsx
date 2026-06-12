'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Check, Loader2 } from 'lucide-react';

export function ReferralSystem() {
  const { toast } = useToast();
  // Simplified for redesign focus
  const [user, setUser] = useState<any | null>({ referralCode: 'EVENTRA-882' });

  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Code copied to clipboard" });
    }
  };

  const handleRedeem = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Referral redeemed!", description: "You've earned 50 XP bonus!" });
      setInputCode('');
      setLoading(false);
    }, 1000);
  };

  if (!user) return null;

  return (
    <Card className="bg-notion-surface border-notion-hairline overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
        <Gift size={80} className="text-notion-accent-purple" />
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-notion-accent-purple/10 text-notion-accent-purple">
            <Gift className="w-4 h-4" />
          </div>
          <CardTitle className="text-h3">Referral Rewards</CardTitle>
        </div>
        <CardDescription className="text-body-sm text-notion-ink-muted">Invite friends and earn bonus XP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="space-y-3">
          <p className="text-eyebrow text-notion-ink-faint uppercase font-bold">Your Invite Code</p>
          <div className="flex items-center gap-2 p-1.5 pl-4 bg-notion-canvas-soft border border-notion-hairline rounded-md">
            <span className="flex-1 font-mono text-lg font-bold text-notion-ink tracking-widest">{user.referralCode}</span>
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-8 w-8 hover:bg-notion-canvas">
              {copied ? <Check className="h-4 w-4 text-notion-accent-green" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-caption text-notion-ink-muted">100 XP for every friend who joins.</p>
        </div>

        <div className="pt-6 border-t border-notion-hairline space-y-3">
          <p className="text-eyebrow text-notion-ink-faint uppercase font-bold">Have a code?</p>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter code" 
              value={inputCode} 
              onChange={e => setInputCode(e.target.value)}
              className="font-mono text-body-sm uppercase tracking-widest"
            />
            <Button onClick={handleRedeem} variant="utility" disabled={loading || !inputCode}>
              Redeem
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
