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
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill="currentColor"
            fillOpacity="0.2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
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
