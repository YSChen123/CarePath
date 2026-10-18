import { chromium } from "@playwright/test";
import { browserOptions } from "./browser-options.mjs";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

// 仅提供dist，不做开发服务器的路由fallback；在子目录测试相对路径。
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const mime = {
  ".html": "text/html;charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/course/")) {
      res.writeHead(404).end();
      return;
    }
    const target = path.resolve(
      root,
      decodeURIComponent(url.pathname.slice(8)) || "index.html",
    );
    if (!target.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const bytes = await readFile(target);
    res.writeHead(200, {
      "content-type": mime[path.extname(target)] || "application/octet-stream",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/course/`;
const browser = await chromium.launch(browserOptions);
const page = await browser.newPage();
const errors = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
});
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of [
      "",
      "team",
      "proposal",
      "research",
      "research/interviews",
      "research/survey",
    ]) {
      await page.goto("about:blank");
      const response = await page.goto(base + "#/" + route);
      await page.locator("main h1").waitFor();
      assert.equal(response.status(), 200);
      if (!route)
        assert(
          await page
            .locator(".home-hero img")
            .evaluate((img) => img.complete && img.naturalWidth > 1000),
        );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      results.push({
        width,
        route: route || "home",
        title: await page.locator("h1").innerText(),
        status: 200,
      });
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(
    new URL("../docs/qa-final/production.json", import.meta.url),
    JSON.stringify(
      {
        source: "dist/ served under /course/ without SPA fallback",
        results,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: dist在/course/子目录下，6路由×桌面/手机共12次访问成功，图片、资源与JSON无错误。",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
