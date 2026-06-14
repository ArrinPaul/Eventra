import * as React from "react"

import { cn } from "@/core/utils/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xs border border-notion-hairline bg-notion-surface px-3 py-1 text-body-sm ring-offset-background file:border-0 file:bg-transparent file:text-body-sm file:font-medium placeholder:text-notion-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-notion-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
