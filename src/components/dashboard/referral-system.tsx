'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Check, Users, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/core/utils/utils';

export function ReferralSystem() {
  const { toast } = useToast();
  const user = useQuery(api.users.viewer);
  const generateCode = useMutation(api.users.generateReferralCode);
  const redeemCode = useMutation(api.users.redeemReferral);

  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateCode();
      toast({ title: "Referral code generated!" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
    try {
      await redeemCode({ code: inputCode.trim() });
      toast({ title: "Referral redeemed!", description: "You've earned 50 XP bonus!" });
      setInputCode('');
    } catch (error: any) {
      toast({ title: "Failed to redeem", description: error.message || "Invalid code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/30 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
        <Gift size={80} className="text-indigo-400" />
      </div>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-indigo-400" />
          <CardTitle className="text-white">Referral Rewards</CardTitle>
        </div>
        <CardDescription className="text-gray-400">Invite friends and earn bonus XP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {!user.referralCode ? (
          <Button onClick={handleGenerate} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
            Generate My Referral Code
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Your Code</p>
            <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="flex-1 font-mono text-2xl font-black text-white tracking-widest">{user.referralCode}</span>
              <Button size="icon" variant="ghost" onClick={handleCopy} className="h-10 w-10 hover:bg-white/10">
                {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-[10px] text-gray-500 italic">Share this code to get 100 XP for every friend who joins.</p>
          </div>
        )}

        {!user.referredBy && (
          <div className="pt-4 border-t border-white/5 space-y-3">
            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Have a code?</p>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter friend's code" 
                value={inputCode} 
                onChange={e => setInputCode(e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-sm uppercase tracking-widest h-10"
              />
              <Button onClick={handleRedeem} disabled={loading || !inputCode} className="bg-white/10 hover:bg-white/20 text-white h-10">
                Redeem
              </Button>
            </div>
          </div>
        )}
        
        {user.referredBy && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/5 p-2 rounded-lg border border-green-500/20">
            <Check className="w-3 h-3" />
            <span>Referral bonus active! (Code: {user.referredBy})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
