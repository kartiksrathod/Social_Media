import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-border bg-surface-700 px-3 sm:px-4 py-3 sm:py-2 text-base sm:text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:glow-subtle input-elevated disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 touch-manipulation resize-y textarea-mobile shadow-sm-premium",
        className
      )}
      style={{ fontSize: '16px' }}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
