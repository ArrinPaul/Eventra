import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-eyebrow transition-all focus:outline-none focus:ring-2 focus:ring-notion-primary focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default: "border-notion-hairline bg-notion-surface text-notion-primary shadow-notion-soft",
        secondary: "border-transparent bg-notion-canvas-soft text-notion-ink-secondary",
        destructive: "border-transparent bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
        outline: "border-notion-hairline bg-transparent text-notion-ink-secondary",
        success: "border-transparent bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
        warning: "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100",
        sticker: "border-transparent bg-notion-accent-sky/20 text-notion-accent-sky",
        glass: "border-white/20 bg-black/60 backdrop-blur-xl text-white",
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
