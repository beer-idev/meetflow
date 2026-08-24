---
name: meetflow-product
description: Design, implement, or review MeetFlow features for meetings, minutes, documents, permissions, search, and audit history. Use for changes in this repository that affect the product workflow or Thai user experience; do not use for unrelated generic Next.js work.
---

# MeetFlow Product

Preserve the product's working model: **prepare → record → review → publish → find/audit**. Fit new behavior into this sequence unless the requested feature genuinely introduces a different business process.

## Before changing the product

- Read [`../../../docs/SYSTEM_DESIGN.md`](../../../docs/SYSTEM_DESIGN.md) when changing workflow, roles, persistence, files, search, PDF, or deployment.
- Inspect [`../../../supabase/migrations/`](../../../supabase/migrations/) before changing stored data or permissions. Treat RLS as the authorization boundary; hiding UI is not authorization.
- Read [`references/human-interface.md`](references/human-interface.md) for UI, interaction, or user-facing Thai copy changes.

## Product invariants

- Keep one clear primary action per screen and show status in ordinary work language: `ฉบับร่าง`, `รอตรวจทาน`, `เผยแพร่แล้ว`.
- Preserve human review. Never silently approve, publish, share, invite people, or alter access rights on a user's behalf.
- Store TipTap JSON as the report source and update its extracted plain text for search/export in the same write operation.
- Put binaries in the private Supabase bucket at `{organization_id}/{meeting_id}/...`; store metadata and paths in PostgreSQL.
- Enforce organization membership and document permissions through RLS for every new table, view, RPC, and storage policy.
- Record consequential operations in the append-only audit log: create, edit, review, approve, publish, share, download, permission change, and delete/archive.
- Keep service-role credentials server-only. Prefer Server Actions for authenticated mutations and validate inputs with Zod at the boundary.

## Implementing a change

Trace the affected journey from entry point through persistence, permission checks, feedback, and failure recovery. Reuse the existing visual language and components before adding a new abstraction. A feature is complete only when its empty, loading, validation, success, and permission-denied states are understandable.

For schema changes, add a forward migration; do not rewrite an already-applied migration. For report/PDF changes, verify both editable content and the immutable approved export. For search changes, check Thai partial queries and organization scoping.

Run the smallest relevant verification first, then `npm run lint` and `npm run build` before handoff when the environment permits.
