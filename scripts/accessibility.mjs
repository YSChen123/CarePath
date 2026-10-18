import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { browserOptions } from "./browser-options.mjs";
import fs from "node:fs/promises";
const browser = await chromium.launch(browserOptions);
const context = await browser.newContext();
const page = await context.newPage();
const all = [];
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of [
    "",
    "team",
    "proposal",
    "research/interviews",
    "research/interviews?person=I03",
    "research/survey",
    "research/survey?view=table",
    "research/survey?q=Q16",
    "research/survey?q=Q22",
    "research/survey?view=individual&person=R04",
  ]) {
    await page.goto("http://127.0.0.1:4173/#/" + route);
    await page.locator("main h1").waitFor();
    if (route === "research/survey") {
      await page.getByText("查看全部22道题", { exact: true }).click();
      await page.locator(".question-detail").evaluateAll((items) =>
        items.forEach((el) => {
          el.open = true;
        }),
      );
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const violations = result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
        html: n.html,
      })),
    }));
    all.push({ width, route: route || "home", violations });
    console.log(
      width,
      route || "home",
      violations.map((v) => `${v.id}: ${v.nodes.length}`).join(", ") || "PASS",
    );
  }
}
await fs.writeFile(
  new URL("../docs/qa-final/accessibility.json", import.meta.url),
  JSON.stringify(all, null, 2),
);
await browser.close();
process.exitCode = all.some((x) => x.violations.length) ? 1 : 0;
