import type { ReactElement } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const box = "h-7 w-7";

export const GLYPHS: Record<string, ReactElement> = {
  beacon: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20" />
    <path d="M12 13v-5" />
    <circle cx="12" cy="13" r="1.2" fill="currentColor" />
  </svg>,
  compass: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.2 8.8 13.4 13.4l-4.6 1.8 1.8-4.6z" fill="currentColor" strokeWidth="1.2" />
  </svg>,
  lattice: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <path d="M4 12h16M12 4v16" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>,
  weave: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <path d="M3 8h18M3 16h18" />
    <path d="M8 3v18M16 3v18" />
  </svg>,
  orbit: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <circle cx="12" cy="12" r="8" />
    <ellipse cx="12" cy="12" rx="4.6" ry="9.5" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>,
  scale: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <path d="M12 3v18M8 21h8" />
    <path d="M4 7h16M4 7l-2 5a3 3 0 0 0 6 0zM20 7l-2 5a3 3 0 0 0 6 0z" />
    <circle cx="12" cy="18" r="0.4" fill="currentColor" />
  </svg>,
  fingerprint: <svg viewBox="0 0 24 24" {...stroke} className={box} aria-hidden>
    <path d="M12 10a4 4 0 0 1 4 4c0 2.5-2 4.5-3.4 5.6" />
    <path d="M8 13a4 4 0 0 1 8-3" />
    <path d="M5 15a7 7 0 0 1 14-1" />
    <path d="M3 17a9 9 0 0 1 18-2" />
    <circle cx="12" cy="8" r="1.3" fill="currentColor" />
  </svg>,
};

export function FingerprintGem() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path
        d="M12 2.5 4 6.5v5c0 5.1 3.4 8.4 8 10 4.6-1.6 8-4.9 8-10v-5z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M12 5.2A6.8 6.8 0 0 0 5.2 12 .9.9 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5a.9.9 0 0 1 0 1.7Zm0 3A3.8 3.8 0 0 0 8.2 12a.9.9 0 0 1-1.8 0A5.6 5.6 0 0 1 12 6.4a.9.9 0 0 1 0 1.8Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}