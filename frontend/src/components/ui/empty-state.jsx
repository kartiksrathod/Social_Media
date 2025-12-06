import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

const EmptyState = React.forwardRef(({ 
  className,
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("empty-state-refined", className)}
      {...props}
    >
      {Icon && (
        <div className="empty-state-icon">
          <Icon className="w-full h-full" />
        </div>
      )}
      {title && (
        <h3 className="empty-state-title">
          {title}
        </h3>
      )}
      {description && (
        <p className="empty-state-description">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <div className="mt-6">
          <Button onClick={action} variant="outline">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
})
EmptyState.displayName = "EmptyState"

export { EmptyState }
