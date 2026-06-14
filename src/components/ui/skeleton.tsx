import { cn } from "@/core/utils/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-[linear-gradient(110deg,var(--tw-gradient-stops))] from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] rounded-md",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
