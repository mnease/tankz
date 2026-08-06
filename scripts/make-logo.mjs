/**
 * Fun minimalist Tankz brand marks → public/brand/*
 * Usage: node scripts/make-logo.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = join(root, "public/brand");
mkdirSync(brand, { recursive: true });

// Tight crop so the tank fills the frame (matches wordmark height in UI)
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="22 40 96 72" width="128" height="96" role="img" aria-label="Tankz">
  <defs>
    <linearGradient id="hull" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3140"/>
      <stop offset="100%" stop-color="#12161f"/>
    </linearGradient>
    <linearGradient id="barrel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>
  </defs>
  <ellipse cx="64" cy="102" rx="36" ry="6" fill="#000" opacity="0.35"/>
  <rect x="28" y="78" width="72" height="14" rx="7" fill="#0c0e12" stroke="#2a2f3a" stroke-width="2"/>
  <circle cx="40" cy="85" r="3.5" fill="#5eead4" opacity="0.55"/>
  <circle cx="56" cy="85" r="3.5" fill="#5eead4" opacity="0.35"/>
  <circle cx="72" cy="85" r="3.5" fill="#5eead4" opacity="0.35"/>
  <circle cx="88" cy="85" r="3.5" fill="#5eead4" opacity="0.55"/>
  <rect x="34" y="52" width="60" height="32" rx="10" fill="url(#hull)" stroke="#5eead4" stroke-width="2.5" stroke-opacity="0.55"/>
  <rect x="42" y="60" width="44" height="5" rx="2.5" fill="#5eead4" opacity="0.35"/>
  <circle cx="64" cy="58" r="14" fill="#151922" stroke="#5eead4" stroke-width="2.5" stroke-opacity="0.7"/>
  <circle cx="64" cy="58" r="5" fill="#5eead4" opacity="0.85"/>
  <rect x="74" y="54" width="36" height="8" rx="4" fill="url(#barrel)" transform="rotate(-18 74 58)"/>
  <circle cx="108" cy="47" r="3" fill="#5eead4"/>
</svg>`;

const svgWordmark = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" width="640" height="160" role="img" aria-label="Tankz">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef0f4"/>
      <stop offset="100%" stop-color="#b8c0cc"/>
    </linearGradient>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>
    <linearGradient id="hull" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3140"/>
      <stop offset="100%" stop-color="#12161f"/>
    </linearGradient>
  </defs>
  <g transform="translate(8,16) scale(0.8)">
    <ellipse cx="64" cy="102" rx="36" ry="6" fill="#000" opacity="0.3"/>
    <rect x="28" y="78" width="72" height="14" rx="7" fill="#0c0e12" stroke="#2a2f3a" stroke-width="2"/>
    <rect x="34" y="52" width="60" height="32" rx="10" fill="url(#hull)" stroke="#5eead4" stroke-width="2.5" stroke-opacity="0.55"/>
    <rect x="42" y="60" width="44" height="5" rx="2.5" fill="#5eead4" opacity="0.35"/>
    <circle cx="64" cy="58" r="14" fill="#151922" stroke="#5eead4" stroke-width="2.5" stroke-opacity="0.7"/>
    <circle cx="64" cy="58" r="5" fill="#5eead4" opacity="0.85"/>
    <rect x="74" y="54" width="36" height="8" rx="4" fill="url(#a)" transform="rotate(-18 74 58)"/>
    <circle cx="108" cy="47" r="3" fill="#5eead4"/>
  </g>
  <text x="150" y="108" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="92" font-weight="700" letter-spacing="-0.04em" fill="url(#t)">Tankz</text>
  <rect x="154" y="122" width="48" height="6" rx="3" fill="url(#a)"/>
</svg>`;

const svgFull = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Tankz">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="#0a0b0d"/>
    </linearGradient>
    <linearGradient id="hull" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3140"/>
      <stop offset="100%" stop-color="#12161f"/>
    </linearGradient>
    <linearGradient id="barrel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g opacity="0.1" stroke="#5eead4" stroke-width="1">
    <path d="M0 128h512M0 256h512M0 384h512M128 0v512M256 0v512M384 0v512"/>
  </g>
  <g transform="translate(96,72) scale(2.5)">
    <ellipse cx="64" cy="102" rx="36" ry="6" fill="#000" opacity="0.4"/>
    <rect x="28" y="78" width="72" height="14" rx="7" fill="#0c0e12" stroke="#2a2f3a" stroke-width="2"/>
    <circle cx="40" cy="85" r="3.5" fill="#5eead4" opacity="0.55"/>
    <circle cx="56" cy="85" r="3.5" fill="#5eead4" opacity="0.35"/>
    <circle cx="72" cy="85" r="3.5" fill="#5eead4" opacity="0.35"/>
    <circle cx="88" cy="85" r="3.5" fill="#5eead4" opacity="0.55"/>
    <rect x="34" y="52" width="60" height="32" rx="10" fill="url(#hull)" stroke="#5eead4" stroke-width="2.5" stroke-opacity="0.55"/>
    <rect x="42" y="60" width="44" height="5" rx="2.5" fill="#5eead4" opacity="0.35"/>
    <circle cx="64" cy="58" r="14" fill="#151922" stroke="#5eead4" stroke-width="2.5" stroke-opacity="0.7"/>
    <circle cx="64" cy="58" r="5" fill="#5eead4" opacity="0.9"/>
    <rect x="74" y="54" width="38" height="8" rx="4" fill="url(#barrel)" transform="rotate(-18 74 58)"/>
    <circle cx="110" cy="46" r="3.5" fill="#5eead4"/>
  </g>
  <text x="256" y="430" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="72" font-weight="700" letter-spacing="-0.03em" fill="#eef0f4">Tankz</text>
  <rect x="220" y="448" width="72" height="8" rx="4" fill="#5eead4"/>
</svg>`;

writeFileSync(join(brand, "tankz-icon.svg"), svgIcon);
writeFileSync(join(brand, "tankz-wordmark.svg"), svgWordmark);
writeFileSync(join(brand, "tankz-logo.svg"), svgFull);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ deviceScaleFactor: 2 });

async function svgToPng(svgPath, outPath, w, h, { solid = false } = {}) {
  const svg = readFileSync(svgPath, "utf8").replace(
    '<?xml version="1.0" encoding="UTF-8"?>',
    "",
  );
  await page.setViewportSize({ width: w, height: h });
  const bg = solid ? "#0a0b0d" : "transparent";
  await page.setContent(
    `<!DOCTYPE html><html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${w}px;height:${h}px">${svg}</body></html>`,
    { waitUntil: "networkidle" },
  );
  if (solid) {
    await page.screenshot({
      path: outPath,
      clip: { x: 0, y: 0, width: w, height: h },
    });
  } else {
    await page.locator("svg").first().screenshot({
      path: outPath,
      omitBackground: true,
    });
  }
  console.log("wrote", outPath);
}

await svgToPng(join(brand, "tankz-icon.svg"), join(brand, "tankz-icon.png"), 256, 256);
await svgToPng(
  join(brand, "tankz-wordmark.svg"),
  join(brand, "tankz-wordmark.png"),
  640,
  160,
);
await svgToPng(join(brand, "tankz-logo.svg"), join(brand, "tankz-logo.png"), 512, 512, {
  solid: true,
});
await svgToPng(join(brand, "tankz-icon.svg"), join(root, "public/favicon.png"), 64, 64);

await browser.close();
console.log("logo set complete → public/brand/");
