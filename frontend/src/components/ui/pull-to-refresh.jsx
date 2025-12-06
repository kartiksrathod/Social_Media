import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Pull-to-refresh indicator component
 */
export function PullToRefreshIndicator({ isPulling, isRefreshing, pullDistance, refreshProgress }) {
  const isVisible = isPulling || isRefreshing;
  
  // Calculate opacity based on pull distance
  const opacity = Math.min(refreshProgress / 100, 1);
  const rotation = refreshProgress * 3.6; // 360 degrees at 100%

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex justify-center items-center transition-all duration-200',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        transform: `translateY(${Math.min(pullDistance, 60)}px)`,
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg">
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <RefreshCw 
            className={cn(
              'w-5 h-5 transition-all duration-200',
              refreshProgress >= 100 ? 'text-primary' : 'text-muted-foreground'
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              opacity,
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Wrapper component that provides pull-to-refresh functionality
 */
export function PullToRefreshWrapper({ children, onRefresh, enabled = true, className }) {
  const { containerRef, isPulling, pullDistance, isRefreshing, refreshProgress } = 
    require('@/hooks/usePullToRefresh').usePullToRefresh(onRefresh, { enabled });

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        refreshProgress={refreshProgress}
      />
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </>
  );
}
