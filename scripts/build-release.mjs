import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith("--")) throw new Error(`unexpected argument: ${arg}`);
  args.set(arg, process.argv[index + 1]?.startsWith("--") ? true : process.argv[++index] ?? true);
}

const packageDocument = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"), "utf8"));
const version = packageDocument.version;
const expectedSha = args.get("--expected-sha");
const outputDir = path.resolve(String(args.get("--output-dir") ?? path.join(root, "dist")));
const archiveName = `dm-plugin-${version}.zip`;
const archive = path.join(outputDir, archiveName);
const checksumName = `${archiveName.replace(/\.zip$/, "")}.sha256`;

// This is deliberately explicit. Adding a public file requires a reviewed change here.
const PUBLIC_FILES = [
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
  "assets/dm-logo.svg",
  "mcp.json",
  "package-lock.json",
  "package.json",
  "plugin.json",
  "scripts/build-release.mjs",
  "scripts/validate-package.mjs",
  "scripts/verify-endpoint.mjs",
  "skills/dm-get-started/SKILL.md",
];
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /(?:ghp|github_pat|xox[baprs]|sk-[A-Za-z0-9])[A-Za-z0-9_-]{12,}/,
  /\b(?:api[_-]?key|client[_-]?secret|password|authorization)\s*[:=]\s*['\"]?[^\s'\"]{8,}/i,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i,
];

function fail(message) {
  throw new Error(`release build rejected: ${message}`);
}

function git(...gitArgs) {
  return execFileSync("git", gitArgs, { cwd: root, encoding: "utf8" }).trim();
}

function assertCleanAndPinned() {
  const status = git("status", "--porcelain", "--untracked-files=all");
  if (status) fail("source checkout is dirty; build from a clean detached worktree");
  const sha = git("rev-parse", "HEAD");
  if (!/^[0-9a-f]{40}$/.test(sha)) fail("HEAD is not an immutable commit SHA");
  if (expectedSha && sha !== expectedSha) fail(`HEAD ${sha} does not match --expected-sha ${expectedSha}`);
  return sha;
}

function assertPublicFiles() {
  for (const relativePath of PUBLIC_FILES) {
    if (path.isAbsolute(relativePath) || relativePath.includes("..") || relativePath.includes("\\")) {
      fail(`unsafe allowlist path: ${relativePath}`);
    }
    const file = path.join(root, relativePath);
    if (!fs.existsSync(file)) fail(`missing allowlisted file: ${relativePath}`);
    const stat = fs.lstatSync(file);
    if (!stat.isFile()) fail(`allowlisted path is not a regular file: ${relativePath}`);
    if (stat.size > 1024 * 1024) fail(`allowlisted file is too large: ${relativePath}`);
  }
  const tracked = git("ls-files").split("\n").filter(Boolean).sort();
  const allowlisted = new Set(PUBLIC_FILES);
  const unexpected = tracked.filter((entry) => !allowlisted.has(entry) && !entry.startsWith("release/") && entry !== ".gitignore");
  if (unexpected.length) fail(`tracked public files are not allowlisted: ${unexpected.join(", ")}`);
}

function scanSecretContent(relativePath, content) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) fail(`credential-like content in ${relativePath}`);
  }
}

function stageFiles(stageRoot) {
  const fixedTime = new Date("2026-01-01T00:00:00.000Z");
  for (const relativePath of PUBLIC_FILES) {
    const source = path.join(root, relativePath);
    const destination = path.join(stageRoot, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const content = fs.readFileSync(source);
    scanSecretContent(relativePath, content.toString("utf8"));
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(destination, 0o644);
    fs.utimesSync(destination, fixedTime, fixedTime);
  }
}

function assertArchiveContents(archivePath, prefix) {
  const entries = execFileSync("unzip", ["-Z1", archivePath], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const expected = PUBLIC_FILES.map((relativePath) => `${prefix}/${relativePath}`).sort();
  if (JSON.stringify(entries) !== JSON.stringify(expected)) fail("ZIP entries differ from the reviewed public allowlist");
  for (const entry of entries) {
    if (!entry.startsWith(`${prefix}/`) || entry.includes("..") || entry.startsWith("/") || entry.includes("\\")) {
      fail(`unsafe ZIP entry: ${entry}`);
    }
    const content = execFileSync("unzip", ["-p", archivePath, entry]);
    scanSecretContent(entry, content.toString("utf8"));
  }
}

const sha = assertCleanAndPinned();
assertPublicFiles();
execFileSync(process.execPath, ["scripts/validate-package.mjs"], { cwd: root, stdio: "inherit" });
fs.mkdirSync(outputDir, { recursive: true });
if (fs.existsSync(archive)) fs.rmSync(archive);
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "dm-plugin-build-"));
try {
  const prefix = `dm-plugin-${version}`;
  const stageRoot = path.join(stage, prefix);
  stageFiles(stageRoot);
  // Info-ZIP stores DOS timestamps in local time. Keep the build process
  // timezone variable for the caller's reproducibility test, but normalize
  // the archive writer itself so fixed UTC mtimes remain byte-identical.
  execFileSync("zip", ["-X", "-D", "-q", archiveName, ...PUBLIC_FILES.map((relativePath) => path.join(prefix, relativePath))], {
    cwd: stage,
    env: { ...process.env, TZ: "UTC" },
  });
  fs.copyFileSync(path.join(stage, archiveName), archive);
  assertArchiveContents(archive, prefix);
  const checksum = execFileSync("sha256sum", [archive], { cwd: outputDir, encoding: "utf8" }).trim();
  fs.writeFileSync(path.join(outputDir, checksumName), `${checksum}\n`);
  console.log(`release written: ${path.relative(root, archive)} (${sha})`);
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
