import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular' 
}) => {
  const baseStyles = 'animate-pulse bg-gray-200';
  const variantStyles = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'h-4 rounded'
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
