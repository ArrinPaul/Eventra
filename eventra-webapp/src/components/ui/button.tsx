import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-0.5",
        outline:
          "border border-input bg-background hover:bg-accent/10 hover:text-accent-foreground hover:border-primary/50 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "hover:bg-accent/15 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-indigo-500 text-primary-foreground shadow-[0_8px_20px_-8px_rgba(124,58,237,0.5)] hover:from-primary/90 hover:to-indigo-400 hover:shadow-[0_12px_24px_-8px_rgba(124,58,237,0.6)] hover:-translate-y-0.5",
        glow: "bg-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(124,58,237,0.4)] hover:shadow-[0_0_25px_-3px_rgba(124,58,237,0.6)] hover:-translate-y-0.5",
        soft: "bg-primary/10 text-primary hover:bg-primary/20",
        subtle: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-8 rounded-md px-3 text-xs",
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
