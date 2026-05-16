'use client';

import { SignIn } from "@clerk/nextjs";
import { ArrowLeft, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const FEATURE_CARDS = [
  { icon: ShieldCheck, title: "Secure Access", desc: "MFA-ready identity layer" },
  { icon: Sparkles, title: "Smart Paths", desc: "AI-curated session discovery" },
  { icon: Zap, title: "Instant Sync", desc: "Workspace ready in minutes" },
];

const STAT_CARDS = [
  { label: "Latency", value: "0.4ms", note: "Global avg" },
  { label: "Uptime", value: "99.99%", note: "Last 90 days" },
  { label: "Security", value: "AES-256", note: "E2E core" },
];

const AUTH_APPEARANCE = {
  elements: {
    rootBox: "w-full",
    card: "bg-transparent border-none shadow-none p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "h-11 rounded-full border border-border/70 bg-background/80 hover:bg-muted transition-all text-foreground font-semibold uppercase tracking-[0.2em] text-[10px] shadow-sm",
    socialButtonsBlockButtonText: "font-semibold text-foreground",
    dividerRow: "py-6",
    dividerLine: "bg-border/70",
    dividerText:
      "text-[9px] uppercase font-semibold tracking-[0.3em] text-muted-foreground px-4 bg-muted/30",
    formFieldLabel:
      "text-[9px] uppercase font-semibold tracking-[0.2em] text-muted-foreground mb-2 ml-1",
    formFieldInput:
      "h-11 rounded-2xl border border-border/60 bg-background/80 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-all text-foreground px-4",
    formButtonPrimary:
      "h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold uppercase tracking-[0.2em] text-[10px] shadow-glow shadow-primary/20",
    footerActionText: "text-muted-foreground font-semibold text-[10px] uppercase tracking-wider",
    footerActionLink:
      "text-primary font-bold hover:text-primary/80 transition-colors uppercase tracking-[0.2em] text-[10px] ml-2",
    identityPreviewText: "text-foreground font-semibold",
    identityPreviewEditButton: "text-primary",
    formResendCodeLink: "text-primary font-bold uppercase tracking-widest text-[10px]",
    otpCodeFieldInput:
      "rounded-xl border border-border/60 bg-background/80 text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
  },
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-48 right-[-5%] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between gap-12 border-b border-border/60 px-6 py-10 lg:border-b-0 lg:border-r lg:px-16 lg:py-14">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Logo />
              <span className="font-display font-bold tracking-tight text-lg">Eventra</span>
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Create account
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <Badge className="w-fit rounded-full border-primary/30 bg-primary/10 text-primary uppercase text-[10px] font-bold tracking-widest">
              Secure Access
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight leading-[1.05]">
              Welcome back. <br />
              <span className="text-primary italic">Continue the mission.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Sign in to pick up the thread and resume your event workspace with personalized insights and live operations.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border bg-muted/20 p-4 shadow-sm"
              >
                <div className="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {card.title}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground/80 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {STAT_CARDS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-background/60 p-3 text-center"
              >
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm font-bold text-foreground italic leading-none">
                  {stat.value}
                </p>
                <p className="mt-2 text-[9px] text-muted-foreground uppercase tracking-widest">
                  {stat.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-12 lg:px-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="w-full max-w-md rounded-3xl border border-border/70 bg-muted/30 backdrop-blur-sm p-8 shadow-2xl ring-1 ring-white/5"
          >
            <div className="space-y-2">
              <Badge className="w-fit rounded-full border-primary/30 bg-primary/10 text-primary uppercase text-[10px] font-bold tracking-widest">
                System Access
              </Badge>
              <h2 className="text-2xl font-display font-semibold tracking-tight">Sign in</h2>
              <p className="text-sm text-muted-foreground">Authenticate to continue your journey.</p>
            </div>

            <div className="mt-8">
              <SignIn path="/login" appearance={AUTH_APPEARANCE} />
            </div>

            <div className="mt-8 border-t border-border/60 pt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to grid
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
