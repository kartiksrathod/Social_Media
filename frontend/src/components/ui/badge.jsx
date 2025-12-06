import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 badge-bounce-in badge-polished",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:scale-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 hover:scale-105",
        success:
          "border-transparent bg-green-600 text-white shadow hover:bg-green-700 hover:scale-105",
        warning:
          "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600 hover:scale-105",
        info:
          "border-transparent bg-blue-600 text-white shadow hover:bg-blue-700 hover:scale-105",
        outline: "text-foreground border-border hover:bg-surface-700 hover:scale-105",
        pulse: "border-transparent bg-primary text-primary-foreground shadow badge-pulse",
        "success-subtle": 
          "border-transparent bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:scale-105",
        "warning-subtle": 
          "border-transparent bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:scale-105",
        "error-subtle": 
          "border-transparent bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:scale-105",
        "info-subtle": 
          "border-transparent bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:scale-105",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  dot = false,
  ...props
}) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }), 
        dot && "badge-dot",
        dot && variant === "success" && "badge-dot-success",
        dot && variant === "warning" && "badge-dot-warning",
        dot && variant === "destructive" && "badge-dot-error",
        dot && variant === "info" && "badge-dot-info",
        className
      )} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants }
