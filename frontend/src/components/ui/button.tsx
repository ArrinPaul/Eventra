import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input/90 bg-background/70 backdrop-blur-sm hover:bg-accent/40 hover:text-accent-foreground hover:border-primary/50",
        secondary:
          "bg-secondary/95 text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent/25 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_10px_28px_-14px_rgba(24,191,161,0.55)] hover:from-cyan-400 hover:to-blue-400 hover:shadow-[0_14px_34px_-14px_rgba(41,125,207,0.58)]",
        glow: "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(19,101,88,0.35)_inset,0_10px_30px_-16px_rgba(22,196,162,0.65)] hover:shadow-[0_0_0_1px_rgba(19,101,88,0.5)_inset,0_14px_34px_-14px_rgba(22,196,162,0.7)]",
        soft: "bg-primary/10 text-primary hover:bg-primary/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

