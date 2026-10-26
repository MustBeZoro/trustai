import type { LanguageCode } from '@/lib/types';

type RobotPose = 'wave' | 'raised' | 'guitar' | 'namaste' | 'bob';

function poseForLang(lang: LanguageCode): RobotPose {
  if (lang === 'en' || lang === 'fr') return 'wave';
  if (lang === 'zh' || lang === 'ja') return 'raised';
  if (lang === 'es' || lang === 'pt') return 'guitar';
  if (lang === 'hi' || lang === 'bn') return 'namaste';
  if (lang === 'ar' || lang === 'ur') return 'bob';
  return 'wave';
}

export function RobotSVG({
  className = '',
  waving = false,
  size = 120,
  lang = 'en',
}: {
  className?: string;
  waving?: boolean;
  size?: number;
  lang?: LanguageCode;
}) {
  const pose = poseForLang(lang);

  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size * 1.16}
      className={`${className} ${pose === 'raised' ? 'animate-float' : ''} ${pose === 'bob' ? 'animate-bob' : ''}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Antenna */}
      <line x1="60" y1="30" x2="60" y2="18" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="14" r="4" fill="var(--primary)" />
      {/* Pill head */}
      <rect x="35" y="30" width="50" height="46" rx="16" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
      {/* Dot eyes */}
      <circle cx="48" cy="52" r="4.5" fill="var(--primary)" />
      <circle cx="72" cy="52" r="4.5" fill="var(--primary)" />
      {/* Smile */}
      <path d="M52 64 Q60 71 68 64" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Square body */}
      <rect x="40" y="80" width="40" height="36" rx="9" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />

      {/* Left arm (static) */}
      <path d="M40 92 Q26 96 24 86" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Right arm + props vary by pose */}
      {pose === 'wave' && (
        <g className={waving ? 'animate-wave' : ''}>
          <path d="M80 92 Q96 88 102 76" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="103" cy="72" r="3.5" fill="var(--primary)" />
        </g>
      )}

      {pose === 'raised' && (
        <>
          <path d="M24 86 Q20 70 30 58" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="31" cy="54" r="3.5" fill="var(--primary)" />
          <path d="M80 92 Q96 76 90 56" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="89" cy="52" r="3.5" fill="var(--primary)" />
        </>
      )}

      {pose === 'guitar' && (
        <>
          {/* Triangular geometric guitar across torso */}
          <path d="M45 96 L60 86 L75 96 Z" stroke="var(--primary)" strokeWidth="2" fill="var(--primary-soft)" strokeLinejoin="round" />
          <circle cx="60" cy="93" r="3" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
          {/* Right arm over guitar neck */}
          <path d="M80 92 Q92 90 96 82" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="97" cy="80" r="3" fill="var(--primary)" />
        </>
      )}

      {pose === 'namaste' && (
        <>
          {/* Both arms folded to center */}
          <path d="M40 92 Q44 86 50 88" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M80 92 Q76 86 70 88" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M50 88 L60 92 L70 88" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 86 L60 90 L64 86" stroke="var(--primary)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {pose === 'bob' && (
        <>
          {/* Arms angled down to waist */}
          <path d="M40 92 Q34 98 36 108" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="110" r="3" fill="var(--primary)" />
          <path d="M80 92 Q86 98 84 108" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="84" cy="110" r="3" fill="var(--primary)" />
        </>
      )}

      {/* Chest indicator (shared base element) */}
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
