# FSAOutlet — Third-Party Services and Accounts Required

Costs are rough order-of-magnitude for planning only; verify current pricing before
committing. "When" refers to the phase in `PHASES.md`.

---

## Required before Phase 1

| Service | Purpose | When | Indicative cost |
|---|---|---|---|
| **GitHub** (org recommended) | Source control, CI, branch protection | Now | Free–$4/user/mo |
| **Domain + DNS** — `fsaoutlet.com` | Brand, email auth | Now | ~$15/yr + Cloudflare free |
| **Vercel** (Pro) | Web hosting, ISR, image optimisation, cron | Phase 1 | ~$20/user/mo + usage |
| **Supabase** (Pro) | Postgres, Auth, Storage, **PITR backups** | Phase 1 | ~$25/mo + usage |

> Supabase Free tier has no point-in-time recovery. For a system holding orders and
> payments, Pro is a launch requirement, not an upgrade.

---

## Required before Phase 3 (checkout)

| Service | Purpose | Indicative cost |
|---|---|---|
| **Stripe** | Card processing, Payment Element, Radar fraud | 2.9% + $0.30; Radar included |
| **Stripe Tax** *(or Avalara / TaxJar)* | Sales tax calculation on medical/OTC | ~0.5% of transactions |
| **Resend** *(or Postmark / SendGrid)* | Transactional email | Free tier → ~$20/mo |
| **Sentry** | Error monitoring | Free → ~$26/mo |

Also required: **business bank account and EIN under Ayvan Partners, LLC** for Stripe
payouts, and state **sales-tax registrations** wherever nexus exists (accountant-led).

---

## Required before Phase 4 (suppliers)

| Service | Purpose | Indicative cost |
|---|---|---|
| **Worker host with static egress IP** — Fly.io / Railway / Render | SFTP polling, EDI transport, long imports, distributor firewall allow-listing (Risk #5) | ~$20–40/mo |
| **Upstash Redis** *(or equivalent)* | Rate limiting, distributed locks | Free → ~$10/mo |
| **Distributor wholesale accounts** | The actual product supply | Application + credit terms; possible minimums |
| **EDI VAN / integration provider** — SPS Commerce, Cleo, TrueCommerce, Stedi | Only if a distributor mandates EDI; usually their choice, not ours | $100s–$1,000s/mo + per-document fees |
| **AfterShip / EasyPost / Shippo** | Normalising carrier detection and delivery events across suppliers' raw tracking numbers | ~$10–100/mo |

> The EDI line item is the one most likely to surprise on cost. Confirm the transport
> requirement with each distributor before budgeting.

---

## Required before Phase 5–6

| Service | Purpose | Indicative cost |
|---|---|---|
| **Eligibility data source** — SIGIS membership or commercial provider | FSA/HSA eligibility with real provenance (Risk #3) | Membership fees; **must be confirmed** |
| **Address validation** — Smarty / USPS / EasyPost | Fewer failed drop-ship deliveries | ~$0.01/lookup |
| **Product imagery** | Placeholder/generated for demo; licensed or own photography for real catalog | Varies |

---

## Required before launch (Phase 7–8)

| Service | Purpose | Indicative cost |
|---|---|---|
| **GA4** | Analytics (behind `AnalyticsProvider`) | Free |
| **Vercel Analytics / Speed Insights** | Real-user Core Web Vitals | ~$10/mo |
| **Uptime monitoring** — BetterStack / Checkly | Availability + synthetic checkout monitoring | Free → ~$30/mo |
| **Consent management** — Osano / Termly / custom | CCPA/CPRA and **WA My Health My Data** consent (Risk #4) | Free → ~$50/mo |
| **Legal counsel** | Terms, privacy, consumer health data policy, eligibility and payment copy review | Project fee |
| **Business + product liability insurance** | Selling OTC drugs and medical devices | Broker quote |
| **Helpdesk** — Front / Gorgias / Zendesk | Support (multi-shipment orders generate volume) | ~$20–60/agent/mo |
| **Accounting** — QuickBooks + accountant | Nexus, COGS, margin reconciliation | ~$30/mo + fees |

---

## Future / conditional

| Service | Trigger |
|---|---|
| **FSA-capable acquirer / processor + SIGIS certification** | Only if pursuing true FSA card acceptance (Risk #2) — long lead time, start early |
| **Typesense / Algolia / Meilisearch** | >100k SKUs, >100 QPS search, or daily merchandiser ranking control (Risk #14) |
| **Cloudinary / imgix** | If Vercel image optimisation costs exceed a dedicated CDN at catalog scale |
| **Reviews platform** — Okendo / Yotpo | When the rating filter in the brief is implemented |
| **Klaviyo** or similar | Lifecycle/marketing email (distinct from transactional) |
| **Doppler / 1Password Secrets** | When more than 2–3 people need managed access to credentials |
| **3PL / warehouse** | Only if the business stops being 100% drop-ship (Decision #13) |

---

## Rough monthly run-rate

| Stage | Estimate |
|---|---|
| Development (Phases 1–3) | **~$70–100/mo** |
| Supplier integration (Phase 4+) | **~$120–200/mo**, excluding EDI VAN |
| At launch | **~$250–400/mo**, excluding EDI VAN, eligibility data licensing, legal and insurance |

The three genuinely open-ended costs are **EDI transport**, **eligibility data
licensing**, and **legal review**. All three should be priced before they become
launch-blocking.
