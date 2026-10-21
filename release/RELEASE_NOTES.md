# DM plugin 0.1.0 release notes

Status: **release-train candidate — not submitted**

This candidate packages one portable Agent Plugins root for OpenAI ChatGPT /
Codex and Cursor, with a shared DM remote MCP connection and one minimal setup
skill. Claude can use the same public remote connector assets; no Claude-only
server or hook is included.

Verified locally:

- official portable plugin and portable MCP core schemas validate; the
  OpenAI-specific server auth extension is checked separately because the
  Agent Plugins 1.0 MCP schema is a closed portable shape;
- the package contains one remote `streamable-http` server;
- the package includes the public `assets/dm-logo.svg` listing asset;
- the OpenAI extension declares DCR OAuth with the `mcp` scope, without a
  client ID or secret;
- no credentials, authorization headers, placeholder URL, local executable,
  hook, customer data, or private backend source is included;
- the ZIP is created from the committed tree with a fixed archive timestamp;
- the credential-free endpoint verifier passes health, OAuth discovery,
  protected-resource metadata, and the unauthenticated MCP challenge;
- the package skill preserves DM login, workspace, Agent Installation/profile,
  OAuth consent, permission boundaries, and human approval.

Not claimed by this candidate:

- authenticated ChatGPT/Codex, Cursor, Claude web, or Claude Code calls;
- marketplace scan, submission, acceptance, or publication;
- production rollout, Free/Free-Trial client interoperability, or commercial
  approval.
