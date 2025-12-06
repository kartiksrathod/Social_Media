import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation button-refined",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md-premium hover:bg-primary/90 glow-subtle hover:glow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm-premium hover:bg-destructive/90 hover:shadow-md-premium hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        outline:
          "border border-border shadow-sm-premium hover:bg-surface-700 hover:border-primary/50 hover:text-primary hover:shadow-md-premium hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm-premium hover:bg-secondary/80 hover:shadow-md-premium hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        ghost: "hover:bg-surface-700 hover:text-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        success:
          "bg-green-600 text-white shadow-sm-premium hover:bg-green-700 hover:shadow-md-premium hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 text-xs min-h-[36px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        xl: "h-14 rounded-md px-10 text-base min-h-[56px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
        "icon-sm": "h-8 w-8 min-h-[36px] min-w-[36px]",
        "icon-lg": "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  asChild = false, 
  loading = false,
  children,
  disabled,
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "button"
  
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        loading && "button-loading"
      )}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin" />
      )}
      {children}
    </Comp>
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
