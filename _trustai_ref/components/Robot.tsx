'use client';

export function RobotSVG({
  className = '',
  waving = false,
  size = 120,
}: {
  className?: string;
  waving?: boolean;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size * 1.16}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <line x1="60" y1="30" x2="60" y2="18" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="14" r="4" fill="var(--primary)" />
      <rect x="35" y="30" width="50" height="46" rx="16" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
      <circle cx="48" cy="52" r="4.5" fill="var(--primary)" />
      <circle cx="72" cy="52" r="4.5" fill="var(--primary)" />
      <path d="M52 64 Q60 71 68 64" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="40" y="80" width="40" height="36" rx="9" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
      <path d="M40 92 Q26 96 24 86" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g className={waving ? 'animate-wave' : ''}>
        <path d="M80 92 Q96 88 102 76" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="103" cy="72" r="3.5" fill="var(--primary)" />
      </g>
      <rect x="48" y="90" width="24" height="14" rx="4" fill="var(--primary)" opacity="0.15" />
    </svg>
  );
}

export function BouncingDots() {
  return (
    <div className="dot-bounce" aria-label="loading">
      <span />
      <span />
      <span />
    </div>
  );
}