# Changelog

## 0.1.1 — marketplace metadata candidate

- Added OpenAI listing metadata, public website/support/privacy/terms links, and
  the composer icon required for remote MCP review.
- Imported the existing five-positive/three-negative synthetic reviewer cases.
- Added package release notes while keeping portal scan, recording, submission,
  approval, and publication explicitly unclaimed.

## 0.1.0 — release-train candidate

- Added the portable Agent Plugins `plugin.json` and `mcp.json` manifests.
- Added the DM-first setup skill with explicit OAuth, workspace, grant, and
  human-approval boundaries.
- Configured the single shared remote MCP origin:
  `https://api.dm.auzzura.com/mcp`.
- Added official-schema validation, path/secret checks, and a reproducible
  ZIP/checksum builder.

This is a release-train candidate, not a marketplace publication. Authenticated
client interoperability and marketplace review remain separate evidence gates.
