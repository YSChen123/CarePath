import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { browserOptions } from "./browser-options.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const out = new URL("../docs/qa-final/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch(browserOptions),
  page = await browser.newPage();
const observations = [];
async function shot(name, fullPage = false) {
  await page.screenshot({
    path: fileURLToPath(new URL(name + ".png", out)),
    fullPage,
  });
}
for (const [width, height, name] of [
  [1440, 1000, "desktop"],
  [390, 844, "mobile"],
]) {
  await page.setViewportSize({ width, height });
  for (const route of [
    "",
    "team",
    "proposal",
    "research/interviews",
    "research/survey",
  ]) {
    const slug = route.replace("research/", "");
    await page.goto("http://127.0.0.1:4173/#/" + route);
    await page.locator("main h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator(".home-hero img")
      .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
    await shot(`${name}-${slug || "home"}`);
    if (!route || route === "team" || route === "proposal")
      await shot(`${name}-${slug || "home"}-full`, true);
    if (route === "research/interviews") {
      await page.locator("#transcript-journey").scrollIntoViewIfNeeded();
      await shot(`${name}-interview-body`);
    }
    if (route === "research/survey") {
      for (const q of ["Q16", "Q22"]) {
        await page.getByLabel("选择题目").selectOption(q);
        await page.locator(".question-definition").scrollIntoViewIfNeeded();
        await shot(`${name}-survey-${q}`);
      }
      await page
        .getByRole("button", { name: "原始数据表", exact: true })
        .click();
      await page.getByLabel("定位题号").selectOption("Q16");
      await page.waitForTimeout(400);
      await page.locator(".raw-table-scroll").scrollIntoViewIfNeeded();
      await shot(`${name}-survey-table`);
    }
    observations.push({
      name,
      route: route || "home",
      ...(await page.evaluate(() => ({
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        h1: document.querySelector("h1").innerText,
      }))),
    });
  }
}
await writeFile(
  new URL("layout-check.json", out),
  JSON.stringify(observations, null, 2),
);
await browser.close();
console.log("已保存新版首页、团队、提案、研究子页首屏与正文的桌面和手机截图。");
