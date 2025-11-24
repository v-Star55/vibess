'use client';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div
        className="relative h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent align-[-0.125em]"
        role="status"
      >
        <span className="absolute m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 clip-[rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    </div>
  );
}
