import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.15em] transition-all focus:outline-none focus:ring-1 focus:ring-ring select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#7C4DFF] text-white",
        secondary: "border-border bg-secondary text-secondary-foreground hover:border-[#7C4DFF]",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border bg-background text-foreground",
        success: "border-[#10B981] bg-[#10B981]/10 text-[#10B981]",
        warning: "border-warning bg-warning/10 text-warning",
        info: "border-[#7C4DFF] bg-[#7C4DFF]/10 text-[#7C4DFF]",
        muted: "border-border bg-muted/60 text-muted-foreground",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-foreground",
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
