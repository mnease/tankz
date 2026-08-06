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
      right: 48px;
      top: 50%;
      transform: translateY(-50%);
      width: 420px;
      height: 240px;
      filter: drop-shadow(0 18px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 36px rgba(94,234,212,0.18));
    }
    .art svg {
      width: 100%;
      height: 100%;
      display: block;
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
      <h1>Tankz</h1>
      <p class="tag">Modern top-down tank combat. Drive, aim, blast enemy armor.</p>
      <div class="meta">
        <span class="dot"></span>
        <span>Global hall of fame · Free to play</span>
      </div>
    </div>
    <div class="art" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 96" role="img">
        <rect x="8" y="58" width="112" height="28" rx="12" fill="#0a0c10" stroke="#6b7280" stroke-width="2.5"/>
        <rect x="14" y="62" width="100" height="5" rx="1.5" fill="#1a1f28"/>
        <circle cx="30" cy="72" r="10" fill="#12161f" stroke="#5eead4" stroke-width="2"/>
        <circle cx="30" cy="72" r="3.5" fill="#5eead4" opacity="0.75"/>
        <circle cx="64" cy="72" r="10" fill="#12161f" stroke="#5eead4" stroke-width="2"/>
        <circle cx="64" cy="72" r="3.5" fill="#5eead4" opacity="0.55"/>
        <circle cx="98" cy="72" r="10" fill="#12161f" stroke="#5eead4" stroke-width="2"/>
        <circle cx="98" cy="72" r="3.5" fill="#5eead4" opacity="0.75"/>
        <path d="M18 60 L26 36 L100 34 L118 50 L118 60 Z" fill="#1c2230" stroke="#8b939e" stroke-width="2" stroke-linejoin="round"/>
        <rect x="34" y="42" width="58" height="5" rx="1.5" fill="#2a3140"/>
        <rect x="40" y="16" width="48" height="22" rx="3" fill="#222836" stroke="#8b939e" stroke-width="2"/>
        <rect x="50" y="9" width="16" height="9" rx="2" fill="#151922" stroke="#6b7280" stroke-width="1.5"/>
        <rect x="84" y="21" width="14" height="14" rx="2" fill="#2a3140" stroke="#8b939e" stroke-width="1.5"/>
        <rect x="94" y="25" width="58" height="7" rx="2" fill="#5eead4"/>
        <rect x="148" y="22" width="12" height="13" rx="2" fill="#2dd4bf"/>
        <rect x="151" y="24" width="2.2" height="9" rx="0.5" fill="#0a0c10" opacity="0.4"/>
        <rect x="155.5" y="24" width="2.2" height="9" rx="0.5" fill="#0a0c10" opacity="0.4"/>
        <line x1="46" y1="16" x2="46" y2="3" stroke="#5eead4" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="46" cy="2.5" r="2.4" fill="#5eead4"/>
      </svg>
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
