'use client';

import { SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const AUTH_APPEARANCE = {
  elements: {
    rootBox: "w-full",
    card: "bg-transparent border-none shadow-none p-0",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "h-12 rounded-2xl border border-border/70 bg-background/80 hover:bg-muted transition-all text-foreground font-bold uppercase tracking-[0.2em] text-[10px] shadow-sm",
    socialButtonsBlockButtonText: "font-bold text-foreground",
    dividerRow: "py-8",
    dividerLine: "bg-border/70",
    dividerText:
      "text-[9px] uppercase font-black tracking-[0.4em] text-muted-foreground/60 px-6 bg-transparent",
    formFieldLabel:
      "text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground mb-3 ml-1",
    formFieldInput:
      "h-12 rounded-2xl border border-border/60 bg-background/80 focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary/60 transition-all text-foreground px-5 text-sm font-medium",
    formButtonPrimary:
      "h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-black uppercase tracking-[0.2em] text-[10px] shadow-glow shadow-primary/20",
    footerActionText: "text-muted-foreground font-bold text-[10px] uppercase tracking-wider",
    footerActionLink:
      "text-primary font-black hover:text-primary/80 transition-colors uppercase tracking-[0.2em] text-[10px] ml-2",
    identityPreviewText: "text-foreground font-bold",
    identityPreviewEditButton: "text-primary",
    formResendCodeLink: "text-primary font-black uppercase tracking-[0.2em] text-[10px]",
    otpCodeFieldInput:
      "rounded-2xl border border-border/60 bg-background/80 text-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
  },
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30 selection:text-primary flex flex-col items-center justify-center p-6 md:p-12">
      {/* BACKGROUND ELEMENTS */}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl flex flex-col items-center gap-12"
      >
        <Link href="/" className="flex flex-col items-center gap-4 group transition-transform hover:scale-105">
          <Logo iconClassName="w-12 h-12" />
          <span className="font-display font-bold tracking-tighter text-3xl">Eventra</span>
        </Link>

        <div className="w-full rounded-[3rem] border border-border/70 bg-muted/30 backdrop-blur-xl p-8 md:p-16 shadow-2xl ring-1 ring-white/5">
          <div className="space-y-4 text-center mb-10">
            <Badge className="w-fit rounded-full border-primary/30 bg-primary/10 text-primary uppercase text-[10px] font-bold tracking-[0.2em] px-4 py-1">       
              System Access
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground text-sm md:text-base font-medium max-w-sm mx-auto leading-relaxed">
              Authenticate to continue your mission within the ecosystem.
            </p>
          </div>

          <div className="mt-8">
            <SignIn path="/login" appearance={AUTH_APPEARANCE} />
          </div>

          <div className="mt-12 border-t border-border/60 pt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to mission control
            </Link>
          </div>
        </div>

        <div className="flex gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Core_Node_v0.1
          </span>
          <span>AES-256 Encrypted</span>
        </div>
      </motion.div>
    </div>
  );
}
