# FSAOutlet — Major Technical and Business Risks

Ordered by expected impact on the November 1, 2026 launch. Risks 1–4 are **business**
risks that no amount of engineering can retire.

---

### 1. Distributor authorisation is the real critical path — and it is outside our control
**Severity: critical · Likelihood: high**

Wholesale healthcare distributors do not open accounts casually. Expect some combination
of: business licensing and credentialing checks, credit approval, minimum volume
commitments, channel restrictions (some prohibit or restrict online/marketplace resale),
and a formal drop-ship programme application that is separate from the wholesale account
itself. Lead times of 4–12 weeks after application are normal; EDI onboarding adds 6–12
weeks *per distributor*.

**Consequence:** the platform can be finished and still be unable to fulfil a single order.

**Mitigation:** run the distributor track in parallel starting now, not after the build.
Apply to more than one. Build against `MockSupplierAdapter` so software progress is
decoupled. Have a fallback: a small number of directly-sourced or wholesaler-lite SKUs
that can be fulfilled by a simpler partner, so launch is not all-or-nothing.

---

### 2. FSA/HSA card acceptance is a compliance programme, not a feature
**Severity: critical · Likelihood: high**

The brand name creates an expectation that FSA cards work at checkout. Meeting it
generally requires appropriate merchant classification, IIAS item-level controls or
qualification under the 90% Rule, SIGIS or equivalent registration, and — crucially — an
acquirer/processor whose authorisation flow carries the eligible-amount field. Stripe's
standard card processing is not that rail.

**Consequence:** launching with "FSAOutlet" branding while only accepting ordinary cards
is legitimate (customers routinely pay by card and reimburse from their FSA), but it must
be communicated honestly or it becomes a consumer-deception and chargeback problem.

**Mitigation:** `FSA_CARD_ACCEPTANCE_ENABLED = false` gates every claim in code. Data
model supports split tender from day one. Start the acquirer/compliance conversation
**now** — it has a longer lead time than the build. Get the launch-day payment copy
reviewed by counsel. **The specific requirements must be confirmed with a qualified
payments/compliance advisor; this plan does not treat them as settled.**

---

### 3. There is no free, authoritative, machine-readable eligibility list
**Severity: critical · Likelihood: high**

Eligibility determinations are the core value proposition and the core liability. The
SIGIS Eligible Product List is the closest thing to an industry standard and requires
paid membership. Distributor feeds may carry an eligibility flag of unknown provenance
and unknown maintenance. Guessing is not an option: mislabelling causes real consumer
harm (a rejected card at the register, a denied claim, a taxable distribution).

**Mitigation:** the schema makes *unverified* the default and makes a source plus a
verification date structurally required before any badge renders. Budget for a licensed
data source. Until one exists, launch with a **small, manually verified catalog** rather
than a large unverified one. Annual re-verification queue built into admin.

---

### 4. Consumer health data law applies to retailers — and is frequently missed
**Severity: high · Likelihood: high**

HIPAA generally does not apply to an ordinary retailer. But Washington's My Health My
Data Act, Nevada's SB 370, and the health-data provisions of several state privacy laws
**do** reach consumer health data held by non-covered businesses. Purchase history for
diabetes, menstrual care, women's health and diagnostics products is squarely within
scope. Washington's statute includes a private right of action and requires a separate
consumer health data privacy policy and distinct consent for collection and sharing.

**Consequence:** shipping a conventional e-commerce privacy policy and a standard ad
pixel on these category pages is a meaningful legal exposure.

**Mitigation:** separate Consumer Health Data Privacy Policy; explicit consent capture
(`customers.health_data_consent_at` exists for this); careful review of what is sent to
GA4 and any ad platform from health-category pages; counsel review before launch.
**Confirm current obligations with counsel — statutes here are new and moving.**

---

### 5. Vercel cannot run the supplier integration layer
**Severity: high · Likelihood: certain**

SFTP polling, VAN/AS2 connections, 100k-row feed imports, and distributor firewall
allow-listing all require long-lived processes and a static egress IP. Serverless
functions provide neither.

**Mitigation:** designed for from day one — durable Postgres job queue plus one small
always-on worker with a static IP (`apps/worker`, Phase 4). This is the primary reason
for the monorepo. Cost is modest (~$20–40/mo). Discovering this in Phase 4 without having
planned for it would cost a week.

---

### 6. Sales tax on medical and OTC products is genuinely hard
**Severity: high · Likelihood: high**

Many states exempt or reduce tax on OTC drugs, medical devices and menstrual products —
and the rules differ by state *and* by product classification. A flat rate is wrong
almost everywhere. Every product needs a correct tax code, and the business needs nexus
registrations wherever it has economic nexus (which drop-shipping can create in
surprising places).

**Mitigation:** `TaxProvider` abstraction + Stripe Tax (or Avalara at scale) + a
mandatory `tax_code` on every product before publish. Engage an accountant on nexus in
Week 1, not Week 6.

---

### 7. Freight and drop-ship fees can eliminate margin on low-ASP items
**Severity: high · Likelihood: high**

A $6 box of bandages with a $4.50 drop-ship fee and $7 of freight is a loss, and a
multi-supplier split multiplies the freight. Our `estimated_shipping_cost` is an estimate
until a real supplier invoice (810) arrives; the gap between estimate and actual is the
single largest silent margin leak in drop-ship retail.

**Mitigation:** landed cost (not unit cost) drives both pricing and routing; the routing
engine actively consolidates to fewer shipments; free-shipping thresholds set from real
landed-cost data; margin floors enforced in code; a reconciliation report comparing
estimated freight to invoiced freight per supplier from Phase 5.

---

### 8. Stale supplier inventory causes oversells
**Severity: medium-high · Likelihood: high**

Feeds are snapshots. Between syncs, a supplier sells out. In drop-ship the customer has
already paid.

**Mitigation:** multi-supplier fallback at routing time (the main defence — if A is out,
B ships); configurable low-stock buffers per supplier; `oversell_rate` tracked from day
one; automated, fast partial refunds with a clear apology email rather than silent delay.

---

### 9. Six weeks, one build track, eight phases
**Severity: high · Likelihood: medium-high**

The plan is achievable but has no slack. Any unplanned week (an integration surprise, a
compliance redirection, illness) consumes the entire buffer.

**Mitigation:** the ordered cut list in `PHASES.md`; weekly exit criteria that make slip
visible on Friday rather than in Week 6; soft-launch framing so the November date is a
readiness milestone, not a marketing commitment.

---

### 10. Regulated-product and claims risk
**Severity: medium-high · Likelihood: medium**

Selling OTC drugs and medical devices online carries obligations: no unapproved
therapeutic claims (FDA/FTC), correct Drug Facts presentation, state-level restrictions
on some items, age gating on others, pseudoephedrine and similar listed-chemical rules,
and recall handling. The `/learn` content programme is a misinformation risk if written
casually.

**Mitigation:** `products.restricted_states` and `age_restricted` in the schema from day
one; product copy restricted to manufacturer-provided factual content; `/learn` articles
gated behind a documented editorial review with a named reviewer and date; a recall
procedure in the runbook. Legal/regulatory review of launch catalog and content.

---

### 11. Multi-supplier splits degrade the customer experience
**Severity: medium · Likelihood: high**

Three boxes, three tracking numbers and three delivery dates from one order generates
support contacts and looks disorganised to a first-time buyer.

**Mitigation:** consolidation is an explicit routing stage, not an afterthought; the
order page presents shipments as one coherent order with clear per-package status;
proactive per-shipment email; supplier identity never surfaced.

---

### 12. Payment capture timing versus supplier rejection
**Severity: medium · Likelihood: medium**

Capturing at order placement means occasionally refunding for items a supplier rejects.
Delaying capture avoids that but collides with Stripe's ~7-day authorisation window when
backorders occur.

**Mitigation:** `payments` tracks authorised and captured amounts separately, so either
policy is supported. Recommendation and trade-off in `DECISIONS_REQUIRED.md` #5.

---

### 13. Returns in drop-ship
**Severity: medium · Likelihood: high**

Returns go to the supplier's facility under the supplier's RMA rules, with restocking
fees and varying windows. Many OTC/medical items are non-returnable once opened for
safety reasons. Policy must be set before launch and stated clearly at checkout.

**Mitigation:** `returns.supplier_rma` and per-item disposition modelled from day one;
written policy is an owner decision (`DECISIONS_REQUIRED.md` #7).

---

### 14. Postgres search will eventually be outgrown
**Severity: low-medium · Likelihood: medium**

Fine to ~100k SKUs. Beyond that, or once merchandisers need synonyms, typo tolerance and
ranking controls daily, a dedicated engine is warranted.

**Mitigation:** `SearchProvider` interface makes this an adapter swap. Defined trigger
thresholds rather than a vague "later".

---

### 15. Image and content rights
**Severity: medium · Likelihood: medium**

Distributor feeds often include image URLs the retailer is not automatically licensed to
republish. Manufacturer copy may be restricted.

**Mitigation:** `product_images.source` is a required enum and the publish validator
rejects `unknown`; written image-licensing terms confirmed per supplier during onboarding
and recorded against the supplier.

---

### 16. Single-maintainer bus factor
**Severity: medium · Likelihood: medium**

**Mitigation:** the documentation set is a deliverable, not a nicety; conventional stack
choices over novel ones; ADRs for every significant decision; a runbook covering the
failure modes that will actually page someone.
