# DM Agent Plugin

Public distribution assets for DM, the governed shared-context workspace from
AuzzurA.

This repository is intentionally separate from the DM backend. It will contain
portable Agent Plugin manifests, public skills, release assets, and installation
documentation. Authentication, workspace isolation, permissions, grants,
quotas, approval gates, and MCP implementation remain in
[`Auzzura/DM-Core`](https://github.com/Auzzura/DM-Core).

The public package does not contain backend source code, credentials, customer
data, private product documents, or provider tokens. The v0.1.0 package points
at the externally reachable DM MCP origin recorded in the release ledger. The
endpoint's public discovery and unauthenticated protection boundary are
verified; authenticated client interoperability remains a separate test gate.

## Status

The repository contains the shared OpenAI, Cursor, and Claude distribution
assets. No marketplace listing or publication is implied by this repository
existing.

## Setup

1. Sign in to DM and create or select the target workspace.
2. Configure an authorized DM Agent installation and access profile.
3. Install or configure this package in the AI client and complete the DM
   OAuth consent screen.
4. Use approved decision context and review any proposed updates in DM before
   they become durable memory.

The package exposes one remote Streamable HTTP server, `dm`, at
`https://api.dm.auzzura.com/mcp`. It contains no bearer token, client secret,
header, hook, local executable, or automatic grant path. The package declares
OpenAI OAuth discovery with dynamic client registration and the `mcp` scope;
the DM service remains responsible for login, consent, installation/profile
grants, workspace isolation, and permission checks.

Run `npm run validate` to check the package structure and `npm run release` to
build a deterministic ZIP from the committed package contents. Release output
is not a marketplace submission. Run `npm run verify:endpoint` for a
credential-free, read-only check of the documented production health,
discovery, protected-resource, and unauthenticated MCP challenge surfaces.

## Boundaries

- DM-Core is the single remote MCP implementation.
- DM requires explicit DM login, workspace selection, Agent installation/profile
  authorization, and OAuth consent.
- AI-generated submissions remain subject to human review; this package never
  auto-approves governed knowledge.
- Marketplace submissions and production release require founder approval.

## License

The distribution assets in this repository are licensed under the MIT License.
This license does not grant rights to DM-Core or to any AuzzurA service,
trademark, customer data, or private documentation.
