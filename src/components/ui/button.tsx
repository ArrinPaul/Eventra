import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-body-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-notion-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.95]",
  {
    variants: {
      variant: {
        default: "bg-notion-primary text-notion-on-primary rounded-full hover:bg-notion-primary-active",
        primary: "bg-notion-primary text-notion-on-primary rounded-full hover:bg-notion-primary-active shadow-notion-soft",
        secondary: "bg-notion-surface text-notion-ink border border-notion-hairline rounded-full hover:bg-notion-canvas-soft shadow-notion-soft",
        utility: "bg-notion-surface text-notion-ink border border-notion-hairline rounded-md hover:bg-notion-canvas-soft px-3.5 py-1",
        ghost: "text-notion-ink hover:bg-notion-canvas-soft rounded-md",
        link: "text-notion-primary underline-offset-4 hover:underline",
        outline: "bg-transparent border border-notion-hairline text-notion-ink rounded-full hover:bg-notion-canvas-soft",
        destructive: "bg-red-600 text-white rounded-md hover:bg-red-700",
        soft: "bg-notion-canvas-soft text-notion-ink hover:bg-notion-hairline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-body-sm",
        lg: "h-12 px-8 text-title",
        icon: "h-10 w-10 rounded-full bg-black/5 hover:bg-black/10",
        pill: "h-8 px-3 text-eyebrow rounded-full",
        xl: "h-14 px-10 text-lg",
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
