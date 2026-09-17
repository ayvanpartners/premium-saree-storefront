# FSAOutlet — Decisions Required From the Owner

Grouped by when they block work. **Only the "Blocking Phase 1" items are needed to
start** — everything else can be answered as its phase approaches.

---

## BLOCKING — needed before Phase 1 begins

### 1. Where does the code live?
The `fsaoutlet` repository **could not be created from this session**: the Claude GitHub
App installed on the `ayvanpartners` account does not have repository-creation
permission (`403 Resource not accessible by integration`), and `ayvanpartners` is a user
account, not an organisation.

**Needed:** create `ayvanpartners/fsaoutlet` (private) manually at
<https://github.com/new>, then install/extend the Claude GitHub App on it at
<https://github.com/apps/claude/installations/select_target>. Consider creating a GitHub
**organisation** for Ayvan Partners rather than using a personal account — it makes
staff access, branch protection and future contractor onboarding materially easier.

### 2. Is this plan approved as written?
Specifically: the layering, the supplier-adapter approach, the "unverified renders
nothing" eligibility rule, and the honest-until-enabled position on FSA card acceptance.

### 3. ORM: Drizzle or Prisma?
**Recommendation: Drizzle.** Migrations are plain reviewable SQL — which matters when a
bad migration can corrupt a live catalog — and complex admin reporting queries stay
transparent. Prisma is the more widely known option with a nicer client; it needs
connection-pooling care on serverless. Either works. Say if you have a preference or an
engineer who will inherit this.

### 4. Monorepo or single app?
**Recommendation: pnpm workspace monorepo.** The integration worker is architecturally
required (Risk #5) and must share domain code. A single app is simpler for one week and
more expensive from Phase 4 onward.

### 5. Brand and design direction
Do we have a logo, colour palette, typography, or any brand guidance? If not, I will
define a design system in Phase 2 — clean, modern consumer-health retail, warm and
trustworthy, explicitly not clinical. Please confirm you want me to originate it, or
supply assets.

### 6. Launch catalog scope
How many SKUs and which categories on day one? **Recommendation: 200–500 manually
verified SKUs in 4–6 categories**, not tens of thousands. Eligibility verification is the
bottleneck, and a small trustworthy catalog converts better than a large unverified one.
The platform is built for tens of thousands regardless.

---

## Needed by Phase 3 (Week 3) — checkout

### 7. Payment capture timing
- **(a) Capture at order placement** — simplest, standard retail practice, occasional
  refunds when a supplier rejects. **Recommended for MVP.**
- (b) Authorise at placement, capture at shipment — cleaner in principle, but Stripe
  authorisations expire in ~7 days, which breaks on backorders.

Both are supported by the schema; this is a policy choice.

### 8. Shipping policy
Free shipping threshold? Flat rate? Real-time rates? **Recommendation: flat rate with a
free-shipping threshold set from actual landed-cost data after the first weeks.** Note
that on low-ASP health products, free shipping thresholds are where margin goes to die
(Risk #7).

### 9. Returns policy
Window, who pays return shipping, restocking fees, and — importantly — which categories
are **non-returnable once opened** for safety/hygiene reasons. Needs to be written before
checkout ships, because it must be stated at checkout.

### 10. Tax provider and nexus
**Recommendation: Stripe Tax for MVP.** Also required: an accountant's determination of
where Ayvan Partners has economic nexus, and who assigns product tax codes.

### 11. Stripe account status
Is a Stripe account approved under Ayvan Partners, LLC? Health-adjacent retail sometimes
draws additional underwriting questions. Confirm early.

---

## Needed by Phase 4 (Week 4) — suppliers

### 12. Distributor pipeline status — the most important business question
For each of McKesson, Medline, Cardinal, Meddcare, Concordance, Cencora:
application submitted? account approved? drop-ship programme approved? technical
specification received? Which is most likely to be live first?

**I will not write a single line of distributor-specific code until a real specification
document is in hand.**

### 13. Do we hold any inventory, or is it 100% drop-ship?
Changes whether a warehouse/3PL, a stock ledger and pick-pack flows are needed. The plan
assumes 100% drop-ship.

### 14. EDI transport
If a distributor requires EDI, do we go through a VAN/integration provider (SPS Commerce,
Cleo, TrueCommerce, Stedi) or direct AS2? This has cost and lead-time implications and is
usually dictated by the distributor.

---

## Needed by Phase 5 (Week 5) — pricing and admin

### 15. Eligibility data source and budget
SIGIS membership? A commercial data provider? Manual curation? This is Risk #3 and it has
a real cost. **It gates how large the launch catalog can honestly be.**

### 16. Pricing philosophy
Target gross margin by category, absolute margin floor per order line, and posture on
MAP-restricted items (carry at MAP with thin margin for traffic, or decline to carry?).

### 17. Who operates the store day to day?
Determines which admin roles matter first and how much workflow polish Phase 5 needs.

---

## Needed by Phase 7–8 (Week 6) — launch

### 18. FSA/HSA payment acceptance intent
Are we actively pursuing IIAS/SIGIS certification and an FSA-capable acquirer, and on
what timeline? This does not block launch, but it determines launch-day messaging — and
the messaging needs legal review either way.

### 19. Who reviews `/learn` content?
Health content needs a named reviewer and a dated sign-off. Without one, `/learn` ships
as three conservative, factual, non-advisory pages.

### 20. Legal counsel engaged?
Required before launch: terms of sale, privacy policy, **consumer health data privacy
policy** (Risk #4), returns policy, and review of all eligibility and payment copy.

### 21. Customer service channel
Email only, or a helpdesk tool? Multi-shipment drop-ship orders generate more contacts
than typical retail — plan for it.

### 22. Domain and email
Is `fsaoutlet.com` registered and controlled by Ayvan Partners? Where is DNS hosted? A
sending subdomain (e.g. `mail.fsaoutlet.com`) with SPF/DKIM/DMARC is needed before
transactional email goes live.
