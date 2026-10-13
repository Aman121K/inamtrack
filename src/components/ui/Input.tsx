"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-14 px-4 text-lg rounded-btn bg-white shadow-card
            ${
              error
                ? "border-2 border-danger-500 ring-2 ring-danger-100"
                : "border border-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            }
            outline-none transition-all placeholder:text-gray-300 ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
