import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const seed = JSON.parse(readFileSync("public/data/research.json", "utf8"));

test("表格题号深链接和历史返回保持选中列可见", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const visibleColumn = async (id: string) =>
    page.locator(`[data-column="${id}"]`).evaluate((el) => {
      const region = el.closest(".raw-table-scroll")!.getBoundingClientRect(),
        cell = el.getBoundingClientRect();
      const frozen = el
        .closest("table")!
        .querySelector("th")!
        .getBoundingClientRect();
      return cell.left >= frozen.right - 2 && cell.right <= region.right + 2;
    });
  await page.goto("/#/research/survey?view=table&q=Q22");
  await expect(page.locator("main h1")).toBeVisible();
  await expect.poll(() => visibleColumn("Q22")).toBeTruthy();
  await page.getByLabel("定位题号").selectOption("Q16");
  await page.getByLabel("定位题号").selectOption("Q22");
  await page.goBack();
  await expect(page.getByLabel("定位题号")).toHaveValue("Q16");
  await expect.poll(() => visibleColumn("Q16")).toBeTruthy();
});
test("三项导航、必需正文、桌面和手机无溢出或脚本错误", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of [
      "",
      "team",
      "proposal",
      "research/interviews",
      "research/survey",
    ]) {
      await page.goto("/#/" + route);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("#primary-nav a")).toHaveCount(3);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
  await page.goto("/#/team");
  for (const p of seed.project.team)
    await expect(page.getByText(p.student_id)).toBeVisible();
  await expect(page.locator(".work-table tbody tr")).toHaveCount(3);
  await expect(page.locator(".work-table")).toContainText("问卷调查5份");
  await expect(page.locator(".contribution")).toContainText("原始撰写");
  await expect(page.locator(".contribution")).toContainText("完善与审阅");
  await expect(page.locator("main")).toContainText(
    "山东大学计算机科学与技术学院",
  );
  expect(errors).toEqual([]);
});
test("4份访谈全部272轮逐字一致，追问相邻，主题折叠、检索与切换可操作", async ({
  page,
}) => {
  for (const p of seed.interviews) {
    await page.goto("/#/research/interviews?person=" + p.id);
    await expect(page.locator("[data-turn]")).toHaveCount(p.turns.length);
    expect(await page.locator("[data-turn-text]").allTextContents()).toEqual(
      p.turns.map((t: any) => t.text),
    );
    await page.getByRole("button", { name: "收起全部主题" }).click();
    await expect(page.locator("details[open].transcript-section")).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "展开全部主题" }).click();
    await expect(page.locator("details[open].transcript-section")).toHaveCount(
      6,
    );
  }
  await page.getByLabel("检索访谈内容").fill("Q19");
  await expect(page.locator(".dialogue-group")).toHaveCount(1);
});
test("按题目查看完整原题与选项，15人回答保持原值和排序", async ({ page }) => {
  await page.goto("/#/research/survey");
  for (const q of seed.survey_questions) {
    await page.getByLabel("选择题目").selectOption(q.id);
    await expect(page.locator("[data-question-title]")).toHaveText(q.text);
    if (q.options)
      expect(
        await page
          .locator(".question-definition .question-content .option-list li")
          .allTextContents(),
      ).toEqual(
        q.options.map(
          (o: string, i: number) =>
            (q.type === "ranking"
              ? String(i + 1).padStart(2, "0")
              : String.fromCharCode(65 + i)) + o,
        ),
      );
    await expect(page.locator("[data-response]")).toHaveCount(15);
    expect(
      await page.locator("[data-response-text]").allTextContents(),
    ).toEqual(
      seed.survey_responses.map((r: any) =>
        Array.isArray(r.answers[q.id])
          ? r.answers[q.id].join(q.type === "ranking" ? " → " : "；")
          : String(r.answers[q.id]),
      ),
    );
  }
});
test("原始表格330项、CSV与逐人答卷完整，检索和题号定位正常", async ({
  page,
}) => {
  await page.goto("/#/research/survey?view=table");
  await expect(page.locator(".raw-table tbody tr")).toHaveCount(15);
  await expect(page.locator(".raw-table thead th")).toHaveCount(23);
  expect(await page.locator("td[data-cell]").allTextContents()).toEqual(
    seed.survey_responses.flatMap((r: any) =>
      seed.survey_questions.map((q: any) =>
        Array.isArray(r.answers[q.id])
          ? r.answers[q.id].join(q.type === "ranking" ? " → " : "；")
          : String(r.answers[q.id]),
      ),
    ),
  );
  await page.getByLabel("定位题号").selectOption("Q16");
  await expect
    .poll(() =>
      page.locator(".raw-table-scroll").evaluate((el) => el.scrollLeft),
    )
    .toBeGreaterThan(1000);
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 CSV", exact: true }).click();
  const text = readFileSync((await (await waiting).path())!, "utf8");
  expect(text.split("\r\n")).toHaveLength(16);
  expect(text).toContain(seed.survey_responses[0].answers.Q16.join("；"));
  await page.getByLabel("检索原始答卷").fill("R09");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("检索原始答卷").fill("不存在xyz");
  await expect(page.getByText("没有找到匹配内容")).toBeVisible();
  await page.getByRole("button", { name: "清除检索", exact: true }).click();
  await page.getByRole("button", { name: "查看 R03 完整答卷" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-answer]")).toHaveCount(22);
  await expect(page.locator('[data-answer-id="Q22"]')).toHaveText(
    seed.survey_responses[2].answers.Q22,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("原提纲25题和原问卷22题可展开，逐题统计来自全部原始答案", async ({
  page,
}) => {
  await page.goto("/#/research/interviews");
  await page.getByText("查看完整访谈提纲", { exact: true }).click();
  await expect(page.locator(".guide-question")).toHaveCount(25);
  await page.goto("/#/research/survey");
  await page.getByText("查看全部22道题", { exact: true }).click();
  await expect(page.locator("[data-question]")).toHaveCount(22);
  await page.getByText("查看全部22道题", { exact: true }).click();
  for (const q of seed.survey_questions) {
    await page.getByLabel("选择题目").selectOption(q.id);
    await expect(page.locator("[data-question-title]")).toHaveText(q.text);
    if (q.type === "open") {
      await expect(page.locator("[data-stat-chart]")).toHaveCount(0);
      continue;
    }
    const stats = seed.survey_summary.question_stats[q.id];
    const entries = Object.entries(
      q.type === "ranking" ? stats.average_rank : stats.counts,
    ) as [string, number][];
    entries.sort((a, b) => b[1] - a[1]);
    expect(await page.locator("[data-stat-value]").allTextContents()).toEqual(
      entries.map(([, v]) => (q.type === "ranking" ? v.toFixed(2) : String(v))),
    );
    await expect(page.locator("[data-stat-chart]")).toContainText("n=15");
  }
});
test("手机菜单、研究二级入口、历史返回与键盘可用", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "打开导航菜单" }).click();
  await page
    .locator("header")
    .getByRole("link", { name: "数据收集计划", exact: true })
    .click();
  await expect(page.locator(".menu-button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page
    .getByRole("navigation", { name: "数据收集子栏目" })
    .getByRole("link", { name: /问卷调查/ })
    .click();
  await page.getByLabel("选择题目").selectOption("Q22");
  await page.getByLabel("检索本题回答").fill("隐私");
  await expect(page.locator("[data-response]")).toHaveCount(1);
  await page.getByLabel("选择题目").selectOption("Q16");
  await expect(page.getByLabel("检索本题回答")).toHaveValue("");
  await page.goBack();
  await expect(page.getByLabel("选择题目")).toHaveValue("Q22");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
test("数据请求失败显示重试，旧链接重定向到精简后的内容", async ({ page }) => {
  await page.route("**/data/research.json", (route) =>
    route.fulfill({ status: 500, body: "failed" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "研究数据暂时无法加载" }),
  ).toBeVisible();
  await page.unroute("**/data/research.json");
  await page.getByRole("button", { name: "重新加载数据" }).click();
  await expect(page.locator("main h1")).toBeVisible();
  for (const route of ["proposal", "team", "insights"]) {
    await page.goto("/#/" + route);
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.locator("#primary-nav a").count()).toBe(3);
  }
});
