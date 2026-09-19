import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import {
  productCard,
  sectionHead,
  notice,
  badge,
  term,
  sampleTag,
  occasionImage,
  editorialImage,
  editorialCaption
} from '../lib/components.mjs';
import { editorialReference, creditHtml } from '../lib/reference.mjs';
import { homepageEdit, firstSareePicks, productById } from '../data/products.mjs';
import { occasions } from '../data/taxonomy.mjs';
import { BRAND, site, returnsPolicy } from '../data/site.mjs';

const OCCASION_BLURB = {
  'wedding-guest': 'Rich, celebratory, not the bride',
  bridal: 'Heavier weaves, made to keep',
  festive: 'Diwali, Navratri, Eid, Pongal',
  party: 'Evenings and receptions',
  everyday: 'Cotton and linen for real life'
};

export function homePage() {
  const body = html`
    <!-- 3. Hero: one clear primary action. -->
    <section class="hero">
      <div class="hero__media">
        ${raw(
          editorialImage('home-hero', {
            fallback: '/assets/img/editorial/hero.svg',
            width: 1600,
            height: 1000,
            eager: true
          })
        )}
      </div>
      ${raw(
        editorialReference('home-hero')
          ? `<p class="hero__credit">Reference photograph. ${creditHtml(editorialReference('home-hero'))}</p>`
          : ''
      )}
      <div class="container hero__inner">
        <div class="hero__box">
          <p class="eyebrow" style="color:#d7b9bf">Handwoven and contemporary</p>
          <h1>A saree you will still be wearing in twenty years</h1>
          <p>
            Silk, cotton, chiffon, georgette, organza and linen — described honestly, with the weight,
            the sheerness and exactly what is in the parcel stated before you buy.
          </p>
          <div class="hero__ctas">
            <a class="btn btn--on-ink btn--lg" href="${url('/collections/sarees/')}">Shop sarees</a>
            <a class="btn btn--lg" style="--btn-bg:transparent;--btn-fg:#FAF7F2;--btn-bd:#FAF7F2" href="${url(
              '/saree-guide/first-saree/'
            )}">Find your first saree</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Shop by occasion. -->
    <section class="section">
      <div class="container">
        ${raw(
          sectionHead({
            eyebrow: 'Start from the event',
            title: 'Shop by occasion',
            body: 'The occasion decides the weight, the palette and how long you need to be comfortable in it.',
            link: { label: 'All occasions', href: '/collections/occasion/' }
          })
        )}
        <div class="occasion-grid">
          ${occasions.map(
            (o) => raw(`
            <a class="occasion-tile" href="${url(`/collections/${o.id}/`)}">
              ${occasionImage(o.id)}
              <span class="occasion-tile__text">
                <strong>${esc(o.label)}</strong>
                <span>${esc(OCCASION_BLURB[o.id])}</span>
              </span>
            </a>`)
          )}
        </div>
      </div>
    </section>

    <!-- 5. Curated selection, chosen by hand. -->
    <section class="section section--sand">
      <div class="container">
        ${raw(
          sectionHead({
            eyebrow: 'This month',
            title: 'A short, considered edit',
            body: 'Six pieces picked by hand rather than by algorithm — one from each fabric we stock.',
            link: { label: 'Shop all sarees', href: '/collections/sarees/' }
          })
        )}
        <div class="product-grid product-grid--rail">
          ${homepageEdit.map((p, i) => raw(productCard(p, { index: i })))}
        </div>
      </div>
    </section>

    <!-- 6. Ready to wear, explained. -->
    <section class="section">
      <div class="container">
        <div class="editorial">
          <figure>
            ${raw(
              editorialImage('ready-to-wear', {
                fallback: '/assets/img/editorial/ready-to-wear.svg',
                width: 1600,
                height: 1200
              })
            )}
            <figcaption>
              ${raw(
                editorialCaption('ready-to-wear', {
                  photo: 'Reference photograph: a cotton saree worn for an ordinary working day in Mysore. Not a ready-to-wear saree — it stands in until the range is photographed.',
                  illustration: 'Illustration. The pleats are stitched into a fitted waistband with a concealed side zip.'
                })
              )}
            </figcaption>
          </figure>
          <div class="stack-5">
            <div>
              <p class="eyebrow eyebrow--accent">Ready to wear</p>
              <h2 class="h2">Two minutes, instead of twenty</h2>
            </div>
            <p class="lede">
              A traditional saree is six metres of unstitched cloth. It is beautiful, and it takes
              practice. A ready-to-wear saree has the pleats sewn permanently onto a fitted
              waistband with a concealed zip, and the pallu pre-set to the right length.
            </p>
            <p>
              You step into it like a skirt, fasten the zip and pin the pallu once at the shoulder.
              Nothing about the finished look gives it away — the pleats are usually deeper and more
              even than most of us manage by hand.
            </p>
            <ul class="stack-2 small">
              <li><strong>Sized to your waist and hip</strong> — check the chart, because the waistband is fitted.</li>
              <li><strong>Blouse is separate</strong> unless the product page says otherwise.</li>
              <li><strong>Own a saree already?</strong> We can convert it for ${raw('£45')} and about a week.</li>
            </ul>
            <div class="cluster">
              <a class="btn" href="${url('/collections/ready-to-wear/')}">Shop ready to wear</a>
              <a class="link link--arrow" href="${url('/saree-guide/ready-to-wear/')}">How it works</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. Editorial: craft, told without invented heritage. -->
    <section class="section section--ink">
      <div class="container">
        <div class="editorial editorial--flip">
          <figure>
            ${raw(
              editorialImage('weaving-craft', {
                fallback: '/assets/img/editorial/craft.svg',
                width: 1600,
                height: 1200,
                alt: editorialReference('weaving-craft')
                  ? 'A weaver at a handloom in Kanchipuram, Tamil Nadu, with silk warp threads stretched across the frame.'
                  : ''
              })
            )}
            <figcaption style="color:#a8a29a">
              ${raw(
                editorialCaption('weaving-craft', {
                  photo: 'Silk saree weaving on a handloom in Kanchipuram, Tamil Nadu.',
                  illustration: 'Illustration of ikat patterning, where the blur is the evidence of hand work.'
                })
              )}
            </figcaption>
          </figure>
          <div class="stack-5">
            <div>
              <p class="eyebrow" style="color:#d7b9bf">How we describe things</p>
              <h2 class="h2" style="color:var(--ivory)">The blur is the point</h2>
            </div>
            <p class="lede" style="color:#ded7ce">
              In ${raw(
                term(
                  'ikat',
                  'A technique where the threads are tied off and dyed before the cloth is woven, rather than printing or dyeing the finished fabric.',
                  'Because tie-dyed threads can never be lined up perfectly on the loom, every shape has a slightly feathered edge. A print cannot reproduce it.'
                )
              )} the threads are dyed before a single row is woven. When the weaver lines them up on
              the loom they never align exactly, and that tiny drift is what softens every edge.
            </p>
            <p style="color:#ded7ce">
              We say which of our sarees are handloom and which are not, because the difference is
              real and it is most of the price. Where a supplier declares handloom weaving we say so
              and note that we hold the declaration rather than that we audited the loom. Where a
              mill simply described a weave to us, we say that instead. And when a design references
              a tradition without being made in it — a printed saree taking its geometry from Patan
              ${raw(term('patola', 'A double ikat from Patan in Gujarat, where both the warp and weft threads are tie-dyed so the design reads identically on both faces.'))} —
              we call it inspired by, on the product page, in the name.
            </p>
            <div class="cluster">
              <a class="btn btn--on-ink" href="${url('/saree-guide/weaves/')}">Weaves explained</a>
              <a class="link link--arrow" style="color:#f0d9dd;border-color:#8a6a70" href="${url('/about/#sourcing-language')}">
                How we word our claims
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. First-time buyer help, practical rather than decorative. -->
    <section class="section section--sand">
      <div class="container">
        ${raw(
          sectionHead({
            eyebrow: 'Never worn one',
            title: 'Buying your first saree',
            body: 'Four things worth knowing, and four sarees that forgive a first attempt.'
          })
        )}
        <div class="step-list step-list--4 mb-6">
          <div class="step">
            <h3>It is one piece of cloth</h3>
            <p>
              Five and a half to six and a half metres, unstitched. You pleat it at the waist and
              take the loose end — the ${raw(term('pallu', 'The decorated end of the saree, the part that falls over your shoulder.'))} — over your shoulder.
            </p>
          </div>
          <div class="step">
            <h3>You need three things</h3>
            <p>
              The saree, a fitted blouse, and a petticoat to pleat against. We say on every product
              page which of the three is in the parcel and which is not.
            </p>
          </div>
          <div class="step">
            <h3>The blouse piece is flat fabric</h3>
            <p>
              Most sarees include a matching length for a blouse, but it arrives as cloth, not a
              blouse. Add stitching at checkout or use your own tailor.
            </p>
          </div>
          <div class="step">
            <h3>Fabric decides difficulty</h3>
            <p>
              Cotton grips itself and forgives everything. Chiffon slides and needs ten pins. Every
              product page rates draping difficulty out of five.
            </p>
          </div>
        </div>

        <div class="grid grid--2" style="align-items:start;gap:var(--sp-7)">
          <div class="stack-4">
            <h3 class="h3">Four sarees that forgive a first attempt</h3>
            <p class="small muted">
              Light, grippy and quick to pleat. Two of them go in the washing machine, and one is
              ready to wear if you would rather skip draping entirely.
            </p>
            <div class="cluster">
              <a class="btn" href="${url('/saree-guide/first-saree/')}">Answer four questions</a>
              <a class="link link--arrow" href="${url('/saree-guide/draping/')}">How to drape, step by step</a>
            </div>
            ${raw(
              notice(
                `<p><strong>Not sure it will arrive in time?</strong> Every product page shows a delivery
                window calculated from that item's own stock status and any tailoring you add — not a
                generic promise. ${sampleTag('Sample fulfilment data')}</p>`,
                { tone: 'info', iconName: 'truck' }
              )
            )}
          </div>
          <div class="product-grid" style="gap:var(--sp-4)">
            ${firstSareePicks.slice(0, 4).map((p, i) => raw(productCard(p, { index: i })))}
          </div>
        </div>
      </div>
    </section>

    <!-- 9. Reviews. None have been supplied, so none are shown. -->
    <section class="section">
      <div class="container container--narrow">
        ${raw(
          notice(
            `<p><strong>Customer reviews are not shown on this build.</strong></p>
             <p>
               No verified review data was supplied for this demonstration, and inventing testimonials
               for a shop that has never sold anything would be dishonest. The slot is built and
               styled — when a real review platform is connected, verified reviews appear here, on
               collection pages as a rating on each card, and on product pages beneath the
               specification.
             </p>
             <p class="xs">Integration still to be connected: reviews. See the <a href="${url(
               '/demo-notice/'
             )}">demonstration notice</a> for the full list.</p>`,
            { tone: 'accent', iconName: 'info', heading: null }
          )
        )}
      </div>
    </section>

    <!-- Service reassurance, verifiable statements only. -->
    <section class="section section--tight" style="border-top:1px solid var(--rule)">
      <div class="container">
        <div class="grid grid--3">
          <div class="stack-2">
            <span style="color:var(--wine)">${raw(icon('truck', { size: 28 }))}</span>
            <h3 class="h4">Delivery from Leicester</h3>
            <p class="small muted">
              Standard tracked delivery is ${raw('£3.95')}, free over ${raw('£150')}. Order before
              ${site.dispatch.cutoffLabel} on a working day and in-stock items leave the same day.
              ${raw(sampleTag('Sample'))}
            </p>
            <a class="link link--arrow small" href="${url('/delivery/')}">Delivery detail</a>
          </div>
          <div class="stack-2">
            <span style="color:var(--wine)">${raw(icon('refresh', { size: 28 }))}</span>
            <h3 class="h4">Free 30-day returns</h3>
            <p class="small muted">
              Unworn, tags on, prepaid label in the box. Tailored and stitched items are the
              exception, and we say so before you add them, not after. ${raw(sampleTag('Sample'))}
            </p>
            <a class="link link--arrow small" href="${url('/returns/')}">What can be returned</a>
          </div>
          <div class="stack-2">
            <span style="color:var(--wine)">${raw(icon('scissors', { size: 28 }))}</span>
            <h3 class="h4">Stitching and finishing</h3>
            <p class="small muted">
              Blouse stitching from ${raw('£35')}, fall and pico ${raw('£12')}, ready-to-wear
              conversion ${raw('£45')}. Each one shows its own lead time before you choose it.
            </p>
            <a class="link link--arrow small" href="${url('/saree-guide/tailoring/')}">Tailoring explained</a>
          </div>
        </div>
      </div>
    </section>
  `;

  return page({
    title: null,
    description:
      'Handwoven and contemporary sarees delivered across the United Kingdom. Silk, cotton, chiffon, georgette, organza and linen, with honest fabric detail, clear delivery dates and free 30-day returns.',
    path: '/',
    body,
    pageData: 'home',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND,
      inLanguage: 'en-GB',
      description: site.tagline
    }
  });
}
