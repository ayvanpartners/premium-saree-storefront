# FSAOutlet — Planning Documents

**Status: PROPOSAL. Awaiting owner approval. No implementation has begun.**

FSAOutlet.com — a U.S. direct-to-consumer e-commerce platform for FSA/HSA-eligible
health products, operated by Ayvan Partners, LLC. Target launch: 2026-11-01.

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 1 | [ARCHITECTURE.md](./ARCHITECTURE.md) | How the system is built and why |
| 2 | [SCHEMA.md](./SCHEMA.md) | Entity diagram and proposed DDL |
| 3 | [REPO_STRUCTURE.md](./REPO_STRUCTURE.md) | Where every kind of code lives |
| 4 | [PHASES.md](./PHASES.md) | Week-by-week plan, exit criteria, cut list |
| 5 | [RISKS.md](./RISKS.md) | The 16 things most likely to go wrong |
| 6 | [DECISIONS_REQUIRED.md](./DECISIONS_REQUIRED.md) | What is needed from the owner, and when |
| 7 | [THIRD_PARTY_SERVICES.md](./THIRD_PARTY_SERVICES.md) | Accounts, services and costs |

## Why these files are in this repository

These documents describe FSAOutlet, which is **unrelated to the
`premium-saree-storefront` project they currently sit in**. They are here only because
the `fsaoutlet` repository could not be created from this session — the Claude GitHub App
installed on the `ayvanpartners` account lacks repository-creation permission
(`403 Resource not accessible by integration`), and `ayvanpartners` is a user account
rather than an organisation.

This folder is self-contained. Once `ayvanpartners/fsaoutlet` exists, move
`planning/fsaoutlet/` to `docs/` in that repository and delete it from here.

## The three things worth knowing before reading further

1. **Six and a half weeks, and the software is not the critical path.** Distributor
   authorisation, eligibility data licensing and payment compliance all have longer lead
   times than the build. See `PHASES.md` §0.
2. **Eligibility defaults to claiming nothing.** A ✓ badge renders only with a dated,
   attributed source. This is enforced in the schema and in one shared display rule, not
   by convention.
3. **Stripe does not make a merchant able to accept FSA/HSA cards.** The architecture
   prepares for that rail — split tender, eligible subtotals, a separate provider
   interface — behind a feature flag that is off, and makes no claim until it is on.
