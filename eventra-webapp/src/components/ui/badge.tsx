import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-border/60 bg-muted text-muted-foreground hover:border-primary/30 hover:text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "border-border/60 bg-background text-foreground hover:border-primary/40",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        info: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
        muted: "border-border/40 bg-muted/40 text-muted-foreground/60",
        glass: "bg-background/40 backdrop-blur-md border border-border/40 text-foreground",
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
