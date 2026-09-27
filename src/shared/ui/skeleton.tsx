import React from 'react';
import Skeleton, { SkeletonProps } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { cn } from '@/shared/lib/utils';

export interface CustomSkeletonProps extends SkeletonProps {
  className?: string;
}

export const ContentSkeleton: React.FC<CustomSkeletonProps> = ({ className, ...props }) => {
  return (
    <div className={cn('skeleton-wrapper', className)} aria-hidden="true">
      <Skeleton
        baseColor="#E6EBF0"
        highlightColor="#F4F6F8"
        borderRadius="8px"
        {...props}
      />
    </div>
  );
};
