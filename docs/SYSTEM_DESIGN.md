# MeetFlow — Architecture and Product Requirements

## 1. Requirement coverage

| Requirement from the source diagram | Product capability |
| --- | --- |
| Enter meeting title, date/time, location, participants, agenda and details | Meeting creation and meeting workspace |
| Create and store agenda, minutes, resolutions, participants and attachments | TipTap report editor, agenda records and private attachments |
| Upload documents to cloud storage | Supabase Storage private bucket with file metadata in PostgreSQL |
| Read/edit/share permissions by role | RBAC roles plus row-level and object-level RLS policies |
| Classify by meeting type, year, month and department; keyword search | Department/category model, date filters, FTS and trigram search |
| Search/open, edit, download PDF and share link | Search query boundary, editor, immutable PDF output and expiring hashed share tokens |
| Record login, view, edit and download activity | Append-only audit log scoped to the organization |

## 2. Architecture style

MeetFlow is a **modular monolith with vertical feature slices**. This is a widely used architecture for a product at this stage: it keeps deployment simple on Vercel while maintaining boundaries that can later be extracted into services if scale requires it.

```text
┌──────────────────────────── Next.js / Vercel ────────────────────────────┐
│  Route groups                                                            │
│  (auth) Login / recovery          (workspace) Meetings / Reports / Files │
│        │                                     │                           │
│  Feature modules: UI → use case → repository interface                   │
│        │                                     │                           │
│  Shared: design system, session, validation, pagination, observability    │
└──────────────────────────────────┬────────────────────────────────────────┘
                                   │ Supabase client/server SDK
┌──────────────────────────────────▼────────────────────────────────────────┐
│ Supabase                                                                  │
│ Auth │ PostgreSQL + RLS │ Storage policies │ FTS/pg_trgm │ Realtime       │
└──────────────────────────────────┬────────────────────────────────────────┘
                                   │ queued/idempotent job
                         PDF renderer (Playwright)
                                   │
                           Private Storage object
```

### Dependency direction

```text
app routes → feature UI → application use cases → repository contracts
                                               ↓
                                   Supabase implementations
```

Domain and application code must not import page components. Supabase-specific query code belongs behind a repository or server action boundary. UI components receive view models rather than raw database rows.

## 3. Repository structure

```text
src/
├─ app/
│  ├─ login/                 Authentication route
│  ├─ (workspace)/           Protected application routes
│  └─ actions/               Authenticated mutation boundaries
├─ features/
│  ├─ meetings/              Meeting domain UI, types and use cases
│  ├─ reports/               Draft/review/publish workflow
│  ├─ documents/             Upload, classification and access
│  └─ administration/        Members, RBAC and audit
├─ components/
│  ├─ ui/                    Design-system primitives
│  ├─ layout/                App shell and navigation
│  ├─ data/                  Pagination and table patterns
│  └─ search/                Organization-wide search
├─ lib/
│  ├─ supabase/              Browser/server adapters
│  └─ validation/            Shared input contracts
└─ proxy.ts                  Session refresh and route protection
```

## 4. Domain model

An organization contains departments and memberships. A meeting belongs to one organization and optionally a department. It owns participants, agenda items, attachments and exactly one current report. A report has immutable versions and review decisions. Explicit document permissions extend role-based access without weakening organization boundaries.

The report state machine is:

```text
draft → in_review → approved → published
          └────────→ draft (changes requested)
```

Publishing requires a human reviewer or chair. The approved version is immutable. PDF generation reads that version and writes the resulting file once to private storage.

## 5. Security model

- Supabase Auth provides identity and session refresh through `src/proxy.ts`.
- RLS is the source of truth. Navigation visibility is only a usability concern.
- Organization membership gates every meeting, report, document and audit query.
- Explicit permissions support `view`, `edit` and `manage` access.
- Storage object paths begin with `{organization_id}/{meeting_id}/`; storage policies check the first segment.
- Share tokens are random, stored only as hashes and expire or can be revoked.
- Service-role credentials are available only to trusted server jobs.

## 6. Search and pagination

Client-side filtering in the demo mirrors the production query contract. Production list pages call the `search_meetings` RPC with a query, type, department, date range, limit and offset. The RPC returns `total_count` for pagination and is still constrained by RLS.

PostgreSQL uses:

- generated `tsvector` for title, description, location and extracted report text;
- `pg_trgm` for partial and typo-tolerant title matching;
- composite indexes for organization, department, type and date filters.

## 7. Operational design

- GitHub pull requests run lint and production build, then Vercel produces a preview deployment.
- Schema migrations are forward-only and deploy before code that depends on them.
- PDF and large file operations are idempotent background jobs with bounded retries.
- Audit records, structured application logs and error monitoring use correlation IDs.
- Supabase point-in-time recovery, Storage lifecycle policies and restore drills protect data.

## 8. Delivery sequence

1. Apply Supabase migrations and configure Auth email templates/redirect URLs.
2. Replace feature mock repositories with Supabase implementations using the existing query contracts.
3. Add report comments, review decisions and PDF worker execution.
4. Add signed download URLs, share-link landing pages and email invitations.
5. Add automated RLS tests, accessibility checks, monitoring and backup verification.
