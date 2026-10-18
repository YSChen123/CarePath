import { execFileSync } from "node:child_process";
// 保留旧命令兼容性；只能从已确认原表和访谈重新导入，不再复制旧JSON。
execFileSync("python", ["-X", "utf8", "scripts/import-data.py"], {
  stdio: "inherit",
  cwd: new URL("../", import.meta.url),
});
