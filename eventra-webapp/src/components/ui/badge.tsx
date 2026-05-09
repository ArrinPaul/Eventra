import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-glow hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-border bg-background text-foreground hover:bg-muted",
        // Semantic aliases
        success: "border-transparent bg-success/10 text-success border border-success/20 hover:bg-success/20",
        warning: "border-transparent bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20",
        info: "border-transparent bg-info/10 text-info border border-info/20 hover:bg-info/20",
        muted: "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
        premium: "border-transparent bg-gradient-to-r from-primary to-info text-white shadow-neon animate-pulse",
        // Legacy color maps
        red: "border-transparent bg-destructive/10 text-destructive border border-destructive/20",
        blue: "border-transparent bg-blue-500/10 text-blue-500 border border-blue-500/20",
        cyan: "border-transparent bg-primary/10 text-primary border border-primary/20",
        green: "border-transparent bg-success/10 text-success border border-success/20",
        yellow: "border-transparent bg-warning/10 text-warning border border-warning/20",
        purple: "border-transparent bg-purple-500/10 text-purple-500 border border-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
