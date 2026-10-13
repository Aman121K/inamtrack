"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "flat";
}

export function Card({
  children,
  className = "",
  onClick,
  variant = "default",
}: CardProps) {
  const base =
    variant === "default"
      ? "bg-white rounded-2xl shadow-card p-4"
      : "bg-white/60 rounded-2xl p-4";

  return (
    <div
      className={`${base} ${
        onClick
          ? "cursor-pointer active:scale-[0.98] hover:shadow-card-hover transition-all duration-200"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
