import { existsSync } from "node:fs";
import path from "node:path";
const cached = path.join(
  process.env.LOCALAPPDATA || "",
  "ms-playwright/chromium-1140/chrome-win/chrome.exe",
);
export const browserOptions = {
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync(cached) ? cached : undefined),
};
