import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const version = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"), "utf8")).version;
const outputDir = path.join(root, "dist");
const archive = path.join(outputDir, `dm-plugin-${version}.zip`);
fs.mkdirSync(outputDir, { recursive: true });
if (fs.existsSync(archive)) fs.rmSync(archive);

execFileSync(process.execPath, ["scripts/validate-package.mjs"], { cwd: root, stdio: "inherit" });
const temporary = path.join(root, `dm-plugin-${version}.zip`);
execFileSync("git", ["archive", "--format=zip", "--mtime=2026-01-01T00:00:00Z", `--output=${temporary}`, `--prefix=dm-plugin-${version}/`, "HEAD", "--", "LICENSE", "README.md", "mcp.json", "plugin.json", "skills", "scripts", "package.json", "package-lock.json"], { cwd: root, stdio: "inherit" });
fs.renameSync(temporary, archive);
const checksum = execFileSync("sha256sum", [archive], { cwd: root, encoding: "utf8" }).trim();
fs.writeFileSync(path.join(outputDir, `dm-plugin-${version}.sha256`), `${checksum}\n`);
console.log(`release written: ${path.relative(root, archive)}`);
