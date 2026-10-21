import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const fail = (message) => {
  console.error(`package validation failed: ${message}`);
  process.exitCode = 1;
};

const plugin = readJson("plugin.json");
const mcp = readJson("mcp.json");
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const pluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const mcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const loadSchema = async (uri) => {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`could not fetch ${uri}: HTTP ${response.status}`);
  return response.json();
};

const portableMcp = structuredClone(mcp);
// Agent Plugins 1.0.0 defines a closed portable MCP shape. OpenAI's current
// submission format adds a client extension on each server, so validate the
// portable core separately and validate that extension below.
delete portableMcp.mcpServers.dm.extensions;

for (const [label, document, schemaUri] of [["plugin.json", plugin, pluginSchema], ["mcp.json", portableMcp, mcpSchema]]) {
  try {
    const schema = await loadSchema(schemaUri);
    const validate = ajv.compile(schema);
    if (!validate(document)) fail(`${label} does not match the official schema: ${ajv.errorsText(validate.errors)}`);
  } catch (error) {
    fail(`${label} schema validation unavailable: ${error.message}`);
  }
}

if (plugin.name !== "auzzura-dm" || plugin.version !== "0.1.0") fail("unexpected package identity or version");
if (plugin.name.includes("plugin") || plugin.name.includes("mcp")) fail("package name must not include platform transport terms");

const servers = mcp.mcpServers ?? {};
if (Object.keys(servers).length !== 1 || !servers.dm) fail("exactly one named dm MCP server is required");
const server = servers.dm;
if (server.type !== "streamable-http") fail("dm server must use streamable-http");
if (server.url !== "https://api.dm.auzzura.com/mcp") fail("dm server URL is not the verified canonical endpoint");
if (server.url.includes("<") || server.url.includes("example.com") || server.url.includes("localhost")) fail("placeholder or local URL found");
if (JSON.stringify(mcp).match(/(token|secret|password|authorization|api[_-]?key)/i)) fail("credential-like field found in mcp.json");

const openAiPluginExtension = plugin.extensions?.["com.openai"];
if (openAiPluginExtension?.onboardingSkill !== "./skills/dm-get-started/SKILL.md") {
  fail("OpenAI onboardingSkill must point to the bundled getting-started skill");
}
if (openAiPluginExtension.interface?.logo !== "./assets/dm-logo.svg") {
  fail("OpenAI interface logo must point to the bundled public logo");
}
const openAiServerExtension = server.extensions?.["com.openai"];
if (openAiServerExtension?.auth?.type !== "oauth") fail("OpenAI MCP auth must be declared as OAuth");
if (openAiServerExtension.auth.client?.mode !== "dcr") fail("OpenAI OAuth must declare dynamic client registration");
if (!openAiServerExtension.auth.baseScopes?.includes("mcp")) fail("OpenAI OAuth must request the mcp scope");
if (Object.prototype.hasOwnProperty.call(openAiServerExtension.auth, "clientId")) fail("clientId must not be committed at the auth level");
if (Object.prototype.hasOwnProperty.call(openAiServerExtension.auth.client ?? {}, "clientId")) fail("clientId must not be committed for a DCR client");

const skillPath = path.join(root, "skills/dm-get-started/SKILL.md");
const skill = fs.readFileSync(skillPath, "utf8");
if (!skill.startsWith("---\n") || !skill.includes("\nname: dm-get-started\n") || !skill.includes("\ndescription: ")) fail("skill frontmatter is incomplete");
if (!skill.includes("Never auto-approve")) fail("skill must preserve human approval boundary");

for (const relativePath of ["plugin.json", "mcp.json", "README.md", "LICENSE", "assets/dm-logo.svg", "skills/dm-get-started/SKILL.md"]) {
  if (!fs.existsSync(path.join(root, relativePath))) fail(`missing required package path: ${relativePath}`);
  if (path.isAbsolute(relativePath) || relativePath.includes("..")) fail(`unsafe package path: ${relativePath}`);
}

if (process.exitCode !== 1) console.log("package validation passed: portable schemas, client extensions, paths, endpoint, skill, and secret checks");
