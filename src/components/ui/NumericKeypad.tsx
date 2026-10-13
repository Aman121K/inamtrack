"use client";

import React from "react";

interface NumericKeypadProps {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  label?: string;
  masked?: boolean;
}

export function NumericKeypad({
  value,
  maxLength,
  onChange,
  onComplete,
  label,
  masked = false,
}: NumericKeypadProps) {
  const handlePress = (digit: string) => {
    if (value.length >= maxLength) return;
    const newValue = value + digit;
    onChange(newValue);
    if (newValue.length === maxLength && onComplete) {
      onComplete(newValue);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      {label && (
        <p className="text-center text-gray-500 mb-4 text-base font-medium">
          {label}
        </p>
      )}
      <div className="flex justify-center gap-3 mb-8">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
              i < value.length
                ? "bg-primary-gradient text-white shadow-glow scale-105"
                : "bg-gray-50 border-2 border-gray-100"
            }`}
          >
            {i < value.length ? (masked ? "●" : value[i]) : ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handlePress(String(digit))}
            className="h-16 rounded-2xl bg-white shadow-card text-2xl font-semibold text-gray-700 active:bg-primary-50 active:scale-95 active:shadow-none transition-all duration-150"
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handlePress("0")}
          className="h-16 rounded-2xl bg-white shadow-card text-2xl font-semibold text-gray-700 active:bg-primary-50 active:scale-95 active:shadow-none transition-all duration-150"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-16 rounded-2xl bg-gray-50 text-gray-400 active:bg-red-50 active:text-red-500 active:scale-95 transition-all duration-150 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
