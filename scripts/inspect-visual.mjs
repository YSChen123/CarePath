import { chromium } from "@playwright/test";
import { browserOptions } from "./browser-options.mjs";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch(browserOptions),
  p = await b.newPage();
await p.goto("http://127.0.0.1:4173");
await p.locator("h1").waitFor();
const c = await p.context().newCDPSession(p);
await c.send("DOM.enable");
await c.send("CSS.enable");
const root = await c.send("DOM.getDocument"),
  fonts = [];
for (const selector of ["h1", ".hero-description"]) {
  const n = await c.send("DOM.querySelector", {
    nodeId: root.root.nodeId,
    selector,
  });
  fonts.push({
    selector,
    ...(await c.send("CSS.getPlatformFontsForNode", { nodeId: n.nodeId })),
  });
}
console.log(JSON.stringify(fonts, null, 2));
await writeFile(
  new URL("../docs/qa-redesign/fonts.json", import.meta.url),
  JSON.stringify(fonts, null, 2),
);
await p.setViewportSize({ width: 1440, height: 1000 });
await p.goto("https://linear.app/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(7000);
await p.screenshot({
  path: new URL(
    "../docs/references/linear-1440-settled.png",
    import.meta.url,
  ).pathname.slice(1),
});
await b.close();
