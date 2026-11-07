/**
 * The haunted mansion scene behind Haunted view. Pure decoration: hidden from assistive
 * technology, ignores the pointer, and drawn entirely with CSS and inline SVG made for this project.
 */

interface MansionWindow {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Lit windows glow with candle light; the letter picks a flicker rhythm. */
  lit?: 'a' | 'b' | 'c' | 'd';
}

const WINDOWS: readonly MansionWindow[] = [
  { x: 488, y: 222, w: 22, h: 30, lit: 'a' },
  { x: 523, y: 222, w: 22, h: 30 },
  { x: 655, y: 222, w: 22, h: 30, lit: 'b' },
  { x: 690, y: 222, w: 22, h: 30 },
  { x: 488, y: 270, w: 22, h: 30 },
  { x: 523, y: 270, w: 22, h: 30, lit: 'c' },
  { x: 655, y: 270, w: 22, h: 30 },
  { x: 690, y: 270, w: 22, h: 30, lit: 'a' },
  { x: 589, y: 136, w: 22, h: 34, lit: 'd' },
  { x: 389, y: 210, w: 12, h: 18, lit: 'b' },
  { x: 378, y: 264, w: 20, h: 26, lit: 'c' },
  { x: 420, y: 264, w: 20, h: 26 },
  { x: 744, y: 254, w: 20, h: 28 },
  { x: 780, y: 254, w: 20, h: 28, lit: 'd' },
  { x: 816, y: 254, w: 20, h: 28 },
];

const panesOf = (windows: readonly MansionWindow[]) =>
  windows.map((w) => `M${w.x + w.w / 2} ${w.y}V${w.y + w.h}M${w.x} ${w.y + w.h / 2}H${w.x + w.w}`).join('');

const RHYTHMS = ['a', 'b', 'c', 'd'] as const;

/**
 * Bright candle light for one flicker rhythm. Each rhythm is its own SVG so the flicker animates
 * the opacity of a whole element, which the browser can run without repainting the mansion.
 */
function Lights({ rhythm }: { rhythm: (typeof RHYTHMS)[number] }) {
  const lit = WINDOWS.filter((w) => w.lit === rhythm);
  return (
    <svg className={`m-lights m-lights-${rhythm}`} viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax meet" focusable="false">
      {lit.map((w) => (
        <rect key={`${w.x}-${w.y}`} className="m-lit" x={w.x} y={w.y} width={w.w} height={w.h} rx="2" />
      ))}
      <path className="m-pane" d={panesOf(lit)} />
    </svg>
  );
}

const FENCE = Array.from({ length: 49 }, (_, i) => 12 + i * 24)
  .map((x) => `M${x} 384V352L${x + 3} 343L${x + 6} 352V384Z`)
  .join('');

function Bat() {
  return (
    <svg className="bat-wings" viewBox="0 0 32 14" width="34" height="15" focusable="false">
      <path d="M16 5C14 3 13 3 12.5 5C10 2 6 1 0 4C4 5 6 7 6.5 10C8 8 10 8 11.5 10C12.5 8.5 14 9 16 12C18 9 19.5 8.5 20.5 10C22 8 24 8 25.5 10C26 7 28 5 32 4C26 1 22 2 19.5 5C19 3 18 3 16 5Z" />
    </svg>
  );
}

export function HauntedBackdrop() {
  return (
    <div className="haunted-backdrop" aria-hidden="true" data-testid="haunted-backdrop">
      <div className="haunted-stars" />
      <div className="haunted-stars haunted-stars-twinkle" />
      <div className="haunted-moon" />
      <div className="haunted-bat bat-1">
        <Bat />
      </div>
      <div className="haunted-bat bat-2">
        <Bat />
      </div>
      <div className="haunted-bat bat-3">
        <Bat />
      </div>
      <svg className="haunted-mansion" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax meet" focusable="false">
        <path className="m-solid" d="M0 400V334C160 312 300 318 420 326C520 333 560 322 600 322C700 322 760 334 880 330C1000 326 1100 312 1200 318V400Z" />
        <path className="m-tree m-trunk" d="M170 334C172 300 166 268 172 240C176 218 168 200 160 184" />
        <path
          className="m-tree"
          d="M171 262C150 250 132 252 118 238C108 236 100 228 96 220M172 238C192 222 210 222 226 206C232 196 244 194 250 184M165 205C150 196 140 184 136 168M168 214C178 200 196 194 204 178M160 184C156 170 158 158 150 146"
        />
        <g className="m-solid">
          <rect x="470" y="200" width="260" height="126" />
          <polygon points="452,206 600,128 748,206" />
          <rect x="565" y="104" width="70" height="104" />
          <polygon points="553,110 600,26 647,110" />
          <rect x="598" y="8" width="4" height="22" />
          <rect x="360" y="242" width="116" height="84" />
          <polygon points="348,247 418,190 488,247" />
          <rect x="380" y="196" width="30" height="50" />
          <polygon points="373,200 395,150 417,200" />
          <rect x="725" y="232" width="126" height="94" />
          <polygon points="713,237 788,176 863,237" />
          <rect x="500" y="146" width="18" height="50" />
          <rect x="690" y="156" width="16" height="44" />
          <rect x="822" y="190" width="16" height="40" />
        </g>
        {WINDOWS.map((w) => (
          <rect
            key={`${w.x}-${w.y}`}
            className={w.lit ? 'm-window m-lit-base' : 'm-window'}
            x={w.x}
            y={w.y}
            width={w.w}
            height={w.h}
            rx="2"
          />
        ))}
        <path className="m-door" d="M585 326V292Q600 276 615 292V326Z" />
        <g className="m-solid">
          <path d="M940 362V332Q952 316 964 332V362Z" />
          <path d="M985 364V340Q995 328 1005 340V364Z" />
          <path d="M1062 364V336Q1076 320 1090 336V364Z" />
        </g>
        <path className="m-cross" d="M1036 366V326M1026 338H1046" />
        <path className="m-solid" d={FENCE} />
        <path className="m-rail" d="M0 358H1200M0 374H1200" />
      </svg>
      {RHYTHMS.map((rhythm) => (
        <Lights key={rhythm} rhythm={rhythm} />
      ))}
      <div className="haunted-fog fog-back" />
      <div className="haunted-fog fog-front" />
    </div>
  );
}