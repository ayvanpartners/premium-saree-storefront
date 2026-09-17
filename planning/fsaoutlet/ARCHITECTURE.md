# FSAOutlet — Proposed System Architecture

**Operator:** Ayvan Partners, LLC · **Brand:** FSAOutlet.com
**Status:** PROPOSAL — awaiting owner approval. No implementation has started.
**Date:** 2026-09-17 · **Launch target:** 2026-11-01

---

## 0. What this document is

A proposed architecture for a U.S. direct-to-consumer e-commerce platform selling
FSA/HSA-eligible health products, fulfilled by drop-ship from multiple wholesale
healthcare distributors.

It is written to be implementable by a senior engineer who has not been part of these
conversations. Where a real-world specification is unknown (distributor APIs, EDI
envelopes, FSA card acceptance mechanics), this document says so explicitly rather than
inventing one.

**Companion documents:** `SCHEMA.md`, `REPO_STRUCTURE.md`, `PHASES.md`, `RISKS.md`,
`DECISIONS_REQUIRED.md`, `THIRD_PARTY_SERVICES.md`.

---

## 1. The one-paragraph summary

A Next.js (App Router) storefront and admin portal, server-rendered, backed by
PostgreSQL on Supabase. All business logic lives in framework-independent domain
packages, not in React components. Every external dependency the business does not yet
control — distributors, payment rails, eligibility data, tax, shipping, email,
analytics, search — sits behind a narrow interface with a working default
implementation, so the commerce system can be built, tested and demonstrated **today**
and real integrations can be dropped in **later without rewriting anything**.

---

## 2. Architectural principles (in priority order)

1. **Never fabricate external reality.** No invented distributor APIs, no invented
   eligibility data, no implied FSA card acceptance. Unknown spec → interface + mock +
   `TODO: REAL SUPPLIER SPECIFICATION REQUIRED` + a doc entry.
2. **Truthfulness is a product requirement, not a legal afterthought.** Eligibility
   defaults to *unverified* and renders nothing. A claim appears only when it is backed
   by a dated, attributed source.
3. **Deterministic over intelligent.** Routing, pricing, and basket-building are pure,
   seeded, unit-testable functions. No LLM in the transaction path.
4. **The database is the source of truth; the app is a view of it.** Every money-moving
   or catalog-mutating action is transactional, audited, and idempotent.
5. **Reliable over clever.** Given two implementations, ship the boring one.
6. **The customer sees one order.** Supplier fan-out is an internal implementation
   detail and must never leak into the customer experience.

---

## 3. Technology decisions

| Layer | Choice | Rationale | Alternative considered |
|---|---|---|---|
| Framework | **Next.js, App Router** (pin `next@latest` at scaffold; 15+ assumed) | RSC gives server-rendered catalog pages with minimal client JS — directly serves SEO + Core Web Vitals, the two stated business priorities | Remix, Astro+API |
| Language | **TypeScript, `strict: true`**, `noUncheckedIndexedAccess` | Non-negotiable for a money system | — |
| Hosting | **Vercel** (web) + **one always-on worker host** (integrations) | See §9 — Vercel alone cannot do SFTP/EDI/long imports | All-in on a VPS |
| Database | **PostgreSQL via Supabase** | Managed Postgres, PITR backups, Auth, Storage in one vendor | Neon + Clerk |
| DB access | **Drizzle ORM + plain-SQL migrations** | Migrations are reviewable SQL files — critical when a bad migration can corrupt a live catalog. Transparent query shape for admin reporting. Serverless-friendly | Prisma (see `DECISIONS_REQUIRED.md` #3) |
| Auth | **Supabase Auth** (customers) + separate `admin_users` RBAC table (staff, MFA required) | Customer and staff identity have different threat models and must not share a permission surface | Clerk, Auth.js |
| Payments | **Stripe** (Payment Element, SAQ-A) behind a `PaymentProvider` interface | Card rail today; FSA rail is a *different provider*, not a Stripe feature (see `PAYMENTS.md` / §8) | — |
| Search | **Postgres FTS + `pg_trgm`** behind a `SearchProvider` interface | Adequate to ~100k SKUs with no extra vendor, no sync lag, no extra failure mode. Swap to Typesense/Algolia when facets or typo-tolerance become the bottleneck | Algolia from day 1 |
| Styling | **Tailwind CSS** + headless accessible primitives (Radix) | WCAG 2.1 AA needs correct focus/ARIA behaviour we should not hand-roll | — |
| Money | **Integer cents (`bigint`)**, never floats, never `number` arithmetic on prices | — | `numeric(12,2)` |
| Testing | **Vitest** (unit/integration, real Postgres) + **Playwright** (E2E) | — | Jest |
| Repo | **pnpm workspace monorepo** | Domain code must be imported by both the web app and the integration worker. Retrofitting this later is expensive | Single app (see `DECISIONS_REQUIRED.md` #4) |

---

## 4. Layering and dependency rules

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web  — Next.js App Router                             │
│  Server Components · Server Actions · Route Handlers        │
│  Admin portal · Webhooks · Cron entrypoints                 │
└────────────────────────────┬────────────────────────────────┘
                             │  may import ↓ only
┌────────────────────────────┴────────────────────────────────┐
│  packages/core — DOMAIN SERVICES                            │
│  pricing · routing · eligibility · cart · orders ·          │
│  catalog-ingestion · inventory · baskets (Spend My FSA)     │
│  Pure functions where possible. No React. No fetch. No env. │
└──────┬─────────────────────────────┬────────────────────────┘
       │                             │
┌──────┴──────────────┐   ┌──────────┴──────────────────────┐
│ packages/db         │   │ packages/{suppliers,payments,   │
│ schema · migrations │   │ search,integrations}            │
│ repositories        │   │ PORTS + ADAPTERS to the outside │
└─────────────────────┘   └─────────────────────────────────┘
```

**Enforced rules** (lint via `eslint-plugin-boundaries` / `dependency-cruiser`):

- React components **never** import a repository or a raw DB client.
- `packages/core` **never** imports React, Next, `process.env`, or a network client.
  Everything it needs arrives as an argument. This is what makes routing, pricing and
  basket-building exhaustively testable without a server.
- Only `packages/db` writes SQL.
- Only `packages/config` reads `process.env`, and it validates with Zod at boot — a
  missing credential fails the build, not the first customer order.
- Adapters depend on interfaces defined in `core`/`shared`, never the reverse.

---

## 5. Domain services

### 5.1 Eligibility service — *the single most important correctness surface*

Eligibility is not a boolean. The model is:

```ts
type EligibilityStatus =
  | 'eligible'            // eligible as an ordinary OTC/medical purchase
  | 'eligible_with_lmn'   // requires a Letter of Medical Necessity
  | 'rx_required'         // requires a prescription
  | 'not_eligible'
  | 'unverified'          // DEFAULT. Renders nothing in the UI.

type EligibilitySource =
  | 'sigis_epl' | 'distributor_feed' | 'manual_review' | 'unknown'
```

A product renders a ✓ badge **only** when all of the following hold:

```
status === 'eligible'
  AND source !== 'unknown'
  AND verified_at IS NOT NULL
  AND verified_at > now() - interval '365 days'
```

Anything else renders **no eligibility claim at all** — not "may be eligible", not a
greyed badge. Staleness surfaces in admin as a re-verification queue; it never silently
flips a live claim on the storefront. Every change is written to
`product_eligibility_history` with actor and source. FSA and HSA are modelled as
separate fields because the underlying account rules differ.

Disclaimer copy lives in one reviewed module (`core/eligibility/disclaimers.ts`) so
legal can change it in one place. **No tax-treatment claims anywhere.**

### 5.2 Pricing engine

Not `cost × markup`. A deterministic rule resolver:

```
resolvePrice(product, offers, rules, now) →
  { price, compareAt, appliedRules[], violations[], marginPct, marginAbs }
```

Rules are rows (`price_rules`), scoped `global | category | brand | supplier | product`,
resolved most-specific-first, then by explicit `priority`. Rule types: `markup_pct`,
`margin_floor_pct`, `margin_floor_abs`, `fixed_price`, `promo_pct`, `promo_fixed`,
`manual_override`.

Hard constraints applied last, in this order:

1. **MAP floor** — where a MAP applies, the advertised price is never below it. This is
   a contractual obligation to the distributor; violating it can terminate the account.
2. **Margin floor** — if the price required by the margin floor exceeds MSRP, the
   product is flagged `margin_violation` and (by policy) deactivated rather than sold
   at a loss.
3. **Sanity bounds** — reject any computed price outside a configurable multiple of
   cost. A feed error that makes cost `$0.01` must never produce a live `$0.03` listing.

Cost changes arriving from a feed trigger recomputation; violations raise
`margin_violations` rows that appear on the admin dashboard. `product_price_history`
retains every change for audit.

### 5.3 Supplier routing engine

Pure function: `route(lines, offers, policy) → RoutingPlan | RoutingFailure`.

```
Stage 1  HARD FILTERS      supplier active · offer active · drop-ship available ·
                           ships to destination state · MOQ/case-pack satisfiable ·
                           not admin-blocked · inventory OR backorder permitted
Stage 2  LANDED COST       (unit_cost × qty) + dropship_fee + estimated_freight
Stage 3  SCORE             weighted, normalised sum of:
                           landed cost · lead time · reliability · supplier priority ·
                           resulting margin        (weights in `routing_policies`, DB-tunable)
Stage 4  CONSOLIDATION     re-assign lines onto fewer suppliers where the incremental
                           landed cost is under a configurable threshold
                           (fewer shipments = better CX and usually lower total freight)
Stage 5  TIE-BREAK         supplier.priority, then supplier.id ASC  ← fully deterministic
```

Admin can pin a preferred supplier per product (`product_supplier_preferences`), which
short-circuits scoring but **not** the hard filters — a pin must never route to a
supplier that cannot ship the item.

Every decision persists its inputs and per-candidate scores as `orders.routing_trace`
(JSONB). When support asks "why did this ship from three places?", the answer is a
database row, not a re-run.

`RoutingFailure` is a first-class outcome: the order is placed and paid, lines that
cannot be routed go to an ops queue, and a `supplier_routing_failure` analytics event
fires. Customers are not shown a failure at checkout for a condition we can resolve
operationally within hours.

### 5.4 Spend My FSA — basket builder

Deterministic, no LLM. Input: `targetCents`, `personas[]`, `needs[]`, optional seed.

```
1. CANDIDATE POOL   displayable-eligible · active · in stock · unit price ≤ target
                    · category ∈ needs (or essentials when unspecified)
                    · persona-appropriate
2. SCORE            merchandising score = usefulness rank × margin weight
                    × stock depth × review signal (future)
3. THEMES           build N=3 baskets from distinct templates
                    (`basket_templates`, admin-editable), e.g.
                    "Family Medicine Cabinet" (breadth), "First Aid + Diagnostics"
                    (need-focused), "Everyday Essentials" (replenishables)
4. FILL             greedy by score → bounded local-swap refinement to land inside
                    [target × 0.90, target × 1.00]
5. GUARDRAILS       never exceed the stated balance · max 2 units of any SKU ·
                    no near-duplicate SKUs · minimum category diversity
6. DETERMINISM      same inputs + seed → byte-identical output (unit-testable)
```

At catalogue scale, step 1 pre-filters to the top ~300 candidates before step 4, keeping
the search bounded regardless of SKU count.

**Ethical constraint, enforced in code and tested:** the algorithm optimises for a
*useful* basket near the amount, not for consuming the balance. Every result screen
states that unspent balance need not be spent here, and "Customize" is as prominent as
"Add entire basket".

### 5.5 Catalog ingestion pipeline

```
RAW FEED (CSV/JSON/XML/EDI/API)
   │  stored verbatim, checksummed → feed_files + import_records.raw
   ▼
SUPPLIER TRANSFORMER  (per-adapter; the only supplier-specific code)
   ▼
NORMALIZED SUPPLIER PRODUCT  (canonical shape, Zod-validated)
   ▼
IDENTITY MATCH   GTIN-14 (UPC-12 zero-padded)  → high confidence
                 MPN + manufacturer            → medium
                 fuzzy title+brand             → LOW → product_match_queue (human)
   ▼
MASTER PRODUCT  (create only on high confidence; never auto-create on fuzzy)
   ▼
SUPPLIER OFFER  (supplier_products / _prices / _inventory)
   ▼
VALIDATION   required fields · price sanity · image rights · eligibility provenance
   ▼
PUBLISH  (transactional, stamped with import_run_id)
```

**Safety properties:** every run is dry-runnable and produces a diff report before
anything is written; every written row is stamped with its `import_run_id` so a run is
revertible; a run exceeding configurable blast-radius thresholds (e.g. >20% of a
supplier's SKUs deactivated, or >30% price movement) **halts and requires approval**
rather than completing. An unvalidated feed can never silently reach production.

### 5.6 Inventory

`supplier_inventory` is a separate, high-churn table so frequent syncs never lock the
catalog. Product-level availability is *derived* across all live offers:
if Supplier A is out of stock and Supplier B has depth, the product stays purchasable
and routing simply prefers B. Statuses: `in_stock`, `low_stock`, `out_of_stock`,
`backordered`, `unavailable`. Because supplier counts are always somewhat stale, an
`oversell_rate` metric is tracked from day one — it is the leading indicator of
fulfilment pain.

---

## 6. Order architecture

The customer has exactly one order. Internally it fans out.

```
  Customer Order #10034            $184.32   (3 lines)
        │
        ├── Supplier PO 10034-MCK-1   lines A, B     ──→ Shipment (tracking 1Z...)
        │                                            └─→ Shipment (tracking 1Z...)  partial
        └── Supplier PO 10034-CAR-1   line C         ──→ Shipment (tracking 92...)
```

### State machines (explicit, enforced in the service layer)

**Order:** `pending_payment → paid → routing → submitted → partially_shipped →
shipped → delivered` · plus `on_hold`, `cancelled`, `partially_refunded`, `refunded`.

**SupplierOrder:** `draft → ready → submitted → acknowledged → partially_shipped →
shipped → invoiced → closed` · plus `rejected`, `cancelled`, `failed`.

The customer-facing status is a **pure derivation** from internal state
(`deriveCustomerStatus(order, supplierOrders, shipments)`), which is how supplier
mechanics stay invisible. Supplier identity is never exposed in customer UI, emails,
or packing-slip-adjacent surfaces unless a business rule explicitly requires it.

### Reliability mechanics

- **Outbox pattern** for supplier dispatch: committing an order writes an outbox row in
  the same transaction; a worker drains it. A crash between "paid" and "PO sent" cannot
  lose the PO.
- **Idempotency keys** on every supplier submission. A retry never double-orders.
- **Webhook dedupe:** `webhook_events` has a unique constraint on the provider event id;
  Stripe replays are no-ops.
- Supported throughout: partial shipment, backorder, supplier rejection, cancellation,
  partial refund, return, replacement order.

---

## 7. Supplier adapter architecture

```ts
interface SupplierAdapter {
  readonly capabilities: SupplierCapabilities   // declares what this supplier supports

  importCatalog(ctx, opts): AsyncIterable<NormalizedSupplierProduct>
  updateInventory(ctx, opts): AsyncIterable<InventoryUpdate>
  updatePricing(ctx, opts): AsyncIterable<PriceUpdate>

  submitPurchaseOrder(ctx, po): Promise<PoSubmissionResult>   // 850
  getOrderAcknowledgement(ctx, ref): Promise<PoAcknowledgement>  // 855
  getShipmentStatus(ctx, ref): Promise<ShipmentStatus[]>       // 856
  getInvoice(ctx, ref): Promise<SupplierInvoice>               // 810
  cancelOrder(ctx, ref): Promise<CancellationResult>
}
```

**`capabilities` is the key design element.** Distributors will not support the same
workflow. One may offer a REST API with real-time inventory; another drops a nightly
CSV on SFTP and accepts EDI 850 only. The capability descriptor
(`supportsRealtimeInventory`, `supportsCancellation`, `acknowledgementMode:
'sync' | 'async' | 'none'`, `poTransport: 'api' | 'edi' | 'sftp' | 'email'`, …) lets the
order pipeline degrade gracefully per supplier instead of assuming a uniform workflow.

**Shipped in Phase 4:**
- `MockSupplierAdapter` — configurable latency, rejection rates, partial shipments,
  backorders and inventory drift, so the whole fulfilment system is exercisable and
  testable before any real integration exists.
- Generic transport helpers: SFTP poller, CSV/XML/JSON parsers, X12 envelope
  read/write scaffolding for 850/855/856/810.
- `packages/suppliers/_templates/` — a commented skeleton adapter, each unknown marked
  `TODO: REAL SUPPLIER SPECIFICATION REQUIRED`.

**Explicitly NOT shipped:** any fake McKesson / Cardinal / Medline / Cencora /
Concordance / Meddcare client. Those directories will not exist until a signed
specification does. `SUPPLIER_INTEGRATION.md` documents exactly what to ask a
distributor for and where each answer lands in code.

Credentials are **never** in the database and never in the repo. `suppliers.credentials_ref`
stores the *name* of a secret; the value is resolved at runtime from the environment /
secret manager by the worker.

---

## 8. Payment architecture

```ts
interface PaymentProvider {
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>
  capture(ref, amountCents): Promise<CaptureResult>
  refund(ref, amountCents, reason): Promise<RefundResult>
  verifyWebhook(rawBody, signature): WebhookVerification
}
```

- `StripePaymentProvider` — implemented in Phase 3. Stripe Payment Element; card data
  never touches our servers (SAQ-A). Webhook signatures verified against the raw body
  before any parsing.
- `FsaPaymentProvider` — **interface only**, no implementation, no UI, no claims.

### The honest position on FSA/HSA card acceptance

Integrating Stripe does **not** make this merchant capable of accepting FSA/HSA cards.
Accepting them for an online retailer generally requires some combination of:

- appropriate merchant category classification,
- IIAS (Inventory Information Approval System) item-level eligibility controls, or
  qualification under the 90% Rule,
- SIGIS registration/certification or an equivalent applicable program,
- an acquiring/processing arrangement that actually supports the eligible-amount field
  in the authorisation message.

These are underwriting and compliance workstreams with their own timelines, costs and
approval risk — not a code change. **The exact requirements must be confirmed with a
qualified payments/compliance advisor and the chosen acquirer; this document does not
assert them as settled fact.**

### What the architecture does now so the future is cheap

1. **Eligible amounts are computed and persisted everywhere** — `cart_items` and
   `order_items` each snapshot their eligibility at the time of add/purchase, and
   `carts`/`orders` carry an `eligible_subtotal`. The cart already displays it.
2. **`payment_allocations`** maps payment amounts to individual order items, so a single
   order can later be satisfied by two tenders (FSA card for eligible lines, ordinary
   card for the rest) without an order-model migration.
3. **`payments.tender_type`** (`card | fsa_card | hsa_card`) exists from day one.
4. **Feature flag `FSA_CARD_ACCEPTANCE_ENABLED`, default `false`.** While false, no
   FSA-payment UI, badge, or copy renders anywhere. The storefront may say products are
   *FSA-eligible* (a product-attribute claim, when verified); it must not say or imply
   *we accept FSA cards*.

### Capture timing

Proposed for MVP: **authorise and capture at order placement**, with automated partial
refunds within minutes when a supplier rejects or cancels lines. Rationale: Stripe
authorisations expire in ~7 days, which breaks for backorders and slow supplier
acknowledgement. Delayed capture per shipment is architecturally supported (`payments`
tracks `authorized_amount` and `captured_amount` separately) and can be enabled later.
**This is a business decision — see `DECISIONS_REQUIRED.md` #5.**

---

## 9. Async work, jobs and the Vercel constraint

**This is the most under-appreciated architectural risk in the brief.**

Vercel's serverless functions are short-lived, have no static outbound IP, and cannot
hold long-lived connections. Supplier integration needs all three:

| Need | Works on Vercel? |
|---|---|
| Poll an SFTP drop every 15 min | ✗ |
| Ingest a 120k-row catalog CSV | ✗ (execution limits) |
| Connect to a VAN / AS2 endpoint | ✗ |
| Be allow-listed by a distributor's firewall (static egress IP) | ✗ |
| Nightly inventory sync, chunked | ~ (painful) |

**Proposal:** a durable job queue in Postgres (`jobs` table — claim with
`SELECT … FOR UPDATE SKIP LOCKED`, with attempts, backoff and dead-lettering) drained by
**one small always-on worker** (Fly.io / Railway / Render) with a **static egress IP**.
The worker imports the same `packages/*` as the web app — this is the concrete reason
for the monorepo. Vercel Cron can enqueue; it does not execute the heavy work.

Until Phase 4, the worker is not needed and Vercel Cron alone suffices.

---

## 10. Search architecture

`SearchProvider` interface: `search(q, filters, sort, page)`, `autocomplete(prefix)`,
`indexProduct(id)`, `reindexAll()`.

`PostgresSearchProvider` (Phase 2):
- `product_search_index` materialises a weighted `tsvector` — title(A), brand(A),
  category(B), symptom/use tags(B), manufacturer(C), description(D) — plus denormalised
  facet columns and both GTIN and UPC for exact barcode lookup.
- GIN index on the tsvector; `pg_trgm` GIN on title/brand for typo-tolerant autocomplete.
- Barcode input (12–14 digits) short-circuits to exact identifier lookup.
- Facet counts via a single grouped query against the index table.
- Index maintained by trigger + job on product/price/inventory change, not on read.

**Migration trigger:** move to Typesense/Algolia when SKUs exceed ~100k, search exceeds
~100 QPS, or merchandised ranking/synonym management becomes a daily merchandiser task.
Because the interface is narrow, that is an adapter swap, not a rewrite.

---

## 11. Cross-cutting concerns

**Security.** Admin behind RBAC (`owner | admin | merchandiser | ops | support |
readonly`) with MFA required, checked server-side on every request — never by hiding
UI. RLS enabled on customer-owned tables as defence in depth, but the browser never gets
a Supabase client for commerce data; all reads go through the server. Stripe webhooks
verified by signature on the raw body. Rate limits on auth, search, checkout, and
webhooks. A redaction layer in the logger makes it structurally difficult to log PAN,
passwords, tokens or supplier credentials. Full `audit_log` for every admin mutation.

**Performance.** Server components by default; client JS only for cart, search-as-you-type,
gallery and checkout. ISR for product/category pages with on-demand revalidation when
price, eligibility or availability changes. `next/image` with AVIF/WebP. Explicit index
plan in `SCHEMA.md`. Budget: LCP < 2.0s and CLS < 0.05 on a mid-tier mobile device over
4G, enforced in CI via Lighthouse.

**Accessibility (WCAG 2.1 AA).** Semantic HTML first; Radix primitives for anything with
focus semantics; visible focus states; 4.5:1 contrast — notably, the eligibility badge
must not rely on colour alone (✓ + text, never a green dot); every form control labelled;
`axe` assertions in E2E tests; keyboard-complete purchase path as a release gate.

**Analytics.** `AnalyticsProvider` interface, GA4 adapter plus a no-op. Revenue-critical
events (`purchase`) fire **server-side from the Stripe webhook**, not from the browser,
so ad-blockers and abandoned tabs cannot corrupt revenue data. Internal `events` table
mirrors the funnel for first-party analysis.

**Email.** `EmailProvider` interface (Resend proposed) + React Email templates. Order
confirmation, per-shipment confirmation, partial shipment, delivery, cancellation,
refund, password reset, return authorisation. Sending goes through the job queue so a
provider outage delays mail instead of failing checkout.

**Tax & shipping.** `TaxProvider` and `ShippingRateProvider` interfaces. Sales tax on
medical and OTC products varies by state and product class — this requires a real
provider and per-product tax codes, not a hard-coded rate (see `RISKS.md` #6).

---

## 12. Demo data

~40 synthetic products across the 15 required categories, with several products carrying
2–3 mock supplier offers so routing and consolidation are demonstrable.

- Every seeded row carries `is_demo = true`.
- Descriptions are written for this project; imagery is generated placeholders. No
  scraped copy, no scraped images. `product_images.source` records provenance and the
  publish validator rejects any image without an authorised source.
- `pnpm demo:purge` deletes all demo rows in one transaction, and **refuses to run** if
  any non-demo order, payment or supplier PO references them.
