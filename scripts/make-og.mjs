/**
 * Renders public/og.png at exactly 1200×630 for social share cards.
 * Usage: node scripts/make-og.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og.png");
const W = 1200;
const H = 630;

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
        radial-gradient(ellipse 50% 40% at 75% 55%, rgba(94,234,212,0.12), transparent 60%),
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
      padding: 56px 72px;
    }
    .eyebrow {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #5eead4;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 120px;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.92;
      color: #eef0f4;
      text-shadow: 0 0 60px rgba(94,234,212,0.25);
    }
    .tag {
      margin-top: 22px;
      max-width: 640px;
      font-size: 28px;
      font-weight: 500;
      line-height: 1.35;
      color: #8b919e;
    }
    .meta {
      position: absolute;
      left: 72px;
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
      right: 56px;
      top: 50%;
      transform: translateY(-50%);
      width: 340px;
      height: 340px;
    }
    .hull {
      position: absolute;
      left: 50%;
      top: 52%;
      width: 210px;
      height: 150px;
      margin-left: -105px;
      margin-top: -75px;
      border-radius: 28px;
      background: linear-gradient(160deg, #2a3140 0%, #151922 55%, #0e1118 100%);
      border: 2px solid rgba(94,234,212,0.35);
      box-shadow:
        0 20px 50px rgba(0,0,0,0.55),
        0 0 40px rgba(94,234,212,0.12);
    }
    .hull::after {
      content: "";
      position: absolute;
      left: 18px;
      right: 18px;
      top: 22px;
      height: 18px;
      border-radius: 8px;
      background: linear-gradient(90deg, transparent, rgba(94,234,212,0.35), transparent);
    }
    .turret {
      position: absolute;
      left: 50%;
      top: 38%;
      width: 92px;
      height: 92px;
      margin-left: -46px;
      margin-top: -46px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #3a4254, #12161f 70%);
      border: 2px solid rgba(94,234,212,0.45);
    }
    .barrel {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 150px;
      height: 18px;
      margin-top: -9px;
      margin-left: -8px;
      border-radius: 9px;
      background: linear-gradient(90deg, #5eead4, #2dd4bf 40%, #1a2a28);
      transform-origin: 8px 50%;
      transform: rotate(-28deg);
      box-shadow: 0 0 24px rgba(94,234,212,0.35);
    }
    .track {
      position: absolute;
      left: 50%;
      width: 248px;
      height: 28px;
      margin-left: -124px;
      border-radius: 14px;
      background: #0c0e12;
      border: 1px solid #2a2f3a;
    }
    .track-t { top: 18%; }
    .track-b { bottom: 12%; }
    .spark {
      position: absolute;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #5eead4;
      box-shadow: 0 0 20px #5eead4;
    }
    .spark-1 { right: 18%; top: 22%; }
    .spark-2 { right: 28%; bottom: 26%; width: 6px; height: 6px; opacity: 0.7; }
    .spark-3 { right: 12%; top: 48%; width: 7px; height: 7px; background: #e06c75; box-shadow: 0 0 16px #e06c75; }
  </style>
</head>
<body>
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>
  <div class="grid"></div>
  <div class="frame">
    <div class="content">
      <div class="eyebrow">Armor Division</div>
      <h1>Tankz</h1>
      <p class="tag">Modern top-down tank combat. Drive, aim, blast enemy armor.</p>
      <div class="meta">
        <span class="dot"></span>
        <span>Global hall of fame · Free to play</span>
      </div>
    </div>
    <div class="art" aria-hidden="true">
      <div class="track track-t"></div>
      <div class="track track-b"></div>
      <div class="hull"></div>
      <div class="barrel"></div>
      <div class="turret"></div>
      <span class="spark spark-1"></span>
      <span class="spark spark-2"></span>
      <span class="spark spark-3"></span>
    </div>
  </div>
</body>
</html>`;

async function main() {
  await mkdir(dirname(OUT), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: W, height: H },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
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
