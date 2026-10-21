# DM Agent Plugin

Public distribution assets for DM, the governed shared-context workspace from
AuzzurA.

This repository is intentionally separate from the DM backend. It will contain
portable Agent Plugin manifests, public skills, release assets, and installation
documentation. Authentication, workspace isolation, permissions, grants,
quotas, approval gates, and MCP implementation remain in
[`Auzzura/DM-Core`](https://github.com/Auzzura/DM-Core).

The public package does not contain backend source code, credentials, customer
data, private product documents, or provider tokens. A release manifest and
remote MCP URL are added only after the endpoint and client compatibility have
been verified.

## Status

The repository is being prepared for the shared OpenAI, Cursor, and Claude
distribution paths. No marketplace listing or publication is implied by this
repository existing.

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
