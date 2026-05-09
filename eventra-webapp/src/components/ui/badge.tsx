import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic aliases
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        muted: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        // Legacy color maps (mapped to semantic tokens where appropriate, or custom specific styles if needed)
        red: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20",
        blue: "border-transparent bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
        cyan: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        green: "border-transparent bg-green-500/10 text-success hover:bg-success/20",
        yellow: "border-transparent bg-yellow-500/10 text-warning hover:bg-warning/20",
        purple: "border-transparent bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
        pink: "border-transparent bg-pink-500/10 text-pink-500 hover:bg-pink-500/20",
        orange: "border-transparent bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
        indigo: "border-transparent bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
        teal: "border-transparent bg-teal-500/10 text-teal-500 hover:bg-teal-500/20",
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
