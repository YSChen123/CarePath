import { test, expect } from "@playwright/test";

test("固定三栏目与摄影首页，品牌返回首页，研究子页直接访问", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#primary-nav a")).toHaveText([
    "团队介绍",
    "项目提案",
    "数据收集计划",
  ]);
  await expect(page.locator("main h1")).toHaveText(
    "第一次独自去医院，下一步怎么走？",
  );
  const photo = page.locator(".home-hero img");
  await expect(photo).toBeVisible();
  expect(
    await photo.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 1000,
    ),
  ).toBeTruthy();
  await page
    .getByRole("link", { name: "了解项目", exact: true })
    .first()
    .click();
  await expect(page.locator("main h1")).toHaveText("项目提案");
  await page.goto("/#/research/interviews?person=I03");
  await page.reload();
  await expect(page.locator("[data-turn]")).toHaveCount(68);
  await expect(page.locator('#primary-nav a[aria-current="page"]')).toHaveText(
    "数据收集计划",
  );
  await page.locator(".brand").click();
  await expect(page.locator(".home-hero img")).toBeVisible();
});
