/**
 * Fun minimalist Tankz brand marks → public/brand/*
 * Side-profile tank: long gun, box turret, thick tracks, 3 road wheels.
 * Usage: node scripts/make-logo.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = join(root, "public/brand");
mkdirSync(brand, { recursive: true });

/**
 * Shared tank silhouette (right-facing side profile).
 * viewBox 0 0 168 96 — landscape so barrel reads next to wordmark.
 * Teal = gun only; body uses mid-gray edges for contrast on near-black UI.
 */
const tankMark = `
  <!-- track belt -->
  <rect x="8" y="58" width="112" height="28" rx="12" fill="#0a0c10" stroke="#6b7280" stroke-width="2.5"/>
  <rect x="14" y="62" width="100" height="5" rx="1.5" fill="#1a1f28"/>
  <!-- road wheels (3 large) -->
  <circle cx="30" cy="72" r="10" fill="#12161f" stroke="#5eead4" stroke-width="2"/>
  <circle cx="30" cy="72" r="3.5" fill="#5eead4" opacity="0.75"/>
  <circle cx="64" cy="72" r="10" fill="#12161f" stroke="#5eead4" stroke-width="2"/>
  <circle cx="64" cy="72" r="3.5" fill="#5eead4" opacity="0.55"/>
  <circle cx="98" cy="72" r="10" fill="#12161f" stroke="#5eead4" stroke-width="2"/>
  <circle cx="98" cy="72" r="3.5" fill="#5eead4" opacity="0.75"/>
  <!-- hull (low trapezoid armor) -->
  <path d="M18 60 L26 36 L100 34 L118 50 L118 60 Z" fill="#1c2230" stroke="#8b939e" stroke-width="2" stroke-linejoin="round"/>
  <rect x="34" y="42" width="58" height="5" rx="1.5" fill="#2a3140"/>
  <!-- box turret + cupola -->
  <rect x="40" y="16" width="48" height="22" rx="3" fill="#222836" stroke="#8b939e" stroke-width="2"/>
  <rect x="50" y="9" width="16" height="9" rx="2" fill="#151922" stroke="#6b7280" stroke-width="1.5"/>
  <!-- mantlet / gun collar -->
  <rect x="84" y="21" width="14" height="14" rx="2" fill="#2a3140" stroke="#8b939e" stroke-width="1.5"/>
  <!-- long barrel (brand teal spear) -->
  <rect x="94" y="25" width="58" height="7" rx="2" fill="#5eead4"/>
  <!-- muzzle brake -->
  <rect x="148" y="22" width="12" height="13" rx="2" fill="#2dd4bf"/>
  <rect x="151" y="24" width="2.2" height="9" rx="0.5" fill="#0a0c10" opacity="0.4"/>
  <rect x="155.5" y="24" width="2.2" height="9" rx="0.5" fill="#0a0c10" opacity="0.4"/>
  <!-- rear antenna -->
  <line x1="46" y1="16" x2="46" y2="3" stroke="#5eead4" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="46" cy="2.5" r="2.4" fill="#5eead4"/>
`.trim();

const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 96" width="168" height="96" role="img" aria-label="Tankz">
  ${tankMark}
</svg>`;

const svgWordmark = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 120" width="560" height="120" role="img" aria-label="Tankz">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef0f4"/>
      <stop offset="100%" stop-color="#b8c0cc"/>
    </linearGradient>
    <linearGradient id="a" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>
  </defs>
  <g transform="translate(0,8) scale(1.05)">${tankMark}</g>
  <text x="190" y="78" font-family="Segoe UI, system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" letter-spacing="-0.04em" fill="url(#t)">Tankz</text>
  <rect x="194" y="90" width="44" height="6" rx="3" fill="url(#a)"/>
</svg>`;

const svgFull = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Tankz">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="#0a0b0d"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g opacity="0.1" stroke="#5eead4" stroke-width="1">
    <path d="M0 128h512M0 256h512M0 384h512M128 0v512M256 0v512M384 0v512"/>
  </g>
  <g transform="translate(44,78) scale(2.5)">
    ${tankMark}
  </g>
  <text x="256" y="430" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="72" font-weight="700" letter-spacing="-0.03em" fill="#eef0f4">Tankz</text>
  <rect x="220" y="448" width="72" height="8" rx="4" fill="#5eead4"/>
</svg>`;

/**
 * Favicon / tab mark — dual-mode readable on light AND dark browser chrome.
 * Solid plate + teal rim defines the chip on any tab color; tank is chunkier
 * with brighter edges so silhouette survives 16–32px.
 */
const tankFavicon = `
  <!-- track -->
  <rect x="6" y="58" width="108" height="30" rx="12" fill="#0d1016" stroke="#c8d0dc" stroke-width="3"/>
  <!-- road wheels -->
  <circle cx="28" cy="73" r="10" fill="#1a2030" stroke="#5eead4" stroke-width="2.5"/>
  <circle cx="28" cy="73" r="3.5" fill="#5eead4"/>
  <circle cx="60" cy="73" r="10" fill="#1a2030" stroke="#5eead4" stroke-width="2.5"/>
  <circle cx="60" cy="73" r="3.5" fill="#5eead4"/>
  <circle cx="92" cy="73" r="10" fill="#1a2030" stroke="#5eead4" stroke-width="2.5"/>
  <circle cx="92" cy="73" r="3.5" fill="#5eead4"/>
  <!-- hull -->
  <path d="M16 60 L24 34 L96 32 L116 50 L116 60 Z" fill="#2a3344" stroke="#e8edf4" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- turret -->
  <rect x="38" y="14" width="50" height="24" rx="3" fill="#323b4f" stroke="#e8edf4" stroke-width="2.5"/>
  <rect x="48" y="7" width="16" height="10" rx="2" fill="#1e2533" stroke="#c8d0dc" stroke-width="2"/>
  <!-- mantlet -->
  <rect x="84" y="20" width="14" height="14" rx="2" fill="#2a3344" stroke="#e8edf4" stroke-width="2"/>
  <!-- barrel + muzzle (brand teal — strongest signal) -->
  <rect x="94" y="24" width="52" height="8" rx="2" fill="#5eead4"/>
  <rect x="142" y="20" width="14" height="16" rx="2.5" fill="#2dd4bf"/>
  <rect x="146" y="23" width="2.5" height="10" rx="0.5" fill="#0a0c10" opacity="0.45"/>
  <rect x="151" y="23" width="2.5" height="10" rx="0.5" fill="#0a0c10" opacity="0.45"/>
  <!-- antenna -->
  <line x1="44" y1="14" x2="44" y2="2" stroke="#5eead4" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="44" cy="2" r="2.5" fill="#5eead4"/>
`.trim();

const svgFavicon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Tankz">
  <!-- Solid plate: visible chip on light tabs -->
  <rect width="64" height="64" rx="14" fill="#12141a"/>
  <!-- Teal rim: defines the chip on dark tabs -->
  <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="#5eead4" stroke-width="3"/>
  <!-- Soft inner ring for depth -->
  <rect x="4.5" y="4.5" width="55" height="55" rx="10" fill="none" stroke="#2a3140" stroke-width="1"/>
  <!-- Landscape tank centered and scaled to fill the badge -->
  <g transform="translate(4, 16.5) scale(0.35)">${tankFavicon}</g>
</svg>`;

writeFileSync(join(brand, "tankz-icon.svg"), svgIcon);
writeFileSync(join(brand, "tankz-wordmark.svg"), svgWordmark);
writeFileSync(join(brand, "tankz-logo.svg"), svgFull);
writeFileSync(join(brand, "tankz-favicon.svg"), svgFavicon);
writeFileSync(join(root, "public/favicon.svg"), svgFavicon);

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

await svgToPng(join(brand, "tankz-icon.svg"), join(brand, "tankz-icon.png"), 336, 192);
await svgToPng(
  join(brand, "tankz-wordmark.svg"),
  join(brand, "tankz-wordmark.png"),
  560,
  120,
);
await svgToPng(join(brand, "tankz-logo.svg"), join(brand, "tankz-logo.png"), 512, 512, {
  solid: true,
});
// Favicon: opaque badge (no transparency) so dark/light tabs both see a solid chip
await svgToPng(join(root, "public/favicon.svg"), join(root, "public/favicon.png"), 64, 64, {
  solid: true,
});
await svgToPng(
  join(root, "public/favicon.svg"),
  join(brand, "tankz-favicon.png"),
  64,
  64,
  { solid: true },
);

await browser.close();
console.log("logo set complete → public/brand/ + public/favicon.{svg,png}");
