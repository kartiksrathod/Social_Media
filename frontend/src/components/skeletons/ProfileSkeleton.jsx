import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfileSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-4 mt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Loading */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="card-premium">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
