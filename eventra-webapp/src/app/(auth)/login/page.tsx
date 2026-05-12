'use client';

import { SignIn } from "@clerk/nextjs";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="relative z-10 p-20 flex flex-col justify-between h-full">
          <Link href="/" className="transition-transform duration-300 active:scale-95">
            <Logo showText className="text-white" />
          </Link>

          <div className="space-y-6">
            <div className="h-1 w-20 bg-primary shadow-glow" />
            <h1 className="text-6xl font-display font-black text-white leading-[0.9] tracking-tighter uppercase">
              Access the <br />
              <span className="text-primary italic">Ecosystem</span>
            </h1>
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            © 2026 EVENTRA — ALL RIGHTS RESERVED
          </div>
        </div>

        {/* Abstract Background Element */}
        <div className="absolute -right-20 bottom-20 w-80 h-80 border-t border-l border-zinc-800 -rotate-12" />
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative overflow-hidden">
        <div className="w-full max-w-sm space-y-12 relative z-10">
          <div className="lg:hidden">
            <Link href="/" className="transition-transform duration-300 active:scale-95">
              <Logo />
            </Link>
          </div>

          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent border-none shadow-none p-0",
                headerTitle: "text-4xl font-display font-black tracking-tighter uppercase text-foreground",
                headerSubtitle: "text-muted-foreground font-medium text-lg leading-relaxed",
                socialButtonsBlockButton: "h-16 rounded-none border border-border bg-background shadow-solid hover:translate-y-[-2px] hover:shadow-solid-hover transition-all text-foreground font-bold uppercase tracking-widest text-xs",
                socialButtonsBlockButtonText: "font-bold",
                dividerRow: "py-8",
                dividerLine: "bg-border",
                dividerText: "text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground px-4 bg-background",
                formFieldLabel: "text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-2",
                formFieldInput: "h-12 rounded-none border-border bg-background focus:ring-primary focus:border-primary transition-all",
                formButtonPrimary: "h-16 rounded-none bg-primary text-primary-foreground shadow-solid hover:translate-y-[-2px] hover:shadow-solid-hover transition-all font-bold uppercase tracking-widest text-xs",
                footerActionText: "text-muted-foreground font-medium",
                footerActionLink: "text-primary font-black hover:underline underline-offset-4 uppercase tracking-widest text-xs",
                identityPreviewText: "text-foreground font-bold",
                identityPreviewEditButton: "text-primary",
              }
            }}
          />

          <div className="pt-8 border-t border-border">
             <Link 
              href="/" 
              className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
            >
              <MoveLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to gateway
            </Link>
          </div>
        </div>

        {/* Decorative background element for mobile */}
        <div className="lg:hidden absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10" />
      </div>
    </div>
  );
}


