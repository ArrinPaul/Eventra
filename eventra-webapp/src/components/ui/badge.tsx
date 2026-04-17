import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/core/utils/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary dark:bg-primary/20",
        secondary:
          "border-transparent bg-muted text-foreground",
        destructive:
          "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/25",
        outline:
          "border-border text-foreground bg-transparent",
        success:
          "border-transparent bg-success/15 text-success dark:bg-success/25",
        warning:
          "border-transparent bg-warning/15 text-warning dark:bg-warning/25",
        info:
          "border-transparent bg-info/15 text-info dark:bg-info/25",
        solid:
          "border-transparent bg-primary text-primary-foreground",
        // Semantic aliases used across features (kept for compatibility)
        red:
          "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/25",
        blue:
          "border-transparent bg-info/15 text-info dark:bg-info/25",
        purple:
          "border-transparent bg-primary/15 text-primary dark:bg-primary/25",
        violet:
          "border-transparent bg-primary/15 text-primary dark:bg-primary/25",
        cyan:
          "border-transparent bg-info/15 text-info dark:bg-info/25",
        green:
          "border-transparent bg-success/15 text-success dark:bg-success/25",
        orange:
          "border-transparent bg-warning/15 text-warning dark:bg-warning/25",
        pink:
          "border-transparent bg-[hsl(340_82%_58%/0.15)] text-[hsl(340_82%_58%)] dark:text-[hsl(340_82%_70%)]",
        gradient:
          "border-transparent text-white gradient-brand shadow-soft",
      },
      size: {
        default: "text-xs py-0.5",
        sm: "text-[10px] py-0 px-2",
        lg: "text-sm py-1 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
