import { test, expect } from "@playwright/test";

test("先展示总体竖向柱状图，再展示逐人回答，柱子按数值从左到右降序", async ({
  page,
}) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#/research/survey?q=Q7");
    await page.getByLabel('检索本题回答').fill('');
    await expect(page.locator("[data-stat-chart]")).toBeVisible();
    const geometry = await page.evaluate(() => {
      const chart = document
        .querySelector("[data-stat-chart]")!
        .getBoundingClientRect();
      const answers = document
        .querySelector(".question-responses")!
        .getBoundingClientRect();
      const bars = Array.from(
        document.querySelectorAll<HTMLElement>("[data-bar]"),
      ).map((el) => ({
        left: el.getBoundingClientRect().left,
        height: el.getBoundingClientRect().height,
        value: Number(el.dataset.bar),
      }));
      return {
        bottom: chart.bottom,
        answersTop: answers.top,
        bars,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.answersTop);
    expect(geometry.bars.length).toBeGreaterThan(0);
    for (let i = 1; i < geometry.bars.length; i++) {
      expect(geometry.bars[i].left).toBeGreaterThan(geometry.bars[i - 1].left);
      expect(geometry.bars[i].value).toBeLessThanOrEqual(
        geometry.bars[i - 1].value,
      );
      expect(geometry.bars[i].height).toBeLessThanOrEqual(
        geometry.bars[i - 1].height + 0.1,
      );
    }
    expect(geometry.overflow).toBeFalsy();
    await expect(page.locator("[data-response]")).toHaveCount(15);
    await page.getByLabel("检索本题回答").fill("R01");
    await expect(page.locator("[data-response]")).toHaveCount(1);
    await expect(page.locator("[data-stat-chart]")).toContainText("n=15");
  }
});
