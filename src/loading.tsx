'use client';

import Loader from '@/src/components/ui/Loader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <Loader size="lg" color="purple" />
    </div>
  );
}
