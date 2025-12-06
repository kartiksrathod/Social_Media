import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PostCardSkeleton() {
  return (
    <Card className="card-premium overflow-hidden bg-card">
      <CardHeader className="p-3 sm:p-4 pb-2 flex flex-row items-start gap-3 sm:gap-4 space-y-0">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 pt-2 space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        
        {/* Optional image skeleton - 40% chance */}
        {Math.random() > 0.6 && (
          <Skeleton className="w-full h-64 rounded-xl" />
        )}
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0 border-t border-border/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 sm:gap-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
