---
name: dm-get-started
description: Set up authorized DM access and use approved decision context safely.
---

# Get started with DM

Use this workflow when a user wants to connect an AI client to DM or use DM
decision context.

## Setup

1. Ask the user to sign in to DM and create or select the workspace that should
   own the context.
2. Ask the user to configure or select an authorized DM Agent installation and
   access profile. Do not create an Agent or escalate grants on the user's
   behalf.
3. Start the client OAuth flow and ask the user to review and approve the
   requested DM authorization.
4. If authorization is denied, expired, revoked, or scoped to another
   workspace, explain the exact remediation and stop. Never work around a
   denial.

## Use DM context

- Prefer approved decisions and permission-filtered evidence.
- Prepare bounded task context before using it in a coding or delivery task.
- Treat similarity, conflict, or re-decision signals as review inputs, not
  truth.
- Keep provenance and workspace boundaries visible in the answer.
- A candidate or proposed update is not durable organizational knowledge until
  an authorized person reviews and approves it in DM.

## Follow-through

After a task, use the available DM workflow to review submitted outcomes and
follow-through. Do not claim that a task, outcome, or decision was saved until
the tool result confirms it. Never auto-approve a decision, task, outcome, or
governed knowledge record.
