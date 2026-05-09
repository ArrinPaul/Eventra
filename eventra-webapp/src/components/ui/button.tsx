import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-xs font-bold uppercase tracking-widest ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-[#7C4DFF] text-white shadow-solid hover:translate-y-[-2px] hover:shadow-solid-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-solid hover:translate-y-[-2px]",
        outline:
          "border border-border bg-background hover:bg-secondary hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-[#7C4DFF] underline-offset-4 hover:underline",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 text-foreground hover:bg-white/10",
        soft: "bg-[#7C4DFF]/10 text-[#7C4DFF] hover:bg-[#7C4DFF]/20",
        subtle: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      },
      size: {
        default: "h-11 px-8 py-2",
        xs: "h-8 px-4 text-[10px]",
        sm: "h-9 px-5 text-[10px]",
        lg: "h-13 px-10 text-sm",
        xl: "h-16 px-12 text-base",
        icon: "h-11 w-11",
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
