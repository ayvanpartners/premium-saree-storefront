import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { productCard, breadcrumb, sectionHead, notice, emptyState, sampleTag, occasionImage } from '../lib/components.mjs';
import { products, collections } from '../data/products.mjs';
import { fabrics, weaves, occasions, colourFamilies, stockStates } from '../data/taxonomy.mjs';

const PRICE_BANDS = [
  { id: '0-95', label: 'Under £95', min: 0, max: 9500 },
  { id: '95-195', label: '£95 to £195', min: 9500, max: 19500 },
  { id: '195-395', label: '£195 to £395', min: 19500, max: 39500 },
  { id: '395-9999', label: '£395 and above', min: 39500, max: Infinity }
];

export const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest first' },
  { id: 'price-asc', label: 'Price, low to high' },
  { id: 'price-desc', label: 'Price, high to low' },
  { id: 'delivery', label: 'Quickest to arrive' },
  { id: 'ease', label: 'Easiest to drape' },
  { id: 'name', label: 'Name, A to Z' }
];

function count(items, predicate) {
  return items.filter(predicate).length;
}

/** One filter group. Counts are real: they come from the products in
 * this collection, so a facet showing 0 is honestly disabled rather
 * than leading somewhere empty. */
function filterGroup({ id, legend, hint, options, open = true, type = 'checkbox' }) {
  const live = options.filter((o) => o.count > 0);
  if (!live.length) return '';
  return html`
    <details class="filter-group"${raw(open ? ' open' : '')}>
      <summary>
        ${legend}
        <span class="visually-hidden">filter group</span>
      </summary>
      <div class="filter-group__body">
        ${raw(hint ? `<p class="filter-group__hint">${esc(hint)}</p>` : '')}
        <fieldset class="fieldset">
          <legend class="visually-hidden">${esc(legend)}</legend>
          ${options.map((o) =>
            raw(
              type === 'swatch'
                ? `<label class="filter-swatch${o.id === 'multi' ? ' filter-swatch--multi' : ''}">
                     <input type="${type === 'swatch' ? 'checkbox' : type}" name="${id}" value="${esc(o.id)}"${
                       o.count === 0 ? ' disabled' : ''
                     }>
                     <span class="filter-swatch__dot"${o.hex ? ` style="--swatch-colour:${esc(o.hex)}"` : ''}></span>
                     <span>${esc(o.label)} <span class="check__count">(${o.count})</span></span>
                   </label>`
                : `<label class="check">
                     <input type="checkbox" name="${id}" value="${esc(o.id)}"${o.count === 0 ? ' disabled' : ''}>
                     <span class="check__text">${esc(o.label)} <span class="check__count">(${o.count})</span>${
                       o.note ? `<span class="check__note">${esc(o.note)}</span>` : ''
                     }</span>
                   </label>`
            )
          )}
        </fieldset>
      </div>
    </details>
  `;
}

function filterForm(items, action) {
  const occOpts = occasions.map((o) => ({
    id: o.id,
    label: o.label,
    note: o.plain,
    count: count(items, (p) => p.occasions.includes(o.id))
  }));
  const fabOpts = fabrics.map((f) => ({
    id: f.id,
    label: f.label,
    note: f.ease,
    count: count(items, (p) => p.fabric === f.id)
  }));
  const colOpts = colourFamilies.map((c) => ({
    id: c.id,
    label: c.label,
    hex: c.hex,
    count: count(items, (p) => p.colour.family === c.id)
  }));
  const priceOpts = PRICE_BANDS.map((b) => ({
    id: b.id,
    label: b.label,
    count: count(items, (p) => p.price >= b.min && p.price < b.max)
  }));
  const weaveOpts = weaves
    .filter((w) => w.id !== 'none')
    .map((w) => ({
      id: w.id,
      label: w.label,
      note: w.region || undefined,
      count: count(items, (p) => p.weave === w.id)
    }));

  return html`
    <form class="filter-form" id="filters" method="get" action="${url(action)}" data-filter-form>
      <div class="split" style="margin-bottom:var(--sp-3)">
        <h2 class="h4" style="font-family:var(--font-body);font-size:var(--step--1);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)">
          Refine
        </h2>
        <button class="btn btn--sm btn--quiet js-hide" type="submit">Show results</button>
      </div>

      ${raw(
        filterGroup({
          id: 'occasion',
          legend: 'Occasion',
          hint: 'Where you are wearing it decides the weight and the palette.',
          options: occOpts
        })
      )}
      ${raw(
        filterGroup({
          id: 'fabric',
          legend: 'Fabric',
          hint: 'How it will feel, and how easy it is to drape.',
          options: fabOpts
        })
      )}
      ${raw(
        filterGroup({
          id: 'colour',
          legend: 'Colour',
          options: colOpts,
          type: 'swatch'
        })
      )}
      ${raw(filterGroup({ id: 'price', legend: 'Price', options: priceOpts }))}
      ${raw(
        filterGroup({
          id: 'weave',
          legend: 'Weave or regional style',
          hint: 'Only styles we can name are listed. Each one is explained in the guide.',
          options: weaveOpts,
          open: false
        })
      )}

      <details class="filter-group" open>
        <summary>Availability</summary>
        <div class="filter-group__body">
          <fieldset class="fieldset">
            <legend class="visually-hidden">Availability</legend>
            <label class="check">
              <input type="checkbox" name="rtw" value="yes" />
              <span class="check__text">
                Ready to wear <span class="check__count">(${count(items, (p) => p.readyToWear && p.type === 'saree')})</span>
                <span class="check__note">Pre-pleated and stitched, no draping needed</span>
              </span>
            </label>
            <label class="check">
              <input type="checkbox" name="stock" value="in-stock" />
              <span class="check__text">
                In stock now <span class="check__count">(${count(items, (p) => p.stock === 'in-stock' || p.stock === 'low-stock')})</span>
                <span class="check__note">Excludes made-to-order, which adds about two weeks</span>
              </span>
            </label>
            <label class="check">
              <input type="checkbox" name="blouse" value="included" />
              <span class="check__text">
                Blouse piece included
                <span class="check__count">(${count(items, (p) => p.blousePiece.included)})</span>
              </span>
            </label>
          </fieldset>
        </div>
      </details>

      <div class="mt-5 js-hide">
        <button class="btn btn--block" type="submit">Show results</button>
        <a class="btn btn--quiet btn--block mt-2" href="${url(action)}">Clear all filters</a>
      </div>
      <input type="hidden" name="sort" value="featured" data-sort-mirror />
    </form>
  `;
}

export function collectionPage(key) {
  const def = collections[key];
  const items = products.filter(def.filter);
  const action = `/collections/${key}/`;

  const grid = items.length
    ? html`
        <div class="product-grid product-grid--4" data-product-grid>
          ${items.map((p, i) => raw(productCard(p, { index: i, eager: i < 4 })))}
        </div>
        <div class="load-more" data-load-more hidden>
          <p class="load-more__progress">
            Showing <span data-shown>0</span> of <span data-total>${items.length}</span>
          </p>
          <div class="load-more__bar"><span data-progress-bar style="width:0%"></span></div>
          <button class="btn btn--quiet" type="button" data-load-more-btn>Load more</button>
        </div>
      `
    : raw(
        emptyState({
          iconName: 'bagEmpty',
          title: 'Nothing in this collection yet',
          body: 'We are still weaving this one. In the meantime, everything we stock is in one place.',
          actions: [{ label: 'Shop all sarees', href: '/collections/sarees/' }]
        })
      );

  const body = html`
    <div class="container collection-head">
      ${raw(
        breadcrumb([
          { label: 'Home', href: '/' },
          { label: 'Collections', href: '/collections/sarees/' },
          { label: def.title }
        ])
      )}
      <h1 class="h1">${def.title}</h1>
      <p class="lede mt-3">${def.strapline}</p>
      <p class="small muted mt-3" style="max-width:62ch">${def.intro}</p>
    </div>

    <div class="container">
      <!-- Filtering is done in the browser, so without JavaScript the
           controls would look functional and do nothing. Rather than
           leave a dead form on the page, we hide it and offer the
           collections that exist as real, separately-generated pages. -->
      <noscript>
        <style>
          .filter-rail,
          .filter-open,
          .sort-select,
          label[for='sort'],
          .load-more {
            display: none !important;
          }
        </style>
        <div class="mb-6">
          ${raw(
            notice(
              `<p><strong>Filtering and sorting need JavaScript, which is switched off.</strong></p>
               <p>
                 Everything in this collection is listed below, and every product page works
                 normally. These collections are separate pages, so they still narrow things down:
               </p>
               <p>
                 <a href="${url('/collections/wedding-guest/')}">Wedding guest</a> ·
                 <a href="${url('/collections/bridal/')}">Bridal</a> ·
                 <a href="${url('/collections/festive/')}">Festive</a> ·
                 <a href="${url('/collections/party/')}">Party</a> ·
                 <a href="${url('/collections/everyday/')}">Everyday</a> ·
                 <a href="${url('/collections/ready-to-wear/')}">Ready to wear</a> ·
                 <a href="${url('/collections/new-arrivals/')}">New arrivals</a> ·
                 <a href="${url('/collections/blouses-essentials/')}">Blouses &amp; essentials</a>
               </p>`,
              { tone: 'info', iconName: 'filter' }
            )
          )}
        </div>
      </noscript>

      <div class="collection-layout">
        <aside class="filter-rail" aria-labelledby="filters-heading">
          <h2 class="visually-hidden" id="filters-heading">Filter and refine</h2>
          ${raw(filterForm(items, action))}
        </aside>

        <div>
          <div class="toolbar">
            <p class="toolbar__count" data-result-count aria-live="polite">
              <strong>${items.length}</strong> ${items.length === 1 ? 'piece' : 'pieces'}
            </p>
            <div class="toolbar__right">
              <button class="btn btn--quiet btn--sm filter-open" type="button" data-open-filters aria-expanded="false" aria-controls="filter-drawer">
                ${raw(icon('filter', { size: 16 }))} Filter
                <span class="badge badge--accent" data-active-filter-count hidden>0</span>
              </button>
              <label class="visually-hidden" for="sort">Sort products by</label>
              <select class="select sort-select" id="sort" data-sort>
                ${SORTS.map((s) => raw(`<option value="${s.id}">${esc(s.label)}</option>`))}
              </select>
            </div>
          </div>

          <div class="applied-filters" data-applied-filters aria-live="polite"></div>

          <div data-no-results hidden>
            ${raw(
              emptyState({
                iconName: 'searchEmpty',
                title: 'No pieces match all of those filters',
                body: 'That combination is a little too narrow. Try removing the most specific filter — usually the weave or the price band.',
                actions: [{ label: 'Clear all filters', href: action }],
                suggest: `
                  <h3 class="h4 mb-4">Try loosening one thing</h3>
                  <ul class="stack-2 small" data-suggestions></ul>`
              })
            )}
          </div>

          ${grid}
        </div>
      </div>
    </div>

    <!-- Mobile filter drawer. The form itself is moved in here by JS so
         there is only ever one set of filter controls in the document. -->
    <div class="drawer drawer--bottom" id="filter-drawer" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title" data-drawer>
      <div class="drawer__head">
        <h2 class="drawer__title" id="filter-drawer-title">Filter</h2>
        <button class="icon-btn" type="button" data-close-drawer>
          ${raw(icon('close'))}<span class="visually-hidden">Close filters</span>
        </button>
      </div>
      <div class="drawer__body" data-filter-drawer-body></div>
      <div class="drawer__foot">
        <button class="btn btn--accent btn--block btn--lg" type="button" data-apply-filters>
          Show <span data-drawer-count>${items.length}</span> results
        </button>
        <button class="btn btn--quiet btn--block" type="button" data-clear-filters>Clear all</button>
      </div>
    </div>
  `;

  return page({
    title: def.title,
    description: `${def.strapline} ${def.intro}`.slice(0, 300),
    path: action,
    activeKey: collections[key] && key,
    body,
    pageData: 'collection',
    scripts: ['/assets/js/collection.mjs']
  });
}

/* ------------------------------------------------------------------ *
 * Occasion landing page.
 *
 * The "Occasion" navigation item needs somewhere to go. Pointing it at
 * a second copy of the full saree list would be two URLs with
 * identical content, so this is a chooser: the five occasions, what
 * each one actually means, and a handful of pieces from each.
 * ------------------------------------------------------------------ */
export function occasionLandingPage() {
  const sarees = products.filter((p) => p.type === 'saree');

  const body = html`
    <div class="container collection-head">
      ${raw(
        breadcrumb([
          { label: 'Home', href: '/' },
          { label: 'Shop by occasion' }
        ])
      )}
      <h1 class="h1">Shop by occasion</h1>
      <p class="lede mt-3">Start from where you are wearing it.</p>
      <p class="small muted mt-3" style="max-width:62ch">
        The occasion decides the weight, the palette and how long you need to be comfortable — far
        more than the price does. Pick one and we will narrow the fabrics and weights to suit it.
      </p>
    </div>

    <div class="container">
      <div class="occasion-grid mb-6">
        ${occasions.map(
          (o) => raw(`
          <a class="occasion-tile" href="${url(`/collections/${o.id}/`)}">
            ${occasionImage(o.id)}
            <span class="occasion-tile__text">
              <strong>${esc(o.label)}</strong>
              <span>${esc(sarees.filter((p) => p.occasions.includes(o.id)).length)} pieces</span>
            </span>
          </a>`)
        )}
      </div>
    </div>

    ${occasions.map((o, idx) => {
      const items = sarees.filter((p) => p.occasions.includes(o.id)).slice(0, 4);
      if (!items.length) return '';
      return html`
        <section class="section${idx % 2 === 1 ? ' section--sand' : ''}">
          <div class="container">
            ${raw(
              sectionHead({
                eyebrow: o.label,
                title: o.blurb,
                body: o.plain,
                link: { label: `All ${o.label.toLowerCase()} sarees`, href: `/collections/${o.id}/` }
              })
            )}
            <div class="product-grid product-grid--4">
              ${items.map((p, i) => raw(productCard(p, { index: i })))}
            </div>
          </div>
        </section>
      `;
    })}

    <section class="section">
      <div class="container container--narrow">
        ${raw(
          notice(
            `<p><strong>Shopping to a fixed date?</strong></p>
             <p>
               Every product page shows a delivery window calculated from that item's own stock
               status and any tailoring you add, rather than a generic promise. If the date is
               tight, filter to <a href="${url('/collections/sarees/?stock=in-stock')}">in stock</a>,
               skip fall and pico, and choose named-day delivery at checkout.
             </p>
             <p class="xs">${sampleTag('Sample fulfilment data')}</p>`,
            { tone: 'info', iconName: 'truck' }
          )
        )}
      </div>
    </section>
  `;

  return page({
    title: 'Shop by Occasion',
    description:
      'Wedding guest, bridal, festive, party and everyday sarees — what each occasion calls for, and a selection from each.',
    path: '/collections/occasion/',
    activeKey: 'occasion',
    body
  });
}

export { PRICE_BANDS };
