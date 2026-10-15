import React from "react";

export function Spinner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}

// Full-section loader for pages while their data is being fetched.
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm text-gray-400">{label}</p>}
    </div>
  );
}
