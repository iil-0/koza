import { memo, useId } from 'react';

/* ==========================================================================
   Illustrated lofi room: a window over a seaside town (Marmara vibes),
   plants, a laptop running koza, çay on a saucer, and a sleeping cat.
   Colours come from CSS custom properties set per mood in HeroScene.css,
   so the whole scene cross-fades between sabah / gün / akşam / gece.
   ViewBox: 1000 x 400.
   ========================================================================== */

/* deterministic pseudo random so the skyline is stable between renders */
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const R = seeded(7);
const round = (n) => Math.round(n * 10) / 10;

/* ---------- skyline ---------- */
const SHORE = 231;
const BUILDINGS = [];
const WINDOWS = [];
{
  let x = 44;
  while (x < 612) {
    const w = 9 + Math.round(R() * 15);
    const downtown = x > 96 && x < 330;
    const h = Math.round((downtown ? 22 : 8) + R() * (downtown ? 38 : 20));
    BUILDINGS.push({ x, w, h, peak: R() < 0.18 });
    const cols = Math.floor((w - 3) / 5);
    const rows = Math.min(6, Math.floor((h - 5) / 7));
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (R() < 0.55) {
          WINDOWS.push({ x: x + 3 + c * 5, y: SHORE - h + 5 + r * 7, lit: R() < 0.55, twinkle: R() < 0.06 });
        }
      }
    }
    x += w + (R() < 0.22 ? 3 + Math.round(R() * 16) : 0);
  }
}

const STARS = Array.from({ length: 46 }, () => ({
  x: round(46 + R() * 568),
  y: round(22 + R() * 150),
  r: round(0.5 + R() * 1.2),
  tw: R() < 0.4,
  d: round(R() * 4),
}));

const RAIN = Array.from({ length: 56 }, () => ({
  x: round(40 + R() * 600),
  y: round(-40 + R() * 300),
  l: round(8 + R() * 10),
  d: round(R() * 1.2),
  s: round(0.7 + R() * 0.5),
}));

const SNOW = Array.from({ length: 44 }, () => ({
  x: round(40 + R() * 580),
  y: round(-20 + R() * 280),
  r: round(1 + R() * 1.8),
  d: round(R() * 6),
  s: round(5 + R() * 5),
}));

/* ---------- plants ---------- */
const LEAF = 'M0 0C-5-3-7.5-9.5-4-14C-2-16.5 0-15.5 0-14C0-15.5 2-16.5 4-14C7.5-9.5 5-3 0 0Z';
const BIG_LEAF = 'M0 0C-15-6-23-22-15-38C-9-48 9-48 15-38C23-22 15-6 0 0Z';

function vine(p0, p1, p2, count, scale = 1) {
  const leaves = [];
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 0.4);
    const mt = 1 - t;
    const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
    const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
    const side = i % 2 ? 1 : -1;
    leaves.push({
      x: round(x),
      y: round(y),
      a: round(180 + side * (35 + R() * 30)),
      s: round(scale * (0.75 + R() * 0.45)),
      alt: R() < 0.45,
    });
  }
  return { d: `M${p0[0]} ${p0[1]}Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`, leaves };
}

const VINES = [
  vine([4, -6], [74, 128], [30, 252], 13, 1.15),
  vine([58, -6], [150, 76], [222, 60], 8, 0.95),
  vine([648, -6], [624, 92], [656, 158], 9, 1),
];

function bulbs(p0, p1, p2, count) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const mt = 1 - t;
    return {
      x: round(mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0]),
      y: round(mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1] + 5),
      c: ['#ffd27a', '#ffb3a7', '#ffe6b0', '#f7a8c1'][i % 4],
      d: round(R() * 3),
    };
  });
}

const LIGHTS = [...bulbs([30, 8], [330, 58], [630, 10], 13), ...bulbs([630, 10], [815, 62], [1000, 16], 8)];

/* sun / moon positions per mood (viewBox units) */
const SUN_POS = {
  sabah: [196, 168],
  gun: [584, 60],
  aksam: [468, 166],
  gece: [582, 134],
};

const SCREEN_ROWS = [
  { y: 240, w: 46, tag: '#f6cfd5', done: false },
  { y: 251, w: 36, tag: '#cfe1f3', done: true },
  { y: 262, w: 52, tag: '#f8d6bd', done: false },
  { y: 273, w: 30, tag: '#d8e8c8', done: false },
];

function HeroArt({ mood, weather, viewBox, city }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name) => `${uid}-${name}`;
  const [sx, sy] = SUN_POS[mood] || SUN_POS.gun;
  const showRain = weather === 'rain';
  const showSnow = weather === 'snow';
  const cloudy = weather === 'clouds' || weather === 'overcast' || showRain || showSnow;

  return (
    <svg
      className="hero-art"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-cloudy={cloudy || undefined}
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="18" x2="0" y2="233" gradientUnits="userSpaceOnUse">
          <stop offset="0" className="hero-s-sky1" />
          <stop offset="0.58" className="hero-s-sky2" />
          <stop offset="1" className="hero-s-sky3" />
        </linearGradient>
        <linearGradient id={id('sea')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hero-s-sea1" />
          <stop offset="1" className="hero-s-sea2" />
        </linearGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hero-s-wall1" />
          <stop offset="1" className="hero-s-wall2" />
        </linearGradient>
        <linearGradient id={id('tea')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d0613a" />
          <stop offset="1" stopColor="#7a2414" />
        </linearGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('screenglow')}>
          <stop offset="0" stopColor="#dfe9ff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#c8d6ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('sunglow')}>
          <stop offset="0" className="hero-s-sunglow" stopOpacity="0.85" />
          <stop offset="1" className="hero-s-sunglow" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('win')}>
          <rect x="42" y="18" width="576" height="278" />
        </clipPath>
        <clipPath id={id('glass')}>
          <path d="M276 256C276 268 281 274 281 281C281 289 277 296 278 306L302 306C303 296 299 289 299 281C299 274 304 268 304 256Z" />
        </clipPath>
        <mask id={id('moon')}>
          <circle r="21" fill="#fff" />
          <circle cx="9" cy="-6" r="18" fill="#000" />
        </mask>
      </defs>

      {/* ---------------- wall ---------------- */}
      <rect width="1000" height="400" fill={`url(#${id('wall')})`} />

      {/* ---------------- window: outside world ---------------- */}
      <rect className="hero-frame" x="30" y="6" width="600" height="300" rx="5" />
      <g clipPath={`url(#${id('win')})`}>
        <rect x="42" y="18" width="576" height="278" fill={`url(#${id('sky')})`} />

        <g className="hero-stars">
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              className={s.tw ? 'hero-twinkle' : undefined}
              style={s.tw ? { animationDelay: `${s.d}s` } : undefined}
            />
          ))}
        </g>

        {/* sun */}
        <g className="hero-sun" style={{ transform: `translate(${sx}px, ${sy}px)` }}>
          <circle r="78" fill={`url(#${id('sunglow')})`} />
          <circle r={mood === 'aksam' ? 36 : 27} className="hero-sun-disc" />
        </g>
        {/* moon */}
        <g className="hero-moon" style={{ transform: `translate(${SUN_POS.gece[0]}px, ${SUN_POS.gece[1]}px)` }}>
          <circle r="54" fill={`url(#${id('glow')})`} opacity="0.35" />
          <circle r="21" className="hero-moon-disc" mask={`url(#${id('moon')})`} />
        </g>

        {/* clouds */}
        <g className="hero-clouds">
          <g className="hero-cloud hero-cloud--a">
            <ellipse cx="128" cy="66" rx="34" ry="11" />
            <ellipse cx="112" cy="60" rx="18" ry="12" />
            <ellipse cx="140" cy="56" rx="20" ry="15" />
          </g>
          <g className="hero-cloud hero-cloud--b">
            <ellipse cx="392" cy="44" rx="40" ry="10" />
            <ellipse cx="376" cy="38" rx="20" ry="12" />
            <ellipse cx="404" cy="33" rx="22" ry="15" />
          </g>
          <g className="hero-cloud hero-cloud--c">
            <ellipse cx="560" cy="118" rx="30" ry="8" />
            <ellipse cx="572" cy="111" rx="17" ry="11" />
          </g>
          <g className="hero-cloud hero-cloud--d hero-cloud--extra">
            <ellipse cx="250" cy="96" rx="44" ry="11" />
            <ellipse cx="236" cy="88" rx="22" ry="13" />
            <ellipse cx="266" cy="84" rx="24" ry="16" />
          </g>
        </g>

        {/* hills */}
        <path
          className="hero-hill-far"
          d="M40 196C90 170 140 160 190 172C240 184 270 150 330 146C390 142 420 176 470 170C520 164 560 150 620 162V240H40Z"
        />
        <path
          className="hero-hill"
          d="M40 214C80 200 120 194 160 202C196 209 226 198 262 204C300 210 330 216 360 222L360 240H40ZM440 236C476 210 540 194 620 198V240H440Z"
        />

        {/* sea */}
        <rect x="40" y={SHORE - 2} width="580" height={300 - SHORE} fill={`url(#${id('sea')})`} />

        {/* town */}
        <g className="hero-city">
          {BUILDINGS.map((b, i) =>
            b.peak ? (
              <path key={i} d={`M${b.x} ${SHORE}V${SHORE - b.h + 6}L${b.x + b.w / 2} ${SHORE - b.h}L${b.x + b.w} ${SHORE - b.h + 6}V${SHORE}Z`} />
            ) : (
              <rect key={i} x={b.x} y={SHORE - b.h} width={b.w} height={b.h} />
            )
          )}
          {/* a little mosque: dome + two minarets */}
          <path d="M226 231V219a16 16 0 0 1 32 0V231Z" />
          <circle cx="242" cy="201" r="1.6" />
          <path d="M219 231V186l2-8 2 8V231Z" />
          <path d="M261 231V186l2-8 2 8V231Z" />
          <rect x="40" y={SHORE - 1} width="580" height="3" />
        </g>
        <g className="hero-windows">
          {WINDOWS.map((w, i) => (
            <rect
              key={i}
              x={w.x}
              y={w.y}
              width="2.2"
              height="3"
              className={`${w.lit ? 'is-lit' : ''}${w.twinkle ? ' hero-twinkle' : ''}`}
            />
          ))}
        </g>

        {/* sun / moon glint on the sea */}
        <g className="hero-glint" style={{ transform: `translateX(${mood === 'gece' ? SUN_POS.gece[0] : sx}px)` }}>
          {[238, 246, 254, 263, 272, 282, 292].map((y, i) => (
            <rect key={y} x={-(16 - i * 1.4)} y={y} width={32 - i * 2.8} height="1.6" rx="0.8" style={{ animationDelay: `${i * 0.35}s` }} />
          ))}
        </g>

        {/* ferry crossing the bay */}
        <g className="hero-ferry">
          <path d="M0 262h50l-6 8H7Z" className="hero-ferry-hull" />
          <rect x="10" y="255" width="28" height="7" rx="1.5" className="hero-ferry-cabin" />
          <rect x="18" y="250" width="12" height="5" rx="1" className="hero-ferry-cabin" />
          <g className="hero-windows">
            <rect x="13" y="257.5" width="2.4" height="2" className="is-lit" />
            <rect x="18" y="257.5" width="2.4" height="2" className="is-lit" />
            <rect x="23" y="257.5" width="2.4" height="2" className="is-lit" />
            <rect x="28" y="257.5" width="2.4" height="2" className="is-lit" />
            <rect x="33" y="257.5" width="2.4" height="2" className="is-lit" />
          </g>
          <path d="M-30 271h34" className="hero-wake" />
        </g>

        {/* near shore trees */}
        <path
          className="hero-near"
          d="M40 300V280c8-10 18-12 26-6 6-12 22-14 30-2 10-6 22-2 26 8 8-4 18 0 20 8 6 0 10 6 10 12Z"
        />
        <path className="hero-near" d="M560 300c4-12 16-18 28-12 8-8 24-6 30 6V300Z" />

        {/* weather */}
        {cloudy && <rect className="hero-overcast" x="40" y="16" width="580" height="290" />}
        {weather === 'fog' && <rect className="hero-fog" x="40" y="120" width="580" height="190" />}
        {showRain && (
          <g className="hero-rain">
            {RAIN.map((d, i) => (
              <line
                key={i}
                x1={d.x}
                y1={d.y}
                x2={d.x - 3}
                y2={d.y + d.l}
                style={{ animationDelay: `-${d.d}s`, animationDuration: `${d.s}s` }}
              />
            ))}
          </g>
        )}
        {showSnow && (
          <g className="hero-snow">
            {SNOW.map((f, i) => (
              <circle key={i} cx={f.x} cy={f.y} r={f.r} style={{ animationDelay: `-${f.d}s`, animationDuration: `${f.s}s` }} />
            ))}
          </g>
        )}

        {/* glass reflections */}
        <path className="hero-reflect" d="M90 18h46L60 296H42V190Z" />
        <path className="hero-reflect" d="M420 18h18L360 296h-18Z" />
      </g>

      {/* window frame */}
      <rect className="hero-frame" x="324" y="16" width="12" height="282" />
      <rect className="hero-frame" x="42" y="104" width="576" height="8" />
      <path className="hero-frame-shade" d="M42 18h576v4H46v274h-4Z M336 22h3v274h-3Z M42 112h576v2.5H42Z" />
      <rect className="hero-frame-2" x="20" y="294" width="620" height="12" rx="3" />

      {/* fairy lights */}
      <g className="hero-lights">
        <path d="M30 8Q330 58 630 10Q815 62 1000 16" className="hero-wire" />
        {LIGHTS.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y})`}>
            <circle r="9" className="hero-bulb-glow" fill={b.c} style={{ animationDelay: `${b.d}s` }} />
            <rect x="-1.4" y="-6" width="2.8" height="3" rx="0.6" fill="#6b5a52" />
            <ellipse rx="2.6" ry="3.4" fill={b.c} className="hero-bulb" style={{ animationDelay: `${b.d}s` }} />
          </g>
        ))}
      </g>

      {/* hanging pothos */}
      <g className="hero-pothos">
        {VINES.map((v, vi) => (
          <g key={vi} className={`hero-vine hero-vine--${vi}`}>
            <path d={v.d} className="hero-stem" />
            {v.leaves.map((l, i) => (
              <path
                key={i}
                d={LEAF}
                transform={`translate(${l.x} ${l.y}) rotate(${l.a}) scale(${l.s * 1.25})`}
                className={l.alt ? 'hero-leaf-2' : 'hero-leaf'}
              />
            ))}
          </g>
        ))}
      </g>

      {/* ---------------- right wall ---------------- */}
      {/* sticky note */}
      <g transform="translate(668 112) rotate(-4)" className="hero-note">
        <rect x="3" y="5" width="104" height="98" rx="2" fill="#3a2016" opacity="0.16" />
        <rect width="104" height="98" rx="2" fill="#fbe6a8" />
        <path d="M84 98 104 78V98Z" fill="#000" opacity="0.07" />
        <text x="14" y="38" className="hero-note-text">Disiplin</text>
        <text x="14" y="60" className="hero-note-text">özgürlük</text>
        <text x="14" y="82" className="hero-note-text">
          getirir. <tspan fill="#e07c74">♡</tspan>
        </text>
        <circle cx="52" cy="9" r="5.5" fill="#e07c74" />
        <circle cx="50.5" cy="7.5" r="1.6" fill="#fff" opacity="0.7" />
      </g>

      {/* little framed picture */}
      <g transform="translate(790 186) rotate(3)">
        <rect x="2" y="4" width="54" height="52" rx="3" fill="#3a2016" opacity="0.15" />
        <rect width="54" height="52" rx="3" className="hero-frame" />
        <rect x="6" y="6" width="42" height="40" fill="#f4b78a" />
        <circle cx="32" cy="24" r="6" fill="#ffe2a8" />
        <path d="M6 30c8-6 14-7 22-3s14 2 20-2v21H6Z" fill="#8c6c94" />
        <rect x="6" y="36" width="42" height="10" fill="#6f86b5" />
        <text x="27" y="44" textAnchor="middle" className="hero-pic-text">
          {(city || 'deniz').toLocaleLowerCase('tr')}
        </text>
      </g>

      {/* shelf with candle */}
      <g>
        <rect x="862" y="248" width="134" height="7" rx="2" className="hero-frame" />
        <path d="M876 255h8l-8 8Z M972 255h8l0 8Z" className="hero-frame-2" />
        <path d="M872 230h22l-3 18h-16Z" fill="#c9775a" />
        <path d={LEAF} transform="translate(883 230) scale(0.9)" className="hero-leaf" />
        <path d={LEAF} transform="translate(882 231) rotate(-40) scale(0.75)" className="hero-leaf-2" />
        <path d={LEAF} transform="translate(884 231) rotate(42) scale(0.75)" className="hero-leaf-2" />
        <rect x="912" y="228" width="20" height="20" rx="3" fill="#f5e6d0" />
        <rect x="912" y="234" width="20" height="6" fill="#e9a3a5" opacity="0.65" />
        <path d="M922 228v-4" stroke="#4a3a32" strokeWidth="1.2" />
        <path className="hero-flame" d="M922 212C926 217 927 221 922 225C917 221 918 217 922 212Z" />
        <rect x="950" y="222" width="10" height="26" rx="1.5" fill="#8db4d6" />
        <rect x="961" y="226" width="9" height="22" rx="1.5" fill="#e99aa6" />
        <rect x="972" y="216" width="10" height="32" rx="1.5" fill="#eeae7c" transform="rotate(8 977 248)" />
      </g>

      {/* ---------------- desk ---------------- */}
      <rect className="hero-desk-top" x="0" y="304" width="1000" height="14" />
      <rect className="hero-desk" x="0" y="318" width="1000" height="82" />
      <path className="hero-desk-line" d="M0 318H1000 M0 346c180 4 420-3 620 2s290 2 380-2 M0 372c260 4 520-4 1000 2" />

      {/* monstera */}
      <g>
        {[
          [-58, 1.05, 'hero-leaf'],
          [-28, 1.2, 'hero-leaf-2'],
          [4, 1.25, 'hero-leaf'],
          [34, 1.1, 'hero-leaf-2'],
          [62, 0.95, 'hero-leaf'],
        ].map(([a, s, c]) => (
          <g key={a} transform={`translate(116 266) rotate(${a}) scale(${s})`} className="hero-sway">
            <path d="M0 0V-14" className="hero-stem" />
            <path d={BIG_LEAF} transform="translate(0 -12)" className={c} />
            <path d="M0-16V-44 M-1-26l-10-6 M1-32l9-7" className="hero-leaf-vein" />
          </g>
        ))}
        <path d="M84 268h64l-8 43H92Z" fill="#c9775a" />
        <rect x="80" y="262" width="72" height="9" rx="3" fill="#d98a6a" />
        <path d="M92 290h48" stroke="#b5654a" strokeWidth="2" opacity="0.5" />
      </g>

      {/* çay: tulip glass on a saucer, with steam */}
      <g>
        <ellipse cx="290" cy="309" rx="28" ry="4.6" fill="#f3ece6" />
        <ellipse cx="290" cy="309" rx="20" ry="3" fill="none" stroke="#d8705f" strokeWidth="1.2" />
        <rect x="270" y="263" width="40" height="45" fill={`url(#${id('tea')})`} clipPath={`url(#${id('glass')})`} />
        <ellipse cx="290" cy="263.5" rx="13.4" ry="2" fill="#e08257" />
        <path
          d="M276 256C276 268 281 274 281 281C281 289 277 296 278 306L302 306C303 296 299 289 299 281C299 274 304 268 304 256Z"
          fill="#fff"
          fillOpacity="0.12"
          stroke="#fff"
          strokeOpacity="0.75"
          strokeWidth="1.3"
        />
        <path d="M280 262c0 8 4 13 4 19" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
        <g className="hero-steam">
          <path d="M284 248c-5-7 5-12 0-20s4-12 0-18" />
          <path d="M291 244c-5-7 5-12 0-20s4-12 0-18" />
          <path d="M298 248c-5-7 5-12 0-20s4-12 0-18" />
        </g>
      </g>

      {/* laptop running koza */}
      <g>
        <ellipse className="hero-screen-glow" cx="442" cy="256" rx="120" ry="78" fill={`url(#${id('screenglow')})`} />
        <rect x="372" y="214" width="140" height="84" rx="7" fill="#353032" />
        <rect x="378" y="220" width="128" height="72" rx="3" className="hero-screen" />
        <rect x="384" y="226" width="30" height="4" rx="2" fill="#2f2a29" opacity="0.7" />
        <circle cx="497" cy="228" r="3" fill="#e07c74" />
        <circle cx="489" cy="228" r="3" fill="#a3bf8f" />
        {SCREEN_ROWS.map((r) => (
          <g key={r.y}>
            <rect
              x="384"
              y={r.y - 3}
              width="5.5"
              height="5.5"
              rx="1.5"
              fill={r.done ? '#e07c74' : 'none'}
              stroke={r.done ? '#e07c74' : '#b9aca3'}
              strokeWidth="0.9"
            />
            <rect x="394" y={r.y - 1.6} width={r.w} height="3.2" rx="1.6" fill="#8c7e76" opacity={r.done ? 0.3 : 0.55} />
            <rect x={394 + r.w + 6} y={r.y - 2.4} width="14" height="4.8" rx="2.4" fill={r.tag} />
          </g>
        ))}
        <circle cx="486" cy="262" r="9" fill="none" stroke="#efe4da" strokeWidth="2.6" />
        <path d="M486 253a9 9 0 0 1 8.5 11.8" fill="none" stroke="#e07c74" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M358 298h168l14 13H344Z" fill="#d7cec9" />
        <rect x="344" y="311" width="196" height="2.6" rx="1.3" fill="#b2a7a2" />
        <rect x="428" y="298" width="28" height="2" rx="1" fill="#b8aea9" />
        <path d="M368 302h148 M364 306h156" stroke="#bfb5b0" strokeWidth="0.8" />
      </g>

      {/* book stack + tiny succulent */}
      <g>
        <rect x="548" y="296" width="86" height="15" rx="2" fill="#d98f7f" />
        <path d="M552 300h78" stroke="#fbe6d8" strokeWidth="1" opacity="0.7" />
        <rect x="554" y="284" width="74" height="12" rx="2" fill="#9fbf8f" />
        <path d="M558 290h66" stroke="#eef5e6" strokeWidth="1" opacity="0.6" />
        <rect x="551" y="274" width="70" height="10" rx="2" fill="#f0d9a0" />
        <path d="M578 262h22l-2 12h-18Z" fill="#efe7df" />
        <path d={LEAF} transform="translate(589 263) scale(0.85)" className="hero-leaf" />
        <path d={LEAF} transform="translate(588 264) rotate(-48) scale(0.7)" className="hero-leaf-2" />
        <path d={LEAF} transform="translate(590 264) rotate(48) scale(0.7)" className="hero-leaf-2" />
      </g>

      {/* sleeping tuxedo cat on a cushion */}
      <g className="hero-cat">
        <ellipse cx="742" cy="309" rx="86" ry="9" fill="#e7a99c" />
        <ellipse cx="742" cy="306" rx="80" ry="6" fill="#efbcae" />
        <g className="hero-cat-body">
          <ellipse cx="750" cy="286" rx="60" ry="24" fill="#2b2627" />
          <ellipse cx="772" cy="270" rx="15" ry="6.5" fill="#f6f0e8" />
          <path d="M702 300c20 11 68 13 98 2-10 10-60 14-94 7Z" fill="#f6f0e8" />
        </g>
        <path d="M804 294c30 4 28 20-12 20-28 0-54 0-74-2" fill="none" stroke="#2b2627" strokeWidth="11" strokeLinecap="round" />
        <path d="M730 313c-6-.3-10-.6-14-1" fill="none" stroke="#f6f0e8" strokeWidth="11" strokeLinecap="round" />
        <ellipse cx="714" cy="310" rx="10" ry="4.6" fill="#f6f0e8" />
        <g className="hero-cat-head">
          <path d="M676 283 669 262 689 274Z" fill="#2b2627" />
          <path d="M701 273 715 258 717 281Z" fill="#2b2627" />
          <path d="M677 278 674 267 684 273Z" fill="#e9a3a5" />
          <path d="M704 271 712 263 713 277Z" fill="#e9a3a5" />
          <ellipse cx="695" cy="290" rx="24" ry="19" fill="#2b2627" />
          <path
            d="M697 272C693 279 690 284 688 289C681 291 675 296 676 302C678 308 686 311 694 311C703 311 711 308 712 302C713 296 707 291 701 289C700 284 699 279 697 272Z"
            fill="#f6f0e8"
          />
          <path d="M679 291q4.5 3.5 9 0 M701 291q4.5 3.5 9 0" fill="none" stroke="#efe2d6" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M692 298h5l-2.5 3Z" fill="#e48a8f" />
          <ellipse cx="684" cy="303" rx="3" ry="1.7" fill="#f0a7a5" opacity="0.6" />
          <ellipse cx="705" cy="303" rx="3" ry="1.7" fill="#f0a7a5" opacity="0.6" />
        </g>
        <g className="hero-zzz">
          <text x="716" y="262" className="hero-z">z</text>
          <text x="726" y="250" className="hero-z">z</text>
          <text x="738" y="236" className="hero-z">Z</text>
        </g>
      </g>

      {/* ---------------- lighting ---------------- */}
      <path className="hero-shade" fillRule="evenodd" d="M0 0H1000V400H0ZM42 18H618V296H42Z" />
      <g className="hero-glows">
        <circle cx="922" cy="218" r="56" fill={`url(#${id('glow')})`} />
        <circle cx="922" cy="218" r="22" fill={`url(#${id('glow')})`} className="hero-flicker" />
      </g>
    </svg>
  );
}

export default memo(HeroArt);
