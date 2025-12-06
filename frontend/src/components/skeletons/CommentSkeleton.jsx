import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
