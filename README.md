# [BRAND NAME] — premium saree storefront

A complete, static ecommerce storefront for a premium Indian saree brand selling to the
United Kingdom. 71 pages, no runtime dependencies, no framework, no build toolchain
beyond Node itself.

**This is a demonstration. [BRAND NAME] does not exist, nothing can be bought, no payment
can be taken and no order is created.** Everything invented is listed on the
`/demo-notice/` page and marked in the interface.

---

## Running it

```bash
node build.mjs     # writes dist/
node serve.mjs     # serves dist/ at http://localhost:4330
```

Or `npm run dev` to do both. Node 18 or later; there is nothing to install.

To build for a host that serves from a sub-path:

```bash
BASE_PATH=/repo-name SITE_ORIGIN=https://example.github.io node build.mjs
```

---

## What is in the box

| Area | Pages |
| --- | --- |
| Shopping | Home, 11 collections, 32 product pages, search, wishlist, bag |
| Checkout | Checkout, order confirmation, order tracking, account |
| Guide | Hub plus 10 guides: first saree, anatomy, draping, fabrics, weaves, ready to wear, tailoring, measurements, care, glossary |
| Service and legal | Delivery, returns, contact, about, accessibility, demonstration notice, terms, privacy, cookies, 404 |

Every state is built: loading, empty, error, out-of-stock, unavailable-option, no-results,
payment failure, stock change during checkout, expired session, and success.

---

## How it is built

```
build.mjs            generates dist/ — pages, 535 SVGs, catalogue index, sitemap, robots
serve.mjs            static server for local review (gzip, real 404s)
src/data/            catalogue, taxonomy, site configuration
src/lib/             html helpers, layout, components, imagery, commerce
src/pages/           one module per page type
src/assets/          CSS, client JS, self-hosted fonts
```

Three decisions are worth explaining.

### One commerce module, used twice

`src/lib/commerce.mjs` is imported by the build *and* copied to `dist/assets/js/` and
imported by the browser. Delivery dates, working-day arithmetic, bag totals, VAT,
discount rules, postcode validation and measurement validation are computed by the same
code in both places. A product page, the bag and the checkout cannot disagree with each
other, because there is only one implementation to disagree with.

### Imagery: illustrations, plus labelled reference photographs

No photograph on this site shows the catalogue stock, because the catalogue is fictional.
Two kinds of image are used, and the interface says which is which everywhere they appear.

**Illustrations.** Every product colourway is original vector artwork generated from the
product record — woven grounds, borders, pallu motifs, and stylised drape figures with
deliberately varied body shapes, heights, ages and skin tones. 535 files, 4.2KB average,
generated per colourway so selecting a colour swaps the whole gallery. These are what
product cards, the bag and search show.

**Reference photographs.** `src/assets/img/reference/` holds 40 openly licensed
photographs from Wikimedia Commons, described by `sources.json`: one per catalogue record,
one per occasion tile, three editorial slots. Each is meant to show a *comparable* piece —
a real Banarasi where the catalogue describes one. A product gallery opens with its
reference photograph, labelled "Reference photo, not this item", shown whole on a neutral
ground rather than cropped, and credited in place. Every image, source, creator and
licence is listed on `/image-credits/`, which the CC BY and BY-SA licences require. Remove
the folder and every slot falls back to its illustration; `src/lib/reference.mjs` is the
only code that knows the folder exists.

**Only 19 of the 40 are used.** An open licence makes an image legal to use; it does not
make it the right image. `REJECTED` in `src/lib/reference.mjs` withholds 21 of them with a
one-line reason each, and those slots fall back to the illustration. Three carry another
retailer's branding — a seller's "Rs.4000" price, a shop watermark, Pachaiyappa's Silks'
logo on the homepage hero. Others are simply the wrong thing: a Victorian European
underskirt for a saree petticoat, an 18th-century French court dress for a satin one, a
branded supermarket detergent bottle for the delicate wash, a conference panel photograph
for a ready-to-wear saree. The withheld list and its reasons are published on
`/image-credits/` rather than left as a silent gap. Editing that one object is how you
reinstate or reject an image.

Reference photographs are deliberately kept off product cards and out of the bag: those
surfaces cannot carry the label, and a photograph of somebody else's saree behind an
invented product is a misrepresentation. Several of the photographs show identifiable
people, and an open licence covers the photographer's copyright rather than the subject's
rights — one more reason a real launch needs its own shoot, with model releases.

### Claims are graded, not asserted

"Handloom" adds most of the price of a saree and cannot be verified from a photograph, so
the catalogue carries a `provenance` field with five values — supplier-declared handloom,
mill-described, inspired-by, powerloom, contemporary — and the product page prints the
wording verbatim rather than paraphrasing it into a heritage story. A printed saree that
borrows patola geometry is called *Patola-Inspired* in its own name.

Deliberately absent: sustainability claims, certifications, artisan biographies, scarcity
pressure, countdown timers, and reviews. No verified review data was supplied, so the
review slot is built and left visibly empty rather than filled with invented testimonials.

---

## Testing performed

Driven through a real browser against the built output, not asserted from the source.

**Journeys completed end to end**

1. **First-time buyer** — found an easy-to-wear saree, read what was included, added to bag, completed guest checkout, reached confirmation. Bag cleared, order stored, nothing charged.
2. **Wedding guest to a deadline** — filtered by occasion, colour and budget (14 → 4 → 2 results, counts and URL correct), checked delivery windows per shipping option.
3. **Experienced shopper** — `banarsi` → Banarasi (typo), `kanchipuram` → Kanjivaram (regional spelling), `sari` → saree (synonym), `under £100` → price filter, `light silk` → Chanderi and Kota Doria.
4. **Tailoring with a mistake** — added blouse stitching (£425 → £460, delivery moved 2 Oct → 13 Oct with the reason shown), entered `36` in centimetres, got a unit-mismatch error naming the likely cause, corrected it and added to bag.
5. **Keyboard** — focus moves into drawers, other panels go `inert`, Shift+Tab wraps, Escape closes and returns focus to the trigger, scroll lock releases.
6. **Recovery** — no search results (suggestions plus a correction), out-of-stock product and colour, declined payment (bag intact, no order created, three routes forward), stock running out mid-checkout, expired session, unknown postcode falling through to manual entry, invalid and below-minimum discount codes.

**Automated audits across all 70 sitemap pages**

| Check | Result |
| --- | --- |
| Escaped markup, `[object Object]`, `undefined` in output | 0 (now enforced at build time) |
| Internal links with no generated page | 0 (enforced at build time) |
| Duplicate `id` attributes | 0 |
| Images without `alt` | 0 |
| Images without width and height | 0 |
| Form controls without an accessible name | 0 |
| Buttons or links without an accessible name | 0 |
| Heading-level skips | 0 |
| Horizontal overflow at 320px | 0 |
| Interactive targets under the WCAG 2.2 24×24 minimum | 0 |
| Text contrast below AA (computed, live pages) | 0 of 748 text nodes on home, product and search |

Filters and scroll position are preserved when returning from a product page: the filter
state travels in the URL and the scroll offset in `sessionStorage`, verified restoring to
the exact pixel.

**Bugs this testing found and fixed** — the significant one: nested `html` templates were
being HTML-escaped, which silently emptied every collection grid. It was invisible in the
source and obvious in the output, which is why the build now checks the output.

---

## Performance

Measured as built output, not a lab score.

- **No render-blocking JavaScript.** All scripts are modules and deferred by default.
- **No third-party requests at all.** No analytics, no tag manager, no font CDN, no image CDN. Fonts are self-hosted (SIL OFL) and preloaded.
- **No layout shift from images.** Every `<img>` has explicit `width`/`height`, and every media box has a reserved `aspect-ratio`.
- **Illustrations average 4.2KB**, the largest is 13KB. Reference photographs are 14KB to 700KB WebP and lazy-loaded except the product-gallery lead and the homepage hero; everything else below the fold is `loading="lazy"`.
- Homepage: 79KB HTML, one 79KB stylesheet, two preloaded fonts, one 4KB hero image.
- The search index is fetched lazily on first use, so pages that never search never pay for it.

Core Web Vitals were not measured under field conditions; the structural work that governs
them (no blocking scripts, reserved image dimensions, no third-party requests, small
assets) is in place.

---

## What is sample data

Everything below is invented for this demonstration and describes nothing real. The
interface marks it wherever it could be mistaken for a business fact.

- All 32 products: names, descriptions, prices, compositions, measurements, stock, provenance
- Business identity: the Leicester studio address, email, phone number, VAT number
- Fulfilment: handling times, carriers, transit times, delivery prices, bank-holiday list
- Policies: delivery, returns, terms, privacy and cookies are drafts marked for legal review
- Discount codes, the three sample tracking orders, and seven hard-coded postcodes

## Integrations not connected

Payments · order management · inventory · accounts · address lookup · reviews · email ·
analytics. What stands in for each is set out on `/demo-notice/`.

**No card details are collected anywhere.** The payment step deliberately does not render
a card form — a hosted element from a regulated provider would mount there, and a
realistic-looking card form in a demonstration would be a bad idea.

This build sets **no cookies** and makes **no third-party requests**, which is why there
is no consent banner.

---

## Known limitations

- Neither the illustrations nor the reference photographs show the actual products. The photographs are of comparable pieces, at whatever resolution Wikimedia Commons had — the homepage hero is only 848px square and looks soft at full width.
- No third-party accessibility audit and no testing with assistive-technology users. Automated checks and manual keyboard passes are not a substitute.
- The bag, checkout, wishlist, search and collection filtering need JavaScript. Without it every page still renders and reads; controls that cannot work are hidden rather than left dead, and replaced with links that do.
- `prefers-reduced-motion` handling is implemented in CSS but was not verified in a browser with the setting enabled.
- Colour swatch artwork is derived from a single hex value per colourway, so a variant shows the right colour but not a separately designed pattern.

## Licence

Code is unlicensed and not for production use. Fonts (Fraunces, Instrument Sans) are
under the SIL Open Font License and are redistributed under its terms.
