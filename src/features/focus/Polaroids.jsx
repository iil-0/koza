/* Tiny hand-made "photos" (pure SVG art) for the focus card. Decorative only. */

function NightRoom() {
  return (
    <svg viewBox="0 0 60 56" aria-hidden="true" focusable="false">
      <rect width="60" height="56" fill="#3b3550" />
      {/* window */}
      <rect x="8" y="6" width="30" height="28" rx="2" fill="#26304f" />
      <circle cx="30" cy="14" r="4.5" fill="#f6e3b0" />
      <circle cx="32" cy="12.6" r="4" fill="#26304f" />
      <circle cx="14" cy="12" r="0.8" fill="#f6e3b0" />
      <circle cx="20" cy="22" r="0.6" fill="#f6e3b0" />
      <circle cx="12" cy="27" r="0.7" fill="#f6e3b0" />
      <path d="M8 20h30M23 6v28" stroke="#4d4668" strokeWidth="1.4" />
      {/* lamp glow */}
      <circle cx="48" cy="30" r="12" fill="#f4b46c" opacity="0.25" />
      <path d="M44 24h8l-2 -6h-4z" fill="#f2c48a" />
      <rect x="47.4" y="24" width="1.2" height="10" fill="#6b5a4e" />
      {/* desk */}
      <rect x="0" y="40" width="60" height="16" fill="#6e4f3f" />
      <rect x="0" y="38" width="60" height="3" fill="#8a6450" />
      {/* plant */}
      <rect x="10" y="32" width="6" height="7" rx="1.2" fill="#d98b6a" />
      <path d="M13 32c-4-3-4-7-2-9 1 3 2 5 2 9zm0 0c3-4 6-5 8-4-2 2-4 3-8 4z" fill="#86a86b" />
      {/* mug */}
      <rect x="30" y="32" width="6" height="6" rx="1" fill="#f0e6da" />
      <path d="M31 30c0-2 2-2 1-4M34 30c0-2 2-2 1-4" stroke="#f0e6da" strokeWidth="0.7" fill="none" opacity="0.7" />
    </svg>
  );
}

function Cafe() {
  return (
    <svg viewBox="0 0 60 56" aria-hidden="true" focusable="false">
      <rect width="60" height="56" fill="#c98e63" />
      <rect x="0" y="0" width="60" height="30" fill="#e8b98a" />
      {/* window with warm street */}
      <rect x="6" y="5" width="22" height="20" rx="10" fill="#f7d9a8" />
      <rect x="6" y="15" width="22" height="10" fill="#e9a27a" />
      <path d="M17 5v20M6 15h22" stroke="#a46b4a" strokeWidth="1.2" />
      {/* hanging lamps */}
      <path d="M40 0v8M52 0v12" stroke="#5a3d30" strokeWidth="0.8" />
      <path d="M36.5 12a3.5 3.5 0 0 1 7 0z" fill="#3e2c24" />
      <path d="M48.5 16a3.5 3.5 0 0 1 7 0z" fill="#3e2c24" />
      <circle cx="40" cy="13" r="3.5" fill="#ffe2a8" opacity="0.55" />
      <circle cx="52" cy="17" r="3.5" fill="#ffe2a8" opacity="0.55" />
      {/* counter */}
      <rect x="0" y="36" width="60" height="20" fill="#7b5140" />
      <rect x="0" y="34" width="60" height="3" fill="#9a6a52" />
      {/* latte */}
      <path d="M20 36h12l-1.5 8h-9z" fill="#f4ede4" />
      <ellipse cx="26" cy="36" rx="6" ry="1.6" fill="#d7a77a" />
      <path d="M24 33c0-2 2-2 1-4M28 33c0-2 2-2 1-4" stroke="#fff6ea" strokeWidth="0.8" fill="none" opacity="0.8" />
      {/* croissant */}
      <path d="M40 40c2-5 10-5 12 0-3-1.5-9-1.5-12 0z" fill="#e9a457" />
    </svg>
  );
}

function Sunset() {
  return (
    <svg viewBox="0 0 60 56" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="fw-pol-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c6fa8" />
          <stop offset="0.55" stopColor="#ee9a7c" />
          <stop offset="1" stopColor="#f7cf8e" />
        </linearGradient>
      </defs>
      <rect width="60" height="56" fill="url(#fw-pol-sky)" />
      <circle cx="38" cy="32" r="7" fill="#fbe2a6" />
      <path d="M0 36c10-6 18-6 26-2s16 2 34-4v26H0z" fill="#8e6a8a" />
      {/* city */}
      <path
        d="M4 44v-8h4v-4h3v12h3v-9h4v9h3v-6h3v6h4v-11h3v11h4v-7h3v7h4v-5h3v5h6v12H4z"
        fill="#4e3c55"
      />
      <path d="M0 48h60v8H0z" fill="#3a2d41" />
      <path d="M8 40h1M15 38h1M28 41h1M34 36h1M46 42h1" stroke="#f6d38c" strokeWidth="1" />
    </svg>
  );
}

const PHOTOS = [
  { Art: NightRoom, caption: 'gece ♡' },
  { Art: Cafe, caption: 'kafe' },
  { Art: Sunset, caption: 'deniz' },
];

function Polaroids({ className = '' }) {
  return (
    <div className={`fw-polaroids ${className}`} aria-hidden="true">
      {PHOTOS.map(({ Art, caption }, i) => (
        <figure key={caption} className={`fw-polaroid fw-polaroid--${i + 1}`}>
          <Art />
          <figcaption className="hand">{caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default Polaroids;
