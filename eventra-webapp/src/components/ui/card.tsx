import * as React from "react"

import { cn } from "@/core/utils/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'premium' | 'gradient'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "rounded-2xl border border-border/80 bg-card/88 text-card-foreground shadow-[0_10px_28px_-18px_rgba(8,18,36,0.9)] backdrop-blur-sm transition-all duration-300 hover:border-primary/35 hover:shadow-[0_22px_46px_-24px_rgba(8,18,36,0.95)]",
      glass: "rounded-2xl bg-white/10 dark:bg-slate-900/70 backdrop-blur-xl border border-white/15 dark:border-white/10 shadow-[0_14px_36px_-22px_rgba(0,0,0,0.7)] text-card-foreground transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_44px_-20px_rgba(20,84,120,0.35)]",
      premium: "rounded-2xl border border-border/70 bg-card/95 text-card-foreground shadow-[0_18px_44px_-24px_rgba(7,14,30,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/45 hover:shadow-[0_24px_50px_-20px_rgba(9,20,40,0.85)]",
      gradient: "rounded-2xl bg-gradient-to-br from-cyan-500/12 via-blue-500/10 to-orange-400/10 border border-cyan-400/20 text-card-foreground shadow-[0_14px_36px_-22px_rgba(6,34,52,0.75)] transition-all duration-300 hover:border-cyan-300/35 hover:shadow-[0_20px_46px_-20px_rgba(22,151,173,0.32)]",
    }

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight font-headline",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground/90", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

