'use client';

import React from 'react';

interface LoaderProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'purple' | 'pink' | 'teal' | 'white' | 'currentColor';
}

export default function Loader({ className = '', size = 'md', color = 'purple' }: LoaderProps) {
  const sizeMap = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-4',
  };

  const colorMap = {
    purple: 'border-purple-400 border-t-purple-600/10',
    pink: 'border-pink-500 border-t-pink-500/10',
    teal: 'border-teal-400 border-t-teal-400/10',
    white: 'border-white border-t-white/10',
    currentColor: 'border-current border-t-transparent',
  };

  return (
    <div className={`relative flex items-center justify-center inline-block ${className}`}>
      {/* Outer spinning ring */}
      <div
        className={`animate-spin rounded-full border-solid ${sizeMap[size]} ${colorMap[color]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {/* Inner glowing core */}
      {(size === 'md' || size === 'lg' || size === 'xl') && (
        <div
          className={`absolute rounded-full animate-ping opacity-25 ${
            size === 'md' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'
          } ${
            color === 'purple'
              ? 'bg-purple-400'
              : color === 'pink'
              ? 'bg-pink-500'
              : color === 'teal'
              ? 'bg-teal-400'
              : 'bg-white'
          }`}
        />
      )}
    </div>
  );
}
