# FSAOutlet — Phased Implementation Plan

**Today: 2026-09-17. Target launch: 2026-11-01. That is 6 weeks and 3 days.**

---

## 0. The calendar reality check — read this first

The brief describes eight phases covering a full multi-supplier commerce platform. Six
and a half weeks is aggressive but achievable for the **software**, provided scope
discipline holds and the "cut list" below is respected.

**The software is not the critical path. The business gates are.** FSAOutlet cannot
accept a real customer order on 2026-11-01 unless *all* of these are also true:

| Gate | Owner | Typical lead time | Status |
|---|---|---|---|
| Authorized reseller account with ≥1 distributor, drop-ship enabled | Business | 4–12 weeks after application | Not confirmed |
| That distributor's technical spec received (feed + PO transport) | Business | Weeks after account | Not received |
| EDI/API onboarding + certification with that distributor | Both | 6–12 weeks per distributor | Not started |
| Verified eligibility data source licensed | Business | Weeks; has a cost | Not decided |
| Stripe account approved under Ayvan Partners, LLC | Business | Days | Unknown |
| Sales-tax nexus registrations + product tax codes | Accountant | Weeks | Not started |
| Legal review: terms, privacy, **consumer health data policy** | Counsel | 2–4 weeks | Not started |

**Recommended framing:** treat 2026-11-01 as **"platform launch-ready"** — the software
is production-grade, tested, and can take real money the day the first distributor
account and eligibility data land. Plan a **soft launch** (limited catalog, invited
traffic, real orders at low volume) rather than a full public launch, and hold the
marketing push until fulfilment has been proven end-to-end with real POs.

If a distributor account will not exist by November, the November milestone should be a
**waitlist/coming-soon storefront** with the full platform behind it, not a store that
cannot fulfil.

---

## Weekly calendar

| Week | Dates | Phase | Milestone |
|---|---|---|---|
| 1 | Sep 17 – Sep 27 | **Phase 1** Foundation | Schema live, auth working, 40 demo products browsable in dev |
| 2 | Sep 28 – Oct 4 | **Phase 2** Storefront | Public catalog: home, categories, PDP, search, cart |
| 3 | Oct 5 – Oct 11 | **Phase 3** Checkout | Real Stripe test orders end-to-end, accounts, emails |
| 4 | Oct 12 – Oct 18 | **Phase 4** Suppliers | Order splits into POs via MockSupplierAdapter; shipments/tracking |
| 5 | Oct 19 – Oct 25 | **Phase 5 + 6** Admin, Pricing, Spend My FSA | Business is operable without a developer |
| 6 | Oct 26 – Nov 1 | **Phase 7 + 8** SEO, perf, security, hardening | Launch checklist green |

Phases 5 and 6 run in the same week because both are largely additive UI over
already-built services. **This is the week most likely to slip** — see the cut list.

---

## PHASE 1 — Foundation (Week 1)

**Build**
- pnpm workspace, Next.js app, strict TS, Tailwind, ESLint with boundary rules, CI.
- `packages/config`: Zod-validated env, fail-fast at boot. `.env.example` complete.
- Full schema from `SCHEMA.md` as reviewable SQL migrations. Seed script.
- Supabase Auth: customer sign-up/login/reset. `admin_users` RBAC + MFA enforcement.
- `packages/shared`: `Money`, `Result`, redacting logger, id generation.
- Eligibility model + the single display rule + disclaimer module.
- ~40 demo products across all 15 categories, 3 mock suppliers, multi-offer products,
  all `is_demo = true`; `demo:purge` script with the referential safety check.

**Exit criteria** — `pnpm typecheck && pnpm lint && pnpm test` green in CI · a migration
applies to a clean database and the seed runs · a non-admin cannot reach `/admin` ·
`demo:purge` removes every seeded row and refuses when a real order references one ·
no secret in the repo (gitleaks in CI).

---

## PHASE 2 — Storefront, search, cart (Week 2)

**Build**
- Design system: type scale, colour tokens (contrast-verified), spacing, components.
  Mobile-first. Clean, modern, consumer-retail — not clinical, not a template.
- Header (logo, prominent search, Account, Orders, Cart) + primary nav
  (Shop · Categories · Brands · FSA Eligible · HSA Eligible · Deals · Spend My FSA · Learn).
- Home, category (SSR + ISR + facets), brand, product detail page with the full content
  set, gallery, eligibility indicator + "Why is this eligible?" disclosure, availability,
  related / frequently-bought-together.
- `PostgresSearchProvider`: full-text, facets, autocomplete, barcode lookup.
- Cart: totals, quantity, **FSA/HSA eligible subtotal displayed**, persistence for guest
  and signed-in users.

**Exit criteria** — LCP < 2.0s on a throttled mobile profile for home/category/PDP ·
search returns in < 200ms p95 against a 50k-row synthetic catalog · zero `axe`
violations on the four core templates · full keyboard path from home to cart · an
`unverified` product renders **no** eligibility claim anywhere.

---

## PHASE 3 — Checkout, orders, accounts (Week 3)

**Build**
- `PaymentProvider` + `StripePaymentProvider`. Payment Element. Guest + account checkout.
- Address collection/validation, `TaxProvider` and `ShippingRateProvider` abstractions
  with a rules-based shipping adapter and Stripe Tax.
- Order creation transactional with payment confirmation; webhook handler with signature
  verification and `webhook_events` idempotency.
- `EmailProvider` + order confirmation, password reset. Email sending via job queue.
- Account area: orders, order detail, tracking, addresses, reorder.
- Guest order lookup by order number + email.

**Exit criteria** — E2E: browse → cart → guest checkout → paid order → confirmation email ·
replaying a Stripe webhook creates no duplicate order · a failed payment leaves no
partial order · card data never reaches our servers or logs.

---

## PHASE 4 — Supplier abstraction, splitting, POs (Week 4)

**Build**
- `SupplierAdapter` interface + `SupplierCapabilities` + registry.
- `MockSupplierAdapter` with configurable latency, rejection, partial shipment,
  backorder and inventory drift.
- Deterministic routing engine (5 stages) + `routing_policies` + admin pin + persisted
  `routing_trace`.
- Order splitting → `supplier_orders` with PO numbering (`10034-MCK-1`) and idempotency keys.
- Outbox + `jobs` queue; **`apps/worker` stood up** with a static egress IP.
- Shipment ingestion → multiple shipments/tracking per order; partial shipment, backorder,
  rejection, cancellation, partial refund, return/RMA flows.
- Customer-facing status derivation (one coherent order, suppliers invisible).
- Generic EDI 850/855/856/810 scaffolding + SFTP transport + `_templates/` adapter skeleton.
- `SUPPLIER_INTEGRATION.md`.

**Exit criteria** — a 3-line order across 2 suppliers produces exactly 2 POs, 3 shipments
and 3 tracking numbers, and the customer sees one order · a supplier rejection triggers a
correct partial refund automatically · routing is provably deterministic (property test:
same inputs → same plan, 1000 iterations) · retrying a PO submission never double-orders ·
supplier identity appears in no customer-facing surface (asserted in tests).

---

## PHASE 5 + 6 — Admin, pricing, inventory, ingestion, Spend My FSA (Week 5)

**Build (Phase 5)**
- Admin dashboard: revenue, orders, AOV, gross margin/profit, POs awaiting submission,
  supplier failures, low-margin products, out-of-stock, catalog errors, match queue.
- Product management (search, edit, eligibility with source+date required, pricing,
  offers, images, SEO, activate/deactivate). Supplier management. Order management with
  refunds and returns.
- Pricing engine + rules UI + margin violation alerts + price history.
- Inventory sync scheduling + availability derivation + oversell metric.
- Catalog ingestion pipeline: dry-run, diff report, blast-radius halt, promote, rollback,
  error logs, match queue.

**Build (Phase 6)**
- Spend My FSA: balance entry → persona → needs → three baskets → add entire basket /
  customize. Guardrails enforced and tested.
- Shop by Balance landing pages (Under $25/$50, Spend $100/$250/$500, custom), SEO-ready
  and merchandisable from admin. Deals. Collections.

**Exit criteria** — a non-developer can add a supplier, import a feed in dry-run, read the
diff, promote it, fix a price rule and publish a product without touching code · an import
that would deactivate >20% of a supplier's SKUs halts for approval · basket builder is
deterministic and never exceeds the stated balance (property-tested) · rollback of an
import restores prior values exactly.

---

## PHASE 7 + 8 — SEO, analytics, security, hardening (Week 6)

**Build**
- Canonical URLs, product + breadcrumb JSON-LD, XML sitemap (paginated), robots.txt,
  OpenGraph, server-rendered category copy, `/learn` article system with an editorial
  review gate. Redirects table.
- `AnalyticsProvider` + GA4; all required events; `purchase` fired server-side from the
  webhook.
- Remaining transactional emails (shipment, partial shipment, delivery, cancellation,
  refund).
- Security pass: rate limits, RBAC audit, RLS verification, webhook hardening, log
  redaction verification, dependency audit, security headers/CSP, admin MFA enforcement.
- Performance pass: ISR + on-demand revalidation, image formats, client-JS budget,
  query plans reviewed against a 50k-row catalog.
- Accessibility audit against WCAG 2.1 AA, keyboard + screen-reader pass.
- Test suite completion (see below), runbook, load smoke test.

**Exit criteria (launch gate)** — all tests green · Lighthouse ≥ 95 perf / 100 a11y on
home, category, PDP · no critical/high dependency vulnerabilities · no secret in git
history · PITR backups verified by an actual restore drill · `FSA_CARD_ACCEPTANCE_ENABLED`
is `false` and no FSA-payment claim appears anywhere in the rendered site · legal pages
published and reviewed.

---

## Required test coverage (cumulative, per the brief)

| Area | Level | Phase |
|---|---|---|
| Product search + facets + autocomplete | integration | 2 |
| Cart totals + eligible subtotal | unit | 2 |
| Checkout happy path + failure paths | E2E | 3 |
| Stripe webhook: signature, idempotency, replay | integration | 3 |
| Supplier routing (incl. determinism property test) | unit | 4 |
| Order splitting into POs | integration | 4 |
| Supplier PO creation + idempotent retry | integration | 4 |
| Inventory fallback (A out → B ships) | integration | 4 |
| Pricing rules, MAP clamp, margin floor, sanity bounds | unit | 5 |
| Import dry-run / blast-radius halt / rollback | integration | 5 |
| Spend My FSA basket building + guardrails | unit (property) | 6 |
| Eligibility display rule (never claims when unverified) | unit + E2E | 1, 8 |
| Supplier identity never leaks to customer surfaces | E2E | 4, 8 |

---

## Per-phase definition of done

At the end of every phase, without exception:

1. `pnpm lint` clean
2. `pnpm typecheck` clean (strict)
3. `pnpm test` (unit + integration) green
4. `pnpm test:e2e` green for that phase's flows
5. Phase section appended to `CHANGELOG.md`
6. Logical, reviewable commits pushed

**No phase advances with a failing test.** If a test cannot be made to pass, the phase
stops and the blocker is escalated rather than deferred.

---

## Cut list — in this order, if Week 5 or 6 slips

Cutting from the top costs the least. Nothing below is on the critical path to taking a
first real order.

1. `/learn` content system → ship 3 hand-written static pages instead
2. Frequently-bought-together → related-products only
3. Returns **self-service UI** → ops handles RMAs in admin (model stays)
4. Reorder, saved addresses → keep order history only
5. Brand landing pages → brand filter only
6. Shop by Balance → keep 3 fixed pages, drop custom-amount page
7. Spend My FSA → single suggested basket instead of three
8. Admin content/merchandising editors → seed via script

**Never cut:** eligibility correctness, payment/webhook integrity, order splitting
correctness, import safety rails, security, accessibility of the purchase path.
