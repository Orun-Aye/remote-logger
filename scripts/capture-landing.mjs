// Full-page captures of the landing page for the redesign before/after record.
//
// Usage:
//   node scripts/capture-landing.mjs --url https://www.apperio.dev --out docs/redesign/before --widths 1440,390
//
// Uses the locally installed Chrome (channel "chrome") so no browser download
// is needed. Reduced motion is on so the GSAP scroll reveals land on their
// finished state instead of leaving below-the-fold sections invisible.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const HEIGHTS = { 1440: 900, 1024: 768, 768: 1024, 390: 844 };
const BAND = 4000;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const url = arg("url", "http://localhost:3000");
const outDir = arg("out", "docs/redesign/after");
const widths = arg("widths", "1440,1024,768,390").split(",").map(Number);
const themes = arg("themes", "light,dark").split(",");

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

for (const width of widths) {
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width, height: HEIGHTS[width] ?? 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      colorScheme: theme,
    });
    // next-themes reads its choice from localStorage before hydration
    await context.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
    await page.evaluate(() => document.fonts.ready);

    // Walk the page once so anything mounted on scroll is present
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      window.scrollTo(0, 0);
    });
    // The walk starts lazy images loading; wait until the visible ones have
    // decoded, or a slow one is captured as an empty frame
    await page.evaluate(() =>
      Promise.race([
        Promise.all(
          [...document.images]
            .filter((img) => img.offsetParent !== null)
            .map((img) =>
              img.complete && img.naturalWidth
                ? img.decode().catch(() => undefined)
                : new Promise((resolve) => {
                    img.addEventListener("load", resolve, { once: true });
                    img.addEventListener("error", resolve, { once: true });
                  })
            )
        ),
        new Promise((resolve) => setTimeout(resolve, 30_000)),
      ])
    );
    await page.addStyleTag({
      content: "*{caret-color:transparent !important}",
    });

    // Chrome cannot capture more than 16384px in one go and repeats the top of
    // the page past that point, so shoot in clipped bands and stitch them.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const bands = [];
    for (let y = 0; y < height; y += BAND) {
      const h = Math.min(BAND, height - y);
      bands.push({
        input: await page.screenshot({
          fullPage: true,
          clip: { x: 0, y, width, height: h },
        }),
        top: y,
        left: 0,
      });
    }
    const file = path.join(outDir, `landing-${width}-${theme}.png`);
    await sharp({
      create: { width, height, channels: 4, background: "#000" },
    })
      .composite(bands)
      .png()
      .toFile(file);
    console.log("saved", file, `${width}x${height}`);
    await context.close();
  }
}

await browser.close();
