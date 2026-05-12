'use client';

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Chrome, Mail, ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const tc = useTranslations('Common');

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        </div>

      <Card className="w-full max-w-md bg-card border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="pt-12 pb-8 px-8 text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-glow">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black font-headline tracking-tighter">{t('signUp')}</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              Join the ecosystem and start exploring.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            size="lg"
            className="w-full h-14 rounded-2xl border-2 font-black text-base flex items-center justify-center gap-3 hover:bg-muted/50 transition-all group"
          >
            <Chrome className="h-5 w-5" />
            Sign up with Google
            <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-black tracking-widest">{t('orContinueWith')}</span>
            </div>
          </div>

          <Button
            disabled
            variant="ghost"
            size="lg"
            className="w-full h-14 rounded-2xl font-bold text-muted-foreground flex items-center justify-center gap-3"
          >
            <Mail className="h-5 w-5" />
            Work Email (Coming Soon)
          </Button>
        </CardContent>
        <CardFooter className="px-8 pb-12 pt-0 flex flex-col gap-6">
          <p className="text-[10px] text-center text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
          <div className="pt-6 border-t border-border/30 w-full text-center">
            <p className="text-sm font-medium text-muted-foreground">
                {t('hasAccount')}{' '}
                <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">
                    {t('signIn')}
                </Link>
            </p>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-8 flex items-center gap-2 text-muted-foreground/40 font-black text-[10px] uppercase tracking-[0.3em]">
        <Sparkles className="h-3 w-3" />
        AI-Powered Experience
      </div>
    </div>
  );
}
