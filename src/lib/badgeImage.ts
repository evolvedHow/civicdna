import type { Badge, Category } from "../types";
import { CATEGORY_META } from "./categories";
import { BRAND } from "./config";

export interface BadgeImageInput {
  badge: Badge;
  score: number;
  /** 0..100 decisiveness. */
  decisive: number;
  /** Pre-templated caption under the ring, e.g. "66% decisive". */
  decisiveCaption: string;
  scoreLabel: string;
  zip: string;
  cohort: string;
  perCategory: Partial<Record<Category, number>>;
}

const W = 1080;
const H = 1350;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
 * Draw the shareable fingerprint badge. Uses only system font stacks and
 * canvas primitives so it renders identically without any asset loading —
 * no await on fonts or images, so the blob is ready synchronously.
 */
export async function renderBadgeImage(
  input: BadgeImageInput,
): Promise<Blob | null> {
  const {
    badge,
    score,
    decisive,
    decisiveCaption,
    scoreLabel,
    zip,
    cohort,
    perCategory,
  } = input;

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

  // Accent glow behind the medallion
  const glow = ctx.createRadialGradient(W / 2, 430, 40, W / 2, 430, 340);
  glow.addColorStop(0, `${badge.color}66`);
  glow.addColorStop(1, "#0f172a00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 120, W, 640);

  ctx.textAlign = "center";

  // Wordmark
  ctx.fillStyle = "#a5b4fc";
  ctx.font = `700 34px ${sans}`;
  ctx.fillText(BRAND.wordmark, W / 2, 110);

  // Medallion
  ctx.beginPath();
  ctx.arc(W / 2, 430, 190, 0, Math.PI * 2);
  ctx.fillStyle = badge.color;
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#ffffff22";
  ctx.stroke();

  // Ring — how far from neutral the answers sat (direction-agnostic)
  ctx.beginPath();
  ctx.arc(
    W / 2,
    430,
    218,
    -Math.PI / 2,
    -Math.PI / 2 + (Math.max(0, Math.min(100, decisive)) / 100) * Math.PI * 2,
  );
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#ffffffcc";
  ctx.stroke();

  // Score
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 170px ${sans}`;
  ctx.fillText(String(score), W / 2, 470);
  ctx.font = `600 34px ${sans}`;
  ctx.fillStyle = "#ffffffcc";
  ctx.fillText(scoreLabel.toUpperCase(), W / 2, 530);

  // Badge name + tagline
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 64px ${sans}`;
  ctx.fillText(badge.name, W / 2, 740);
  ctx.fillStyle = "#c7d2fe";
  ctx.font = `400 34px ${sans}`;
  wrap(ctx, badge.tagline, W / 2, 796, W - 200, 46, 2);

  // Category strip
  const cats = (Object.keys(perCategory) as Category[]).filter(
    (c) => perCategory[c] != null,
  );
  if (cats.length > 0) {
    const gap = 20;
    const cardW = Math.min(300, (W - 140 - gap * (cats.length - 1)) / cats.length);
    const totalW = cardW * cats.length + gap * (cats.length - 1);
    let x = (W - totalW) / 2;
    for (const c of cats) {
      roundRect(ctx, x, 900, cardW, 150, 28);
      ctx.fillStyle = "#ffffff12";
      ctx.fill();

      ctx.fillStyle = CATEGORY_META[c].accent;
      ctx.beginPath();
      ctx.arc(x + cardW / 2, 936, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 52px ${sans}`;
      ctx.fillText(String(perCategory[c]), x + cardW / 2, 1000);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `600 20px ${sans}`;
      wrap(ctx, CATEGORY_META[c].label, x + cardW / 2, 1030, cardW - 24, 24, 1);

      x += cardW + gap;
    }
  }

  // Footer: cohort context
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 30px ${sans}`;
  const context = [zip ? `ZIP ${zip}` : "", cohort].filter(Boolean).join("  ·  ");
  if (context) ctx.fillText(context, W / 2, 1160);
  ctx.font = `500 28px ${sans}`;
  ctx.fillStyle = "#64748b";
  ctx.fillText(decisiveCaption, W / 2, 1210);
  if (BRAND.badgeCta) {
    ctx.fillStyle = "#818cf8";
    ctx.font = `700 28px ${sans}`;
    ctx.fillText(BRAND.badgeCta, W / 2, 1275);
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
