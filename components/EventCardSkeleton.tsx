import React from 'react';
import { Skeleton } from './ui/Skeleton';

export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4 mb-3" />
      
      {/* Description skeleton */}
      <Skeleton variant="text" className="w-full mb-2" />
      <Skeleton variant="text" className="w-2/3 mb-4" />
      
      {/* Meta info skeletons */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-5 h-5" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-5 h-5" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      {/* Tags skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
};

export const CalendarDaySkeleton: React.FC = () => {
  return (
    <div className="min-h-24 p-2 border border-gray-200 bg-white">
      <Skeleton className="h-6 w-8 mb-2" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
};

export const EventListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default EventCardSkeleton;
