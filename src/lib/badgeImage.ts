import type { Badge, Category } from "../types";
import { CATEGORY_META } from "./categories";
import { BANDS, bandShortLabel, type BandIndex } from "./spectrum";
import { BRAND, SCORE, SPECTRUM } from "./config";

/** One bubble on the badge's spectrum axis. */
export interface BadgeBubble {
  category: Category;
  /** Where this category landed, on the stance scale. */
  score: number;
  /** 0..1 — the category's share of the composite. Drives bubble area. */
  share: number;
}

export interface BadgeImageInput {
  badge: Badge;
  /** Pre-templated caption, e.g. "66% decisive". */
  decisiveCaption: string;
  spectrumHeadline: string;
  tiltText: string;
  zip: string;
  cohort: string;
  bubbles: BadgeBubble[];
  /** Categories the respondent left entirely blank, for an honest footnote. */
  missingCategories: Category[];
}

const W = 1080;
const H = 1350;

// Plot geometry. The whole graphic is the one axis, so these are the only
// numbers that need tuning when the layout moves.
const PLOT_X0 = 96;
const PLOT_X1 = W - 96;
const PLOT_CY = 690;
const PLOT_TOP = 500;
const AXIS_Y = 900;
const R_MIN = 20;
const R_MAX = 56;

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function toX(score: number): number {
  const span = SCORE.max - SCORE.min;
  const t = span > 0 ? (score - SCORE.min) / span : 0.5;
  return PLOT_X0 + Math.max(0, Math.min(1, t)) * (PLOT_X1 - PLOT_X0);
}

export interface PlacedBubble extends BadgeBubble {
  x: number;
  y: number;
  r: number;
}

/**
 * Where every bubble goes, as pure geometry.
 *
 * Kept separate from the canvas calls so the parts that can actually be wrong —
 * radius scaling, overlap separation, staying inside the plot — are testable
 * without a renderer.
 *
 * Radius scales with the square root of share, because it is AREA that reads as
 * magnitude; scaling the radius itself would overstate large categories.
 *
 * Overlaps are separated VERTICALLY ONLY. x is the value encoding, so moving a
 * bubble sideways to de-collide would put a category somewhere it did not
 * score. Categories genuinely do land on top of each other — several can sit
 * within a point of neutral — so this is a packing problem, not a nudge: seven
 * maximum-size bubbles at one x would need ~800px in a ~400px plot, and two
 * circles drawn on top of each other read as one, which is the exact failure
 * the chart exists to avoid. So the radius cap gives way until the stack is
 * genuinely clean. Area ratios are preserved; only the overall scale changes.
 */
export function layoutBubbles(bubbles: BadgeBubble[]): PlacedBubble[] {
  if (bubbles.length === 0) return [];
  const maxShare = Math.max(
    ...bubbles.map((b) => (Number.isFinite(b.share) ? b.share : 0)),
    1e-6,
  );
  const xs = bubbles.map((b) =>
    Number.isFinite(b.score) ? toX(b.score) : toX(SCORE.neutral),
  );
  const GAP = 6;
  const EPS = 0.5;

  /**
   * Radius from share, so that AREA is proportional to share — area is what the
   * eye reads as magnitude, and scaling the radius itself would overstate large
   * categories.
   *
   * The floor is a rescue for categories too small to see, not a linear
   * compression: an additive offset would quietly shrink every ratio the chart
   * claims to show (a 4x share difference rendered as ~2x).
   */
  const radiusFor = (share: number, cap: number) => {
    const floor = Math.min(R_MIN, cap);
    // A non-finite share would make every radius NaN, and one NaN coordinate
    // stops canvas drawing the whole scene. Fall back to the floor so a bad
    // number costs one bubble its size instead of the entire badge.
    const safe = Number.isFinite(share) && share > 0 ? share : 0;
    return Math.max(floor, Math.min(cap, cap * Math.sqrt(safe / maxShare)));
  };

  /**
   * The band a bubble's centre may occupy, so no relaxation result ever has to
   * be clamped afterwards. Clamping after the fact is what silently broke the
   * layout: it shoved a bubble back inside the plot and straight through its
   * neighbour, re-introducing the very overlap the passes had just removed.
   */
  const boundsFor = (rs: number[]) =>
    rs.map((r) => [PLOT_TOP + r, AXIS_Y - 10 - r] as const);

  /**
   * Relax overlapping bubbles apart with damped iterations, constrained to the
   * plot band.
   *
   * Every overlapping pair is pushed along y by half its shortfall. Because x is
   * the value encoding, y is the only free axis — and unlike greedy candidate
   * placement, this cannot strand a bubble in a crowded spot, because every
   * overlap is addressed on every pass rather than by a one-shot search.
   *
   * Re-centring is a single translation applied AFTER the passes, never as a
   * per-pair force. A per-pair pull toward the centre fights the separation
   * force and settles into a limit cycle with bubbles still a few pixels
   * overlapped; translating the finished group cannot change any overlap.
   */
  const relax = (rs: number[]) => {
    const n = rs.length;
    const ys = new Array(n).fill(PLOT_CY);
    const pairs: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(xs[i] - xs[j]) < rs[i] + rs[j] + EPS) pairs.push([i, j]);
      }
    }
    if (pairs.length === 0) return ys;

    const bounds = boundsFor(rs);
    for (let iter = 0; iter < 600; iter++) {
      let worst = 0;
      for (const [i, j] of pairs) {
        const need = rs[i] + rs[j] + GAP;
        const diff = ys[i] - ys[j];
        const overlap = need - Math.abs(diff);
        if (overlap <= 0) continue;
        worst = Math.max(worst, overlap);
        // Half each way, with a small minimum so the last fraction of a pixel
        // still clears instead of asymptotically creeping.
        const step = Math.max(overlap / 2, 0.05);
        const dir = diff === 0 ? (i < j ? -1 : 1) : Math.sign(diff);
        ys[i] += dir * step;
        ys[j] -= dir * step;
      }
      // Constrain to the band. This can only reduce separation, so it is what
      // makes the shrink search necessary rather than optional.
      for (let i = 0; i < n; i++) {
        ys[i] = Math.max(bounds[i][0], Math.min(bounds[i][1], ys[i]));
      }
      if (worst <= EPS) break;
    }

    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const shift = PLOT_CY - (lo + hi) / 2;
    for (let i = 0; i < n; i++) {
      ys[i] = Math.max(bounds[i][0], Math.min(bounds[i][1], ys[i] + shift));
    }
    return ys;
  };

  const worstOverlap = (rs: number[], ys: number[]) => {
    let worst = 0;
    for (let i = 0; i < ys.length; i++) {
      for (let j = i + 1; j < ys.length; j++) {
        if (Math.abs(xs[j] - xs[i]) >= rs[i] + rs[j] + EPS) continue;
        worst = Math.max(worst, rs[i] + rs[j] + GAP - Math.abs(ys[i] - ys[j]));
      }
    }
    return worst;
  };
  const extent = (rs: number[], ys: number[]) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < ys.length; i++) {
      lo = Math.min(lo, ys[i] - rs[i]);
      hi = Math.max(hi, ys[i] + rs[i]);
    }
    return hi - lo;
  };

  // Shrink the radius cap until the stack both fits the plot AND is genuinely
  // non-overlapping. Height alone is not a sufficient test — a pack can be
  // short precisely because bubbles sit on top of each other — and seven
  // maximum-size bubbles at one x would need ~800px in a ~400px plot, so the
  // size encoding has to yield before the layout can. Area ratios are
  // preserved; only the overall scale changes.
  const avail = AXIS_Y - PLOT_TOP - 20;
  let best: { rs: number[]; ys: number[] } | null = null;
  for (let step = 0; step < 16; step++) {
    const cap = Math.max(8, R_MAX * Math.pow(0.9, step));
    const rs = bubbles.map((b) => radiusFor(b.share, cap));
    const ys = relax(rs);
    if (worstOverlap(rs, ys) <= EPS && extent(rs, ys) <= avail) {
      best = { rs, ys };
      break;
    }
  }
  // Nothing fit cleanly even at the minimum radius: keep the least-bad attempt
  // so the chart still renders every category. Unreachable for the seven
  // categories this app defines — about fourteen stacked bubbles is the limit
  // for a 380px plot — but it keeps a future category from drawing off-canvas.
  if (!best) {
    const rs = bubbles.map((b) => radiusFor(b.share, 8));
    best = { rs, ys: relax(rs) };
  }

  return bubbles.map((b, i) => ({
    ...b,
    x: xs[i],
    // `relax` already confines every centre to the plot band, so no clamp here:
    // clamping after the fact is what used to push bubbles back through their
    // neighbours.
    y: best.ys[i],
    r: best.rs[i],
  }));
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      if (lines === maxLines - 1) {
        ctx.fillText(`${line}…`, x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * The five zone boundaries in score space, derived from the same thresholds the
 * results page bands with. Kept as data so the badge's background shading and
 * the results page can never disagree about where "moderate" starts.
 */
function zones(): {
  band: BandIndex;
  from: number;
  to: number;
  color: string;
  label: string;
}[] {
  const n = SCORE.neutral;
  const b = SPECTRUM.neutralBand;
  const s = SPECTRUM.strongThreshold;
  const far = Math.max(n - s, SCORE.min);
  const near = Math.min(n - b, SCORE.min);
  return [
    { band: 0, from: SCORE.min, to: far, color: BANDS[0].color, label: SPECTRUM.lowLabel },
    { band: 1, from: far, to: near, color: BANDS[1].color, label: SPECTRUM.lowLeanLabel },
    { band: 2, from: near, to: Math.min(n + b, SCORE.max), color: BANDS[2].color, label: SPECTRUM.neutralLabel },
    { band: 3, from: Math.min(n + b, SCORE.max), to: Math.min(n + s, SCORE.max), color: BANDS[3].color, label: SPECTRUM.highLeanLabel },
    { band: 4, from: Math.min(n + s, SCORE.max), to: SCORE.max, color: BANDS[4].color, label: SPECTRUM.highLabel },
  ];
}

/**
 * Draw the shareable fingerprint badge.
 *
 * The graphic is one axis — the Individual/Collective spectrum every topic's
 * anchors already span — with one bubble per category. A bubble's position is
 * where that category landed, its colour is read straight off the same gradient
 * the axis is painted with, and its area is the category's share of the
 * composite.
 *
 * There is deliberately no headline number. A single figure on a shareable
 * image invites the one comparison that means least — "is yours higher than
 * mine?" — whereas the shape of the spread is something people actually
 * recognise as their own.
 *
 * Uses only system font stacks and canvas primitives, so there is no await on
 * fonts or images and the blob is ready synchronously.
 */
export async function renderBadgeImage(
  input: BadgeImageInput,
): Promise<Blob | null> {
  const { badge, decisiveCaption, spectrumHeadline, tiltText, zip, cohort, bubbles, missingCategories } =
    input;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const sans =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // One gradient across the full plot width, reused for every bubble, so each
  // circle picks up the colour of the spot on the axis it sits on.
  //
  // Stops come from the zone boundaries rather than even quarters: "moderate"
  // spans 45..55, not 37..62, so a bubble sitting at 46 must read as neutral
  // grey instead of the halfway point of a blue-to-amber blend.
  const zs = zones();
  const ramp = ctx.createLinearGradient(PLOT_X0, 0, PLOT_X1, 0);
  for (const z of zs) {
    const t0 = clamp01((z.from - SCORE.min) / (SCORE.max - SCORE.min));
    const t1 = clamp01((z.to - SCORE.min) / (SCORE.max - SCORE.min));
    // A zero-width stop makes canvas treat the pair as one abrupt edge.
    ramp.addColorStop(t0, z.color);
    ramp.addColorStop(t1 === t0 ? Math.min(1, t1 + 0.0001) : t1, z.color);
  }

  ctx.textAlign = "center";

  // Wordmark
  ctx.fillStyle = "#a5b4fc";
  ctx.font = `700 34px ${sans}`;
  ctx.fillText(BRAND.wordmark, W / 2, 104);

  // Spectrum headline
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 76px ${sans}`;
  ctx.fillText(spectrumHeadline, W / 2, 216);
  ctx.fillStyle = "#c7d2fe";
  ctx.font = `500 34px ${sans}`;
  ctx.fillText(tiltText, W / 2, 274);

  // Badge name + tagline
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 44px ${sans}`;
  ctx.fillText(badge.name, W / 2, 372);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `400 30px ${sans}`;
  wrap(ctx, badge.tagline, W / 2, 422, W - 240, 40, 2);

  // Zone shading behind the plot
  for (const z of zs) {
    const x0 = toX(z.from);
    const x1 = toX(z.to);
    ctx.fillStyle = `${z.color}1f`;
    ctx.fillRect(x0, PLOT_TOP, x1 - x0, AXIS_Y - PLOT_TOP);
  }

  const placed = layoutBubbles(bubbles);

  // Bubbles
  for (const p of placed) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = ramp;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0f172acc";
    ctx.stroke();
  }

  // Category names, only where they fit without colliding.
  ctx.font = `700 20px ${sans}`;
  for (const p of placed) {
    const label = CATEGORY_META[p.category].label;
    if (ctx.measureText(label).width + 10 > p.r * 2) continue;
    ctx.fillStyle = "#0f172ae6";
    ctx.fillText(label, p.x, p.y + 7);
  }

  // Axis
  ctx.strokeStyle = "#ffffff40";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PLOT_X0, AXIS_Y);
  ctx.lineTo(PLOT_X1, AXIS_Y);
  ctx.stroke();

  // Neutral tick
  const nx = toX(SCORE.neutral);
  ctx.strokeStyle = "#ffffff70";
  ctx.beginPath();
  ctx.moveTo(nx, PLOT_TOP);
  ctx.lineTo(nx, AXIS_Y);
  ctx.stroke();

  // Zone labels + end labels
  ctx.font = `600 19px ${sans}`;
  for (const z of zs) {
    const mid = toX((z.from + z.to) / 2);
    ctx.fillStyle = `${z.color}dd`;
    ctx.fillText(bandShortLabel(z.band), mid, AXIS_Y + 34);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffffcc";
  ctx.font = `700 24px ${sans}`;
  ctx.fillText(SPECTRUM.lowLabel, PLOT_X0, 540);
  ctx.textAlign = "right";
  ctx.fillText(SPECTRUM.highLabel, PLOT_X1, 540);
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = `500 20px ${sans}`;
  ctx.fillText("bubble size = share of your score", W / 2, 966);

  // Footer
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 28px ${sans}`;
  const context = [zip ? `ZIP ${zip}` : "", cohort].filter(Boolean).join("  ·  ");
  if (context) ctx.fillText(context, W / 2, 1050);

  ctx.font = `500 26px ${sans}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(decisiveCaption, W / 2, 1100);

  if (missingCategories.length > 0) {
    ctx.font = `400 21px ${sans}`;
    ctx.fillStyle = "#475569";
    wrap(
      ctx,
      `no answer in ${missingCategories.map((c) => CATEGORY_META[c].label).join(", ")}`,
      W / 2,
      1152,
      W - 160,
      28,
      2,
    );
  }

  if (BRAND.badgeCta) {
    ctx.fillStyle = "#818cf8";
    ctx.font = `700 28px ${sans}`;
    ctx.fillText(BRAND.badgeCta, W / 2, 1272);
  }

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/png"),
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick — revoking synchronously can cancel the download
  // in some browsers before it has read the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** True when this browser can share an actual image file, not just text. */
export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}
