import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const version = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"), "utf8")).version;
const outputDir = path.join(root, "dist");
const archive = path.join(outputDir, `dm-plugin-${version}.zip`);
fs.mkdirSync(outputDir, { recursive: true });
if (fs.existsSync(archive)) fs.rmSync(archive);

execFileSync(process.execPath, ["scripts/validate-package.mjs"], { cwd: root, stdio: "inherit" });
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "dm-plugin-build-"));
const prefix = `dm-plugin-${version}`;
const stageRoot = path.join(stage, prefix);
const tracked = execFileSync(
  "git",
  ["ls-files", "--", "LICENSE", "README.md", "CHANGELOG.md", "mcp.json", "plugin.json", "skills", "scripts", "package.json", "package-lock.json"],
  { cwd: root, encoding: "utf8" },
).trim().split("\n").filter(Boolean).sort();
const fixedTime = new Date("2026-01-01T00:00:00.000Z");
for (const relativePath of tracked) {
  const destination = path.join(stageRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, relativePath), destination);
  fs.utimesSync(destination, fixedTime, fixedTime);
}
const archiveName = path.basename(archive);
execFileSync("zip", ["-X", "-D", "-q", archiveName, ...tracked.map((relativePath) => path.join(prefix, relativePath))], { cwd: stage });
fs.copyFileSync(path.join(stage, archiveName), archive);
fs.rmSync(stage, { recursive: true, force: true });
const checksum = execFileSync("sha256sum", [archive], { cwd: root, encoding: "utf8" }).trim();
fs.writeFileSync(path.join(outputDir, `dm-plugin-${version}.sha256`), `${checksum}\n`);
console.log(`release written: ${path.relative(root, archive)}`);
