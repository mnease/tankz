import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Start game
await page.getByRole("button", { name: "Deploy" }).click();
await page.waitForTimeout(400);

const hud1 = await page.evaluate(() => window.__tankz?.getHud());
console.log("hud after start", hud1);

// Controls test: throttle forward, then A (left) should increase yaw
await page.evaluate(() => {
  window.__controlsTest?.setKeys([]);
  window.__controlsTest?.setThrottle(1);
  window.__controlsTest?.setSteer(0);
});
await page.waitForTimeout(300);
const speed = await page.evaluate(() => window.__controlsTest?.getSpeed());
console.log("speed", speed);

const y0 = await page.evaluate(() => window.__controlsTest?.getYaw());
await page.evaluate(() => window.__controlsTest?.setSteer(1)); // left
await page.waitForTimeout(500);
const yA = await page.evaluate(() => window.__controlsTest?.getYaw());
await page.evaluate(() => window.__controlsTest?.setSteer(0));
await page.waitForTimeout(100);
const y1 = await page.evaluate(() => window.__controlsTest?.getYaw());
await page.evaluate(() => window.__controlsTest?.setSteer(-1)); // right
await page.waitForTimeout(500);
const yD = await page.evaluate(() => window.__controlsTest?.getYaw());
await page.evaluate(() => {
  window.__controlsTest?.setSteer(0);
  window.__controlsTest?.setThrottle(0);
  window.__controlsTest?.setKeys([]);
});

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const dA = wrap(yA - y0);
const dD = wrap(yD - y1);
console.log({ y0, yA, y1, yD, dA, dD, leftOk: dA > 0.05, rightOk: dD < -0.05 });

// fire a few times
await page.keyboard.down("Space");
await page.waitForTimeout(200);
await page.keyboard.up("Space");
await page.keyboard.down("KeyW");
await page.waitForTimeout(400);
await page.keyboard.up("KeyW");

await page.screenshot({ path: "/workspace/screenshots/tankz-play.png" });

// mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(200);
await page.screenshot({ path: "/workspace/screenshots/tankz-mobile.png" });

const hud2 = await page.evaluate(() => window.__tankz?.getHud());
console.log("hud final", hud2);
console.log("errors", errors);

if (!(dA > 0.05) || !(dD < -0.05)) {
  console.error("CONTROLS FAIL");
  process.exit(1);
}
if (errors.length) {
  console.error("ERRORS", errors);
  process.exit(1);
}
console.log("QA PASS");
await browser.close();
