/**
 * Renders public/og.png at exactly 1200×630 for social share cards.
 * Uses the canonical brand mark (public/brand/tankz-icon.png).
 * Usage: node scripts/make-og.mjs
 */
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og.png");
const ICON_PNG = join(ROOT, "public", "brand", "tankz-icon.png");
const W = 1200;
const H = 630;

async function main() {
  await mkdir(dirname(OUT), { recursive: true });

  const iconB64 = (await readFile(ICON_PNG)).toString("base64");
  const iconSrc = `data:image/png;base64,${iconB64}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: #0a0b0d;
      color: #eef0f4;
      position: relative;
    }
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(94,234,212,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(94,234,212,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 20%, transparent 75%);
    }
    .glow {
      position: absolute;
      width: 520px;
      height: 520px;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
    }
    .glow-a {
      left: -80px;
      top: -120px;
      background: #2dd4bf;
    }
    .glow-b {
      right: -60px;
      bottom: -140px;
      background: #e06c75;
      opacity: 0.22;
    }
    .frame {
      position: absolute;
      inset: 28px;
      border: 1px solid rgba(42, 47, 58, 0.95);
      border-radius: 24px;
      background: linear-gradient(145deg, rgba(18,20,26,0.92) 0%, rgba(10,11,13,0.88) 100%);
      box-shadow: 0 0 0 1px rgba(94,234,212,0.08) inset;
      overflow: hidden;
    }
    .frame::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 50% 40% at 78% 50%, rgba(94,234,212,0.14), transparent 60%),
        radial-gradient(ellipse 40% 50% at 20% 70%, rgba(224,108,117,0.08), transparent 55%);
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 56px 64px;
      max-width: 620px;
    }
    .eyebrow {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #5eead4;
      margin-bottom: 22px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 22px;
    }
    .title-mark {
      width: 148px;
      height: 84px;
      flex-shrink: 0;
      object-fit: contain;
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.45));
    }
    h1 {
      font-size: 112px;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.92;
      color: #eef0f4;
      text-shadow: 0 0 60px rgba(94,234,212,0.25);
    }
    .underline {
      margin-top: 14px;
      width: 72px;
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(90deg, #5eead4, #2dd4bf);
    }
    .tag {
      margin-top: 28px;
      max-width: 500px;
      font-size: 28px;
      font-weight: 500;
      line-height: 1.35;
      color: #8b919e;
    }
    .meta {
      position: absolute;
      left: 64px;
      bottom: 48px;
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 18px;
      color: #5c6370;
      letter-spacing: 0.04em;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #5eead4;
      box-shadow: 0 0 12px #5eead4;
    }
    .art {
      position: absolute;
      right: 36px;
      top: 50%;
      transform: translateY(-50%);
      width: 500px;
      height: 286px;
      object-fit: contain;
      filter:
        drop-shadow(0 22px 48px rgba(0,0,0,0.55))
        drop-shadow(0 0 40px rgba(94,234,212,0.22));
    }
  </style>
</head>
<body>
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>
  <div class="grid"></div>
  <div class="frame">
    <div class="content">
      <div class="eyebrow">Armor Division</div>
      <div class="title-row">
        <img class="title-mark" src="${iconSrc}" alt="" width="148" height="84" />
        <div>
          <h1>Tankz</h1>
          <div class="underline"></div>
        </div>
      </div>
      <p class="tag">Blast your way to victory. Drive, aim, and claim the hall of fame.</p>
      <div class="meta">
        <span class="dot"></span>
        <span>Global hall of fame · Free to play</span>
      </div>
    </div>
    <img class="art" src="${iconSrc}" alt="" width="500" height="286" />
  </div>
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: W, height: H },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    // Ensure data-URI images are painted before capture
    await page.waitForFunction(() =>
      [...document.images].every((img) => img.complete && img.naturalWidth > 0),
    );
    await page.screenshot({
      path: OUT,
      type: "png",
      clip: { x: 0, y: 0, width: W, height: H },
    });
    console.log(`wrote ${OUT} (${W}×${H})`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
