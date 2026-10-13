"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "lg" | "md" | "sm";
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "lg",
  fullWidth = true,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "font-semibold rounded-btn transition-all active:scale-[0.97] flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-primary-gradient text-white shadow-glow hover:shadow-elevated active:shadow-none",
    secondary:
      "bg-white text-primary-700 border-2 border-primary-100 hover:bg-primary-50 shadow-card",
    danger:
      "bg-danger-gradient text-white shadow-sm hover:shadow-md",
    ghost: "text-primary-600 hover:bg-primary-50",
  };

  const sizes = {
    lg: "h-btn-h text-btn px-6",
    md: "h-12 text-base px-4",
    sm: "h-10 text-sm px-3",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${disabled || loading ? "opacity-50 pointer-events-none" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  );
}
