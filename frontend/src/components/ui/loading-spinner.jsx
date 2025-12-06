import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ 
  className, 
  size = 'default',
  variant = 'default',
  text,
  ...props 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantClasses = {
    default: 'text-primary',
    muted: 'text-muted-foreground',
    accent: 'text-accent',
  };

  if (text) {
    return (
      <div className="flex items-center gap-3 content-fade-in" {...props}>
        <Loader2 
          className={cn(
            'spin-smooth',
            sizeClasses[size],
            variantClasses[variant],
            className
          )} 
        />
        <span className="text-sm text-muted-foreground">{text}</span>
      </div>
    );
  }

  return (
    <Loader2 
      className={cn(
        'spin-smooth',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export function LoadingDots({ className, size = 'default' }) {
  const dotSizes = {
    sm: 'w-1 h-1',
    default: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn('loading-dots flex items-center gap-1.5', className)}>
      <span className={cn('rounded-full bg-primary', dotSizes[size])} />
      <span className={cn('rounded-full bg-primary', dotSizes[size])} />
      <span className={cn('rounded-full bg-primary', dotSizes[size])} />
    </div>
  );
}

export function LoadingPulse({ className, text }) {
  return (
    <div className={cn('flex items-center gap-3 loading-pulse', className)}>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function LoadingOverlay({ show, text = 'Loading...' }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm backdrop-enter">
      <div className="bg-card rounded-lg shadow-lg-premium p-6 space-y-4 scale-in">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="text-sm text-center text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
