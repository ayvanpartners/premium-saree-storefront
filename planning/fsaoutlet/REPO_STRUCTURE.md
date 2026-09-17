# FSAOutlet — Proposed Repository Structure

pnpm workspace monorepo. Rationale: the integration worker (§9 of `ARCHITECTURE.md`)
must import the same domain, database and supplier-adapter code as the web app.
Retrofitting a workspace after the fact is significantly more expensive than starting
with one. If the owner prefers a single app, see `DECISIONS_REQUIRED.md` #4.

```
fsaoutlet/
├── apps/
│   ├── web/                              # Next.js App Router — storefront + admin
│   │   ├── src/app/
│   │   │   ├── (storefront)/
│   │   │   │   ├── layout.tsx            # header, nav, footer, skip-link
│   │   │   │   ├── page.tsx              # home
│   │   │   │   ├── shop/page.tsx
│   │   │   │   ├── c/[...slug]/page.tsx          # category (SSR + ISR)
│   │   │   │   ├── p/[slug]/page.tsx             # product (ISR + JSON-LD)
│   │   │   │   ├── b/[brand]/page.tsx            # brand
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── fsa-eligible/page.tsx
│   │   │   │   ├── hsa-eligible/page.tsx
│   │   │   │   ├── deals/page.tsx
│   │   │   │   ├── spend-my-fsa/page.tsx         # the guided flow
│   │   │   │   ├── spend/[amount]/page.tsx       # Shop by Balance landing pages
│   │   │   │   ├── learn/page.tsx
│   │   │   │   ├── learn/[slug]/page.tsx
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── checkout/…
│   │   │   │   ├── order/[number]/page.tsx       # guest order lookup + tracking
│   │   │   │   ├── account/…                     # orders, shipments, returns, addresses
│   │   │   │   └── (legal)/…                     # terms, privacy, health-data policy
│   │   │   ├── (admin)/admin/
│   │   │   │   ├── layout.tsx                    # RBAC + MFA gate (server-side)
│   │   │   │   ├── page.tsx                      # dashboard
│   │   │   │   ├── products/…                    # search, edit, eligibility, SEO, offers
│   │   │   │   ├── suppliers/…                   # config, priority, feeds, errors
│   │   │   │   ├── orders/…                      # order → POs → shipments → refunds
│   │   │   │   ├── imports/…                     # dry-run, diff report, promote, rollback
│   │   │   │   ├── pricing/…                     # rules, violations
│   │   │   │   ├── merchandising/…               # collections, balance pages, baskets
│   │   │   │   └── content/…                     # /learn editor + review workflow
│   │   │   ├── api/
│   │   │   │   ├── webhooks/stripe/route.ts      # signature-verified, idempotent
│   │   │   │   ├── search/autocomplete/route.ts  # rate-limited
│   │   │   │   └── cron/[task]/route.ts          # Vercel Cron → enqueue only
│   │   │   ├── sitemap.ts · robots.ts · opengraph-image.tsx
│   │   │   └── global-error.tsx · not-found.tsx
│   │   ├── src/components/
│   │   │   ├── ui/                 # accessible primitives (Radix-based)
│   │   │   ├── storefront/         # ProductCard, EligibilityBadge, Facets, CartDrawer…
│   │   │   └── admin/
│   │   ├── src/lib/                # server-only glue: session, rate limit, flags
│   │   ├── src/actions/            # Server Actions → thin wrappers over core services
│   │   ├── e2e/                    # Playwright
│   │   └── next.config.ts · tailwind.config.ts
│   │
│   └── worker/                     # PHASE 4+. Always-on, static egress IP.
│       └── src/                    # job queue drain, SFTP polling, EDI transport
│
├── packages/
│   ├── db/
│   │   ├── src/schema/             # Drizzle table definitions (one file per domain)
│   │   ├── migrations/             # plain .sql, reviewable, checked in
│   │   ├── src/repositories/       # the ONLY place SQL is written
│   │   ├── src/seed/demo/          # ~40 demo products, mock suppliers (is_demo = true)
│   │   └── src/seed/purge-demo.ts  # transactional; refuses if real orders reference demo
│   │
│   ├── core/                       # DOMAIN. No React. No Next. No env. No network.
│   │   ├── src/eligibility/        # status model, display rule, disclaimers
│   │   ├── src/pricing/            # rule resolution, MAP/margin clamps, violations
│   │   ├── src/routing/            # supplier selection + consolidation (pure)
│   │   ├── src/cart/               # totals, eligible subtotal, validation
│   │   ├── src/orders/             # state machines, splitting, customer-status derivation
│   │   ├── src/catalog/            # ingestion: transform → match → validate → publish
│   │   ├── src/inventory/          # availability derivation across offers
│   │   └── src/baskets/            # Spend My FSA builder (deterministic, seeded)
│   │
│   ├── suppliers/
│   │   ├── src/adapter.ts          # SupplierAdapter interface + SupplierCapabilities
│   │   ├── src/registry.ts         # code → adapter resolution
│   │   ├── src/mock/               # MockSupplierAdapter (failures, partials, backorders)
│   │   ├── src/transport/          # sftp, http, csv/xml/json parsers
│   │   ├── src/edi/                # generic X12 850/855/856/810 scaffolding
│   │   └── src/_templates/         # TODO: REAL SUPPLIER SPECIFICATION REQUIRED
│   │
│   ├── payments/
│   │   ├── src/provider.ts         # PaymentProvider interface
│   │   ├── src/stripe/             # StripePaymentProvider
│   │   └── src/fsa/README.md       # FsaPaymentProvider — INTERFACE ONLY, no impl
│   │
│   ├── search/
│   │   ├── src/provider.ts         # SearchProvider interface
│   │   └── src/postgres/           # PostgresSearchProvider (FTS + trigram)
│   │
│   ├── integrations/
│   │   ├── src/email/              # EmailProvider + Resend adapter + React Email
│   │   ├── src/analytics/          # AnalyticsProvider + GA4 + noop
│   │   ├── src/tax/                # TaxProvider + Stripe Tax adapter
│   │   └── src/shipping/           # ShippingRateProvider + rules-based adapter
│   │
│   ├── config/                     # the ONLY module that reads process.env (Zod-validated)
│   └── shared/                     # Money, Result, ids, errors, redacting logger, types
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SUPPLIER_INTEGRATION.md     # how to add a real distributor adapter
│   ├── PAYMENTS.md                 # incl. the honest FSA/HSA acceptance position
│   ├── DEPLOYMENT.md
│   ├── RUNBOOK.md                  # on-call: failed POs, stuck jobs, bad import rollback
│   └── DECISIONS/                  # ADRs, numbered
│
├── .env.example                    # every variable, no values, with comments
├── PHASES.md · README.md · CHANGELOG.md
├── .github/workflows/ci.yml        # typecheck · lint · unit · integration · e2e · lighthouse
├── package.json · pnpm-workspace.yaml · turbo.json · tsconfig.base.json
```

## Conventions

- **Route prefixes** `/p/`, `/c/`, `/b/` keep product, category and brand namespaces
  from colliding with editorial routes, and make cache/revalidation rules trivial.
  Canonical URLs are set on every indexable page; facet permutations are `noindex`.
- **Server Actions are thin.** They validate input with Zod, check authorisation, call
  one core service, and return. No business logic lives in `apps/web`.
- **`packages/core` has no I/O.** Repositories are passed in. This is what makes the
  routing, pricing and basket algorithms testable without a database or a server.
- **One file per migration, forward-only**, checked in, reviewed as SQL.
- **`is_demo` is a first-class column**, not a naming convention.
