import { test, expect } from "@playwright/test";

test("检索后打印仍包含本份访谈完整68轮，并恢复检索", async ({ page }) => {
  await page.goto("/#/research/interviews");
  await page.getByLabel("检索访谈内容").fill("Q19");
  await expect(page.locator(".dialogue-group")).toHaveCount(1);
  await page.evaluate(() => {
    window.print = () => {
      (window as any).__printedTurns = Array.from(
        document.querySelectorAll("[data-turn-text]"),
      ).map((el) => el.textContent);
    };
  });
  await page.getByRole("button", { name: "打印本份访谈" }).click();
  expect(await page.evaluate(() => (window as any).__printedTurns.length)).toBe(
    68,
  );
  await expect(page.getByLabel("检索访谈内容")).toHaveValue("Q19");
});

test("答卷深链接在历史返回后恢复弹窗", async ({ page }) => {
  await page.goto("/#/research/survey?view=individual&person=R03");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭完整答卷" }).click();
  await page.getByLabel("选择题目").selectOption("Q16");
  await expect(page.getByLabel("选择题目")).toHaveValue("Q16");
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#respondent-title")).toHaveText("R03");
});
