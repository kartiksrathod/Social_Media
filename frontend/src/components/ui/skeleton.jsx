import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md surface-600", className)}
      {...props} />
  );
}

export { Skeleton }
