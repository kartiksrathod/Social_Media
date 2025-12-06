import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ 
  className, 
  value, 
  animate = true,
  variant = "default",
  size = "default",
  showValue = false,
  ...props 
}, ref) => {
  const sizes = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
  };

  const variants = {
    default: "bg-primary",
    success: "bg-green-600",
    warning: "bg-yellow-500",
    error: "bg-red-600",
    info: "bg-blue-600",
  };

  return (
    <div className="w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full progress-refined",
          sizes[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full flex-1 transition-all duration-500 ease-out progress-bar-refined",
            variants[variant],
            animate && "progress-bar-fill"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {value}%
        </div>
      )}
    </div>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Indeterminate Progress
const ProgressIndeterminate = React.forwardRef(({ className, size = "default", ...props }, ref) => {
  const sizes = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-muted progress-indeterminate",
        sizes[size],
        className
      )}
      {...props}
    />
  );
})
ProgressIndeterminate.displayName = "ProgressIndeterminate"

export { Progress, ProgressIndeterminate }
