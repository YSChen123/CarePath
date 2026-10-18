import { chromium } from "@playwright/test";
import { browserOptions } from "./browser-options.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const out = new URL("../docs/references/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch(browserOptions);
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();
const results = [];
for (const [name, url] of [
  ["solace", "https://www.solace.health/"],
  ["linear", "https://linear.app/"],
]) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-${width}.png`, out)),
      });
      const info = await page.evaluate(() => {
        const style = (el) => {
          if (!el) return null;
          const s = getComputedStyle(el);
          return {
            text: el.innerText?.slice(0, 300),
            font: s.fontFamily,
            size: s.fontSize,
            lineHeight: s.lineHeight,
            color: s.color,
            background: s.backgroundColor,
            width: Math.round(el.getBoundingClientRect().width),
          };
        };
        return {
          title: document.title,
          url: location.href,
          h1: style(document.querySelector("h1")),
          h2: style(document.querySelector("h2")),
          body: style(document.body),
          nav: style(document.querySelector("nav")),
          paragraph: style(document.querySelector("p")),
        };
      });
      await page.evaluate(() => scrollTo(0, 1100));
      await page.waitForTimeout(400);
      await page.screenshot({
        path: fileURLToPath(new URL(`${name}-${width}-content.png`, out)),
      });
      results.push({ name, width, status: response?.status(), ...info });
      console.log(name, width, JSON.stringify(info));
    } catch (error) {
      results.push({ name, width, error: String(error) });
      console.log(name, width, String(error));
    }
  }
}
await writeFile(
  new URL("observations.json", out),
  JSON.stringify(results, null, 2),
);
await browser.close();
