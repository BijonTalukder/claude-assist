import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(scriptDir, "..");
const workspaceRoot = resolve(cliRoot, "..", "..");
const dashboardDistDir = resolve(workspaceRoot, "apps", "dashboard", "dist");
const targetDir = resolve(cliRoot, "assets", "dashboard");

if (!existsSync(dashboardDistDir)) {
  throw new Error(`Dashboard build output not found at ${dashboardDistDir}`);
}

mkdirSync(resolve(cliRoot, "assets"), { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
cpSync(dashboardDistDir, targetDir, { recursive: true });
