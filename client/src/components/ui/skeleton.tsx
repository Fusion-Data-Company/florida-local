import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50 animate-luxury-pulse",
        "before:absolute before:inset-0 before:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
