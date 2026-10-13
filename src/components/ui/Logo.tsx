"use client";

export function Logo({ size = 80, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="logo-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="112" fill="url(#logo-bg)" />
        <circle cx="420" cy="100" r="80" fill="white" opacity="0.06" />
        <circle cx="90" cy="410" r="60" fill="white" opacity="0.06" />
        <path
          d="M196 160h120v120c0 44-27 80-60 80s-60-36-60-80V160z"
          fill="url(#logo-gold)"
        />
        <path
          d="M216 160h30v100c0 34-7 60-15 60s-15-26-15-60V160z"
          fill="url(#logo-shine)"
          opacity="0.5"
        />
        <path
          d="M196 180h-20c-28 0-50 22-50 50s22 50 50 50h20"
          fill="none"
          stroke="url(#logo-gold)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M316 180h20c28 0 50 22 50 50s-22 50-50 50h-20"
          fill="none"
          stroke="url(#logo-gold)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <rect x="216" y="350" width="80" height="16" rx="8" fill="url(#logo-gold)" />
        <rect x="200" y="362" width="112" height="20" rx="10" fill="url(#logo-gold)" />
        <polygon
          points="256,190 268,220 300,222 276,242 282,274 256,258 230,274 236,242 212,222 244,220"
          fill="white"
        />
        <circle cx="160" cy="140" r="6" fill="#fde68a" />
        <circle cx="352" cy="140" r="4" fill="#fde68a" />
        <circle cx="380" cy="340" r="5" fill="#fde68a" />
        <circle cx="130" cy="310" r="4" fill="#fde68a" />
        <polygon
          points="140,200 144,210 154,210 146,216 148,226 140,220 132,226 134,216 126,210 136,210"
          fill="white"
          opacity="0.4"
        />
        <polygon
          points="372,300 375,307 383,307 377,312 379,319 372,314 365,319 367,312 361,307 369,307"
          fill="white"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}

export function LogoWithText({
  size = 80,
  subtitle,
}: {
  size?: number;
  subtitle?: string;
}) {
  return (
    <div className="text-center animate-fade-up">
      <Logo size={size} className="mb-5 drop-shadow-xl" />
      <h1 className="text-3xl font-extrabold text-white tracking-tight">
        InamTrack
      </h1>
      {subtitle && (
        <p className="text-white/50 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}
