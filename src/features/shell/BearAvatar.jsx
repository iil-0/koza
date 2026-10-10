import { useId } from 'react';
import { bearById } from './bears';

/* Every bear is its own little character (64×64 viewBox, clipped to a circle).
   Shared bits — ears, head, eyes, nose — live in the helpers below. */

const EYE_L = 24.6;
const EYE_R = 39.4;

function Ears({ fur, inner, r = 7, cx = 15.5, cy = 20.5 }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={fur} />
      <circle cx={64 - cx} cy={cy} r={r} fill={fur} />
      <circle cx={cx + 0.6} cy={cy + 0.6} r={r * 0.52} fill={inner} />
      <circle cx={64 - cx - 0.6} cy={cy + 0.6} r={r * 0.52} fill={inner} />
    </>
  );
}

const Head = ({ fill }) => <ellipse cx="32" cy="37" rx="20.5" ry="19" fill={fill} />;
const Body = ({ fill }) => <ellipse cx="32" cy="70" rx="29" ry="18" fill={fill} />;
const Muzzle = ({ fill, rx = 9.6, ry = 7.6 }) => <ellipse cx="32" cy="45" rx={rx} ry={ry} fill={fill} />;

function DotEyes({ color = '#2a211d', r = 2.2, y = 35 }) {
  return (
    <>
      {[EYE_L, EYE_R].map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill={color} />
          <circle cx={x + 0.8} cy={y - 0.8} r={r * 0.36} fill="#fff" />
        </g>
      ))}
    </>
  );
}

function Nose({ fill = '#2a211d', w = 3.4, h = 2.4 }) {
  return (
    <>
      <ellipse cx="32" cy="41.6" rx={w} ry={h} fill={fill} />
      <ellipse cx="31" cy="40.9" rx={w * 0.32} ry={h * 0.28} fill="#fff" opacity="0.5" />
    </>
  );
}

function Mouth({ color = '#2a211d' }) {
  return (
    <path
      d="M32 44v2M28.8 46.2q1.6 1.9 3.2 0q1.6 1.9 3.2 0"
      fill="none"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Blush({ opacity = 0.7 }) {
  return (
    <>
      <ellipse cx="21.4" cy="42" rx="3" ry="1.7" fill="#f2a8a6" opacity={opacity} />
      <ellipse cx="42.6" cy="42" rx="3" ry="1.7" fill="#f2a8a6" opacity={opacity} />
    </>
  );
}

const Glow = () => <circle cx="50" cy="12" r="14" fill="#fff" opacity="0.35" />;

/* ------------------------------------------------------------------ */

/** Bruno — classic brown bear with a leaf on his head */
function Bruno() {
  const fur = '#9b6b43';
  return (
    <>
      <rect width="64" height="64" fill="#f4dcc4" />
      <Glow />
      <Body fill={fur} />
      <Ears fur={fur} inner="#d6a679" />
      <Head fill={fur} />
      <Muzzle fill="#e4c39b" />
      <path d="M32.6 18.6c.4-3.6 3-5.8 6.6-5.4-.4 3.4-2.8 5.6-6.6 5.4Z" fill="#8fb36f" />
      <path d="M32.6 18.6q2.2-2 4.6-3.6" stroke="#5f8645" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <DotEyes />
      <Blush />
      <Nose />
      <Mouth />
    </>
  );
}

/** Olaf — polar bear in a striped scarf, snow falling */
function Olaf() {
  const fur = '#f7f4ef';
  return (
    <>
      <rect width="64" height="64" fill="#cde2f3" />
      <g fill="#fff">
        <circle cx="9" cy="12" r="1.1" />
        <circle cx="55" cy="26" r="0.9" />
        <circle cx="46" cy="7" r="0.8" />
        <circle cx="7" cy="30" r="0.8" />
        <circle cx="20" cy="5" r="0.7" />
      </g>
      <Body fill={fur} />
      <Ears fur={fur} inner="#e9cfcf" r={5.6} cx={17} cy={22} />
      <Head fill={fur} />
      <ellipse cx="32" cy="37" rx="20.5" ry="19" fill="none" stroke="#dcd5cb" strokeWidth="0.8" />
      <Muzzle fill="#fffdf9" rx={10} ry={7.8} />
      <DotEyes color="#1f1b1c" r={2} />
      <Blush opacity={0.55} />
      <Nose fill="#1f1b1c" w={4.4} h={3} />
      <Mouth color="#3b3335" />
      {/* scarf */}
      <path d="M12 55.4q20 8.4 40 0l1.6 5.2q-21.6 9-43.2 0Z" fill="#df5b55" />
      <g stroke="#fff" strokeWidth="1.6" opacity="0.9">
        <path d="M19 57.6 18.2 63" />
        <path d="M27 59.2 26.6 64.4" />
        <path d="M37 59.2 37.4 64.4" />
        <path d="M45 57.6 45.8 63" />
      </g>
    </>
  );
}

/** Mei — panda with tilted eye patches and a bamboo leaf */
function Mei() {
  const white = '#fbfaf7';
  const black = '#2b2828';
  return (
    <>
      <rect width="64" height="64" fill="#d8eacd" />
      <Glow />
      {/* bamboo */}
      <path d="M53 64V30" stroke="#8cb46c" strokeWidth="3" />
      <path d="M51.6 40h2.8M51.6 52h2.8" stroke="#6e9752" strokeWidth="1" />
      <path d="M53 34c4-3 7.4-3 9-1.4-2.6 2.4-5.6 3-9 1.4Z" fill="#9fc57f" />
      <Body fill={black} />
      <path d="M22 56c2.6 4 6 6 10 6s7.4-2 10-6c-1.6 7-5 10-10 10s-8.4-3-10-10Z" fill={white} />
      <Ears fur={black} inner="#4a4444" />
      <Head fill={white} />
      {/* eye patches */}
      <ellipse cx={EYE_L} cy="35.6" rx="5" ry="6.4" fill={black} transform={`rotate(32 ${EYE_L} 35.6)`} />
      <ellipse cx={EYE_R} cy="35.6" rx="5" ry="6.4" fill={black} transform={`rotate(-32 ${EYE_R} 35.6)`} />
      <DotEyes color="#fff" r={1.9} />
      <circle cx={EYE_L} cy="35" r="1.1" fill={black} />
      <circle cx={EYE_R} cy="35" r="1.1" fill={black} />
      <Blush opacity={0.8} />
      <Nose fill={black} w={3} h={2.1} />
      <Mouth color={black} />
    </>
  );
}

/** Sol — sun bear: short ears, golden chest crescent, tongue out */
function Sol() {
  const fur = '#2f2a28';
  return (
    <>
      <rect width="64" height="64" fill="#fbe5ad" />
      <circle cx="50" cy="13" r="8" fill="#f8cf62" />
      <g stroke="#f8cf62" strokeWidth="1.6" strokeLinecap="round">
        <path d="M50 1.6v2.4M61.4 13H59M58 5l-1.7 1.7M42 5l1.7 1.7" />
      </g>
      <Body fill={fur} />
      <path d="M17.4 54.4q14.6 9.2 29.2 0-3.4 3.8-4 7.6Q32 56.4 21.4 62q-.6-4-4-7.6Z" fill="#f1c062" />
      <Ears fur={fur} inner="#5a4c45" r={5} cx={17.5} cy={23} />
      <Head fill={fur} />
      <Muzzle fill="#e3b06f" rx={11} ry={8.4} />
      <DotEyes color="#120f0e" r={2} />
      <circle cx={EYE_L} cy="35" r="3.3" fill="none" stroke="#4a403b" strokeWidth="0.8" />
      <circle cx={EYE_R} cy="35" r="3.3" fill="none" stroke="#4a403b" strokeWidth="0.8" />
      <Nose fill="#1d1816" />
      <path d="M30.6 47.6q1.4 4.6 2.8 0Z" fill="#ec8c96" />
      <Mouth color="#1d1816" />
    </>
  );
}

/** Theo — stitched teddy bear with button eyes, ear patch and bow tie */
function Theo() {
  const fur = '#d6a36a';
  return (
    <>
      <rect width="64" height="64" fill="#f7dde3" />
      <Glow />
      <Body fill={fur} />
      {/* bow tie */}
      <path d="M32 57.4 24.4 53.4v8Z" fill="#d9524e" />
      <path d="M32 57.4l7.6-4v8Z" fill="#d9524e" />
      <circle cx="32" cy="57.4" r="2" fill="#b83f3c" />
      <Ears fur={fur} inner="#b98149" />
      {/* patch on the right ear */}
      <rect x="44.6" y="15.2" width="7.4" height="7.4" rx="1.2" fill="#8fb4d9" transform="rotate(12 48.3 18.9)" />
      <path d="M45.4 16.2l5.8 1.2M45 19.4l5.8 1.2" stroke="#fff" strokeWidth="0.6" strokeDasharray="1 1" transform="rotate(12 48.3 18.9)" />
      <Head fill={fur} />
      {/* seam */}
      <path d="M32 18.2v8.6" stroke="#9c6b38" strokeWidth="0.9" strokeDasharray="1.4 1.2" />
      <Muzzle fill="#f1d3a9" />
      <ellipse cx="32" cy="45" rx="8.2" ry="6.2" fill="none" stroke="#c99560" strokeWidth="0.7" strokeDasharray="1.2 1" />
      {/* button eyes */}
      {[EYE_L, EYE_R].map((x) => (
        <g key={x}>
          <circle cx={x} cy="35" r="2.8" fill="#3a2a22" />
          <circle cx={x} cy="35" r="1.9" fill="none" stroke="#5b4436" strokeWidth="0.5" />
          <circle cx={x - 0.6} cy="34.4" r="0.35" fill="#d9c3ad" />
          <circle cx={x + 0.6} cy="34.4" r="0.35" fill="#d9c3ad" />
          <circle cx={x - 0.6} cy="35.6" r="0.35" fill="#d9c3ad" />
          <circle cx={x + 0.6} cy="35.6" r="0.35" fill="#d9c3ad" />
        </g>
      ))}
      <Blush opacity={0.75} />
      <Nose fill="#4a3226" w={3.2} h={2.3} />
      <Mouth color="#4a3226" />
    </>
  );
}

/** Felix — spectacled bear: cream "glasses" markings around the eyes */
function Felix() {
  const fur = '#2e2a2c';
  const cream = '#ecd9b8';
  return (
    <>
      <rect width="64" height="64" fill="#dde2f1" />
      <Glow />
      <Body fill={fur} />
      <path d="M24 57q8 4.6 16 0-3 6-8 6.6-5-.6-8-6.6Z" fill={cream} />
      <Ears fur={fur} inner="#4c4547" r={6.4} />
      <Head fill={fur} />
      {/* spectacle markings */}
      <circle cx={EYE_L} cy="35" r="4.6" fill="none" stroke={cream} strokeWidth="2.4" />
      <circle cx={EYE_R} cy="35" r="4.6" fill="none" stroke={cream} strokeWidth="2.4" />
      <path d="M29.2 35.4q2.8-1.6 5.6 0" fill="none" stroke={cream} strokeWidth="2" />
      <path d="M19.8 33.6 14.6 31M44.2 33.6 49.4 31" stroke={cream} strokeWidth="1.6" strokeLinecap="round" />
      <Muzzle fill={cream} />
      <DotEyes color="#141112" r={2} />
      <Nose fill="#141112" />
      <Mouth color="#3d3332" />
    </>
  );
}

/** Hugo — black bear with a tan muzzle and a knitted pom-pom beanie */
function Hugo() {
  const fur = '#383233';
  return (
    <>
      <rect width="64" height="64" fill="#e6e0f2" />
      <Glow />
      <Body fill={fur} />
      <Ears fur={fur} inner="#5a5052" cx={13.6} cy={26} r={6} />
      <Head fill={fur} />
      {/* beanie */}
      <path d="M11.6 29.4C11.6 17 20.6 10 32 10s20.4 7 20.4 19.4Z" fill="#e7b54a" />
      <g stroke="#cf9a2e" strokeWidth="1" strokeLinecap="round">
        <path d="M19 15.8v13.6M25.4 12v17.4M32 10.6v18.8M38.6 12v17.4M45 15.8v13.6" />
      </g>
      <rect x="10.4" y="26.4" width="43.2" height="5.4" rx="2.7" fill="#d9a43c" />
      <circle cx="32" cy="9" r="4.2" fill="#f6ead2" />
      <Muzzle fill="#c39a6d" />
      <DotEyes color="#120f0f" r={2} y={36} />
      <Blush opacity={0.5} />
      <Nose fill="#1a1516" />
      <Mouth color="#2a2122" />
    </>
  );
}

const DRAWINGS = { bruno: Bruno, olaf: Olaf, mei: Mei, sol: Sol, theo: Theo, felix: Felix, hugo: Hugo };

/** Illustrated bear avatar. `variant` = bear id from bears.js (user.avatar). */
function BearAvatar({ size = 44, variant }) {
  const clip = `bear-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const Drawing = DRAWINGS[bearById(variant).id];
  return (
    <svg className="bear-avatar" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Drawing />
      </g>
    </svg>
  );
}

export default BearAvatar;
