import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = true,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-md surface-600",
        shimmer ? "skeleton-shimmer" : "skeleton-pulse",
        className
      )}
      {...props} />
  );
}

export { Skeleton }
