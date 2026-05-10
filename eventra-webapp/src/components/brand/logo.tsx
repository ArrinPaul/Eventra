'use client';

import { motion } from 'framer-motion';
import { cn } from '@/core/utils/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export function Logo({ className, iconClassName, showText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "relative w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow shadow-primary/20 overflow-hidden group",
        iconClassName
      )}>
        {/* Ultra-Minimal Geometric 'E' Logo */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-full h-full text-primary-foreground p-1.5"
        >
          {/* Top Bar */}
          <motion.rect 
            x="4" y="5" width="16" height="3" rx="1" 
            fill="currentColor"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
          {/* Middle Bar (Shortened) */}
          <motion.rect 
            x="4" y="10.5" width="12" height="3" rx="1" 
            fill="currentColor"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
          />
          {/* Bottom Bar */}
          <motion.rect 
            x="4" y="16" width="16" height="3" rx="1" 
            fill="currentColor"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "circOut" }}
          />
          {/* Vertical Spine */}
          <motion.rect 
            x="4" y="5" width="3" height="14" rx="1" 
            fill="currentColor"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "circOut" }}
          />
        </svg>
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {showText && (
        <span className="font-display font-bold tracking-tight text-xl text-foreground">
          Eventra
        </span>
      )}
    </div>
  );
}
