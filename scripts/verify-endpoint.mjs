import process from "node:process";

const origin = "https://api.dm.auzzura.com";
const endpoint = `${origin}/mcp`;
const timeoutMs = 15_000;

const fail = (message) => {
  console.error(`endpoint verification failed: ${message}`);
  process.exitCode = 1;
};

const request = async (pathname, init = {}) => {
  const response = await fetch(`${origin}${pathname}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  return {
    response,
    body: await response.text(),
  };
};

const json = (label, body) => {
  try {
    return JSON.parse(body);
  } catch {
    fail(`${label} did not return JSON`);
    return null;
  }
};

try {
  const health = await request("/health");
  if (health.response.status !== 200 || json("health", health.body)?.status !== "ok") {
    fail(`health returned HTTP ${health.response.status}`);
  }

  const authorizationServer = await request("/.well-known/oauth-authorization-server");
  const authorizationDocument = json("authorization-server discovery", authorizationServer.body);
  if (authorizationServer.response.status !== 200) {
    fail(`authorization-server discovery returned HTTP ${authorizationServer.response.status}`);
  }
  if (authorizationDocument?.issuer !== `${origin}/`) fail("issuer does not match the public origin");
  if (!authorizationDocument?.authorization_endpoint?.endsWith("/authorize")) fail("authorization endpoint is missing");
  if (!authorizationDocument?.token_endpoint?.endsWith("/token")) fail("token endpoint is missing");
  if (!authorizationDocument?.registration_endpoint?.endsWith("/register")) fail("registration endpoint is missing");
  if (!authorizationDocument?.scopes_supported?.includes("mcp")) fail("mcp scope is not advertised");
  if (!authorizationDocument?.code_challenge_methods_supported?.includes("S256")) fail("PKCE S256 is not advertised");

  const protectedResource = await request("/.well-known/oauth-protected-resource/mcp");
  const protectedResourceDocument = json("protected-resource metadata", protectedResource.body);
  if (protectedResource.response.status !== 200) {
    fail(`protected-resource metadata returned HTTP ${protectedResource.response.status}`);
  }
  if (protectedResourceDocument?.resource !== endpoint) fail("protected resource does not match the MCP endpoint");
  if (!protectedResourceDocument?.authorization_servers?.includes(`${origin}/`)) {
    fail("protected resource does not advertise the public authorization server");
  }
  if (!protectedResourceDocument?.scopes_supported?.includes("mcp")) fail("protected resource omits the mcp scope");

  const unauthenticated = await request("/mcp");
  const unauthenticatedDocument = json("unauthenticated MCP response", unauthenticated.body);
  const challenge = unauthenticated.response.headers.get("www-authenticate") ?? "";
  if (unauthenticated.response.status !== 401) fail(`unauthenticated MCP GET returned HTTP ${unauthenticated.response.status}`);
  if (unauthenticatedDocument?.reason_code !== "missing_key") fail("unauthenticated MCP response has no safe missing-key reason");
  if (!challenge.includes("oauth-protected-resource/mcp") || !challenge.includes("scope=\"mcp\"")) {
    fail("unauthenticated MCP response has no expected bearer/resource challenge");
  }

  const initialize = await request("/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "dm-package-endpoint-verifier", version: "0.1.0" },
      },
    }),
  });
  const initializeDocument = json("unauthenticated initialize response", initialize.body);
  if (initialize.response.status !== 401) fail(`unauthenticated initialize returned HTTP ${initialize.response.status}`);
  if (initializeDocument?.reason_code !== "missing_key") fail("unauthenticated initialize has no safe missing-key reason");

  if (process.exitCode !== 1) {
    console.log("endpoint verification passed: health, OAuth discovery, protected-resource metadata, and unauthenticated MCP challenge");
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
