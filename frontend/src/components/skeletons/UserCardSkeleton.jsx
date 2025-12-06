import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
