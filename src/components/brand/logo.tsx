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
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        "relative w-7 h-7 flex items-center justify-center shrink-0",
        iconClassName
      )}>
        {/* Professional Minimalist Mark */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-full h-full"
        >
          <motion.path
            d="M4 4H20V8H8V12H18V16H8V20H20V24H4V4Z"
            fill="currentColor"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: 'center' }}
          />
          {/* Subtle Accent Dot */}
          <motion.circle
            cx="21" cy="4" r="2.5"
            className="fill-notion-accent-sky"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          />
        </svg>
      </div>
      
      {showText && (
        <span className="font-sans font-bold tracking-tight text-[17px] text-notion-ink antialiased">
          Eventra
        </span>
      )}
    </div>
  );
}
