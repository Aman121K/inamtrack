import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Noto Sans", "Noto Sans Devanagari", "sans-serif"],
      },
      fontSize: {
        btn: ["1.125rem", { lineHeight: "1.5" }],
        heading: ["1.5rem", { lineHeight: "1.3", fontWeight: "700" }],
      },
      spacing: {
        "btn-h": "3.25rem",
        "nav-h": "4.5rem",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
      },
      borderRadius: {
        btn: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1)",
        elevated: "0 8px 32px rgba(79, 70, 229, 0.12)",
        nav: "0 -2px 20px rgba(0,0,0,0.06)",
        glow: "0 4px 20px rgba(79, 70, 229, 0.25)",
        "glow-success": "0 4px 20px rgba(16, 185, 129, 0.25)",
        "glow-gold": "0 4px 20px rgba(245, 158, 11, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
