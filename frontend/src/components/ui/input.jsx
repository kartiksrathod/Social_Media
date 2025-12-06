import * as React from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ 
  className, 
  type, 
  error,
  success,
  helperText,
  ...props 
}, ref) => {
  const inputState = error ? 'error' : success ? 'success' : 'default';
  
  return (
    <div className="w-full">
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-11 sm:h-10 w-full rounded-lg border-2 bg-surface-700 px-4 sm:px-3 py-2 sm:py-1 text-base shadow-sm-premium transition-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation sm:text-sm input-mobile input-refined",
            error && "input-error pr-10",
            success && "input-success pr-10",
            !error && !success && "border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary input-focus-glow",
            className
          )}
          style={{ fontSize: '16px' }}
          ref={ref}
          {...props}
        />
        {error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
        )}
        {success && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
        )}
      </div>
      {helperText && (
        <p className={cn(
          "mt-1.5 text-sm",
          error && "text-red-600 dark:text-red-400 error-state-refined",
          success && "text-green-600 dark:text-green-400 success-state-refined",
          !error && !success && "text-muted-foreground"
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
})
Input.displayName = "Input"

export { Input }
