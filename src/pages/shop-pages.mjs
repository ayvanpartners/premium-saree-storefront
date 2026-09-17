import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { breadcrumb, notice, emptyState, sectionHead, productCard, sampleTag } from '../lib/components.mjs';
import { products, productById, firstSareePicks, collections } from '../data/products.mjs';
import { fabrics, weaves, occasions } from '../data/taxonomy.mjs';
import { fulfilment, returnsPolicy, site } from '../data/site.mjs';
import { formatMoney } from '../lib/commerce.mjs';

/* ------------------------------- Bag ------------------------------ */
export function bagPage() {
  const body = html`
    <div class="container">
      ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Your bag' }]))}
      <h1 class="h1 mb-5">Your bag</h1>

      <div class="checkout-layout">
        <div>
          <div data-bag-empty hidden>
            ${raw(
              emptyState({
                iconName: 'bagEmpty',
                title: 'Your bag is empty',
                body: 'Nothing in here yet. If you were partway through choosing something, it may be on your wishlist.',
                actions: [
                  { label: 'Shop sarees', href: '/collections/sarees/' },
                  { label: 'View wishlist', href: '/wishlist/' }
                ],
                suggest: `<h3 class="h4 mb-4">Easy places to start</h3>
                  <ul class="stack-2 small">
                    <li><a class="link" href="${url('/saree-guide/first-saree/')}">Find your first saree</a> — four questions, then a short list.</li>
                    <li><a class="link" href="${url('/collections/ready-to-wear/')}">Ready to wear</a> — no draping needed.</li>
                    <li><a class="link" href="${url('/collections/everyday/')}">Everyday cotton</a> — from £78, machine washable.</li>
                  </ul>`
              })
            )}
          </div>

          <div data-bag-lines></div>

          <div class="mt-6" data-bag-continue hidden>
            <a class="link link--arrow" href="${url('/collections/sarees/')}">Continue shopping</a>
          </div>
        </div>

        <aside class="checkout-layout__aside" data-bag-summary hidden>
          <div class="order-summary">
            <h2 class="h3">Order summary</h2>
            <ul class="totals" data-totals></ul>

            <div class="mt-5">
              <button class="discount-toggle" type="button" data-discount-toggle aria-expanded="false" aria-controls="discount-field">
                Have a discount code?
              </button>
              <div id="discount-field" hidden>
                <div class="field field--inline mt-2">
                  <div style="flex:1">
                    <label class="field__label" for="discount">Discount code</label>
                    <input class="input" type="text" id="discount" name="discount" autocomplete="off" spellcheck="false" data-discount-input />
                  </div>
                  <button class="btn btn--quiet" type="button" data-discount-apply>Apply</button>
                </div>
                <p class="field__error" data-discount-error data-error-for="discount" hidden></p>
                <p class="field__ok" data-discount-ok hidden></p>
                <p class="xs muted mt-2">
                  Demonstration codes: <code>WELCOME10</code>, <code>FREEPOST</code> (over £50),
                  <code>DRAPE25</code> (over £200). ${raw(sampleTag('Sample'))}
                </p>
              </div>
            </div>

            <div class="mt-5">
              <a class="btn btn--accent btn--block btn--lg" href="${url('/checkout/')}">Go to checkout</a>
              <p class="xs muted mt-3" style="text-align:center">
                ${raw(icon('lock', { size: 13 }))} Guest checkout available. No account needed.
              </p>
            </div>
          </div>

          <div class="mt-5 stack-4">
            ${raw(
              notice(
                `<p><strong>Delivery</strong></p>
                 <p>Standard tracked ${formatMoney(fulfilment.shipping[0].price)}, free over
                 ${formatMoney(fulfilment.shipping[0].freeOver)}. Express and named-day options at
                 checkout. Dispatched from ${site.dispatch.from}.</p>`,
                { tone: 'info', iconName: 'truck' }
              )
            )}
            ${raw(
              notice(
                `<p><strong>${returnsPolicy.summary}</strong></p>
                 <p>Anything we stitch to your measurements is the exception — it is marked on the
                 line item above.</p>`,
                { tone: 'ok', iconName: 'refresh' }
              )
            )}
          </div>
        </aside>
      </div>
    </div>
  `;

  return page({
    title: 'Your bag',
    description: 'Review your bag, edit options and tailoring, and see the full total before checkout.',
    path: '/bag/',
    body,
    pageData: 'bag',
    scripts: ['/assets/js/bag-page.mjs']
  });
}

/* ----------------------------- Wishlist --------------------------- */
export function wishlistPage() {
  const body = html`
    <div class="container">
      ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Wishlist' }]))}
      <div class="split mb-5">
        <div>
          <h1 class="h1">Wishlist</h1>
          <p class="lede mt-3">Saved on this device. No account needed.</p>
        </div>
        <button class="btn btn--quiet btn--sm" type="button" data-clear-wishlist hidden>Clear wishlist</button>
      </div>

      <div data-wishlist-empty hidden>
        ${raw(
          emptyState({
            iconName: 'heartEmpty',
            title: 'Nothing saved yet',
            body: 'Tap the heart on any piece to keep it here while you decide. Your wishlist stays on this device and is not shared with us.',
            actions: [
              { label: 'Shop sarees', href: '/collections/sarees/' },
              { label: 'New arrivals', href: '/collections/new-arrivals/' }
            ]
          })
        )}
      </div>

      <div class="product-grid product-grid--4" data-wishlist-grid></div>

      <div class="mt-7" data-wishlist-suggest hidden>
        ${raw(
          notice(
            `<p><strong>Wishlists live in this browser only.</strong></p>
             <p>
               Because this build has no account system connected, your saved pieces are stored in
               this browser and will not follow you to another device. Clearing your browser data
               clears them. In a live build this would sync to your account.
             </p>`,
            { tone: 'info', iconName: 'info' }
          )
        )}
      </div>
    </div>

    <section class="section">
      <div class="container">
        ${raw(sectionHead({ eyebrow: 'While you decide', title: 'Easy places to start', level: 2 }))}
        <div class="product-grid product-grid--4">
          ${firstSareePicks.map((p, i) => raw(productCard(p, { index: i })))}
        </div>
      </div>
    </section>
  `;

  return page({
    title: 'Wishlist',
    description: 'Pieces you have saved while you decide.',
    path: '/wishlist/',
    body,
    pageData: 'wishlist',
    scripts: ['/assets/js/wishlist.mjs']
  });
}

/* ------------------------------ Search ---------------------------- */
export function searchPage() {
  const popular = ['silk saree', 'Banarasi', 'wedding guest', 'ready to wear', 'cotton', 'organza', 'under £100'];

  const body = html`
    <div class="container">
      ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Search' }]))}

      <h1 class="h1">Search</h1>

      <form class="mt-5" action="${url('/search/')}" method="get" role="search" data-search-page-form>
        <div class="field field--inline">
          <div style="flex:1">
            <label class="field__label" for="q">Search sarees, fabrics, weaves and occasions</label>
            <input
              class="input"
              type="search"
              id="q"
              name="q"
              autocomplete="off"
              spellcheck="false"
              enterkeyhint="search"
              placeholder="Try “Kanjivaram”, “light silk”, “sari for a wedding”"
              data-search-page-input
            />
          </div>
          <button class="btn" type="submit">Search</button>
        </div>
        <p class="small muted mt-2">
          We understand both “saree” and “sari”, and we will usually catch a typo.
        </p>
      </form>

      <div class="mt-6" data-search-page-results>
        <div data-search-idle>
          <h2 class="h3 mb-4">Popular searches</h2>
          <div class="search-suggest mb-6">
            ${popular.map((p) => raw(`<a href="${url(`/search/?q=${encodeURIComponent(p)}`)}">${esc(p)}</a>`))}
          </div>

          <h2 class="h3 mb-4">Or browse</h2>
          <div class="grid grid--3">
            <div>
              <h3 class="h4 mb-3">By fabric</h3>
              <ul class="stack-2 small">
                ${fabrics
                  .slice(0, 6)
                  .map((f) => raw(`<li><a class="link" href="${url(`/collections/sarees/?fabric=${f.id}`)}">${esc(f.label)}</a> — ${esc(f.ease)}</li>`))}
              </ul>
            </div>
            <div>
              <h3 class="h4 mb-3">By occasion</h3>
              <ul class="stack-2 small">
                ${occasions.map(
                  (o) => raw(`<li><a class="link" href="${url(`/collections/${o.id}/`)}">${esc(o.label)}</a> — ${esc(o.blurb)}</li>`)
                )}
              </ul>
            </div>
            <div>
              <h3 class="h4 mb-3">By weave</h3>
              <ul class="stack-2 small">
                ${weaves
                  .filter((w) => w.id !== 'none')
                  .slice(0, 7)
                  .map((w) => raw(`<li><a class="link" href="${url(`/collections/sarees/?weave=${w.id}`)}">${esc(w.label)}</a></li>`))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return page({
    title: 'Search',
    description: 'Search sarees by fabric, weave, occasion, colour and price.',
    path: '/search/',
    body,
    pageData: 'search',
    scripts: ['/assets/js/search-page.mjs']
  });
}

/* ------------------------------ Account --------------------------- */
export function accountPage() {
  const body = html`
    <div class="container container--narrow">
      ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Account' }]))}
      <h1 class="h1">Account</h1>

      <div class="mt-5">
        ${raw(
          notice(
            `<p><strong>Accounts are not connected on this demonstration build.</strong></p>
             <p>
               There is no authentication provider wired up, so there is nothing real to sign in to
               and we are not going to pretend there is. Everything you can do on this site works
               without an account: browse, filter, save a wishlist, and check out as a guest.
             </p>
             <p>
               In a live build this page would hold your orders, saved addresses, stored
               measurements for stitching, and your wishlist synced across devices.
             </p>`,
            { tone: 'info', iconName: 'user' }
          )
        )}
      </div>

      <h2 class="h3 mt-7 mb-4">What you can do without an account</h2>
      <div class="grid grid--2">
        <div class="guide-card" style="cursor:default">
          <h3 class="h3">Track an order</h3>
          <p>Enter an order number and postcode. No account required — this works for guest orders too.</p>
          <a class="btn btn--quiet mt-4" href="${url('/track-order/')}">Track your order</a>
        </div>
        <div class="guide-card" style="cursor:default">
          <h3 class="h3">Your wishlist</h3>
          <p>Saved in this browser. Works without signing in, but will not follow you to another device.</p>
          <a class="btn btn--quiet mt-4" href="${url('/wishlist/')}">View wishlist</a>
        </div>
      </div>

      <div class="mt-6">
        <h2 class="h3 mb-4">Need a hand?</h2>
        <ul class="stack-2">
          <li><a class="link" href="${url('/contact/')}">Contact customer service</a> — email, phone and opening hours.</li>
          <li><a class="link" href="${url('/returns/')}">Start a return</a> — what can go back, and how.</li>
          <li><a class="link" href="${url('/saree-guide/measurements/')}">Measurement guide</a> — before ordering stitching.</li>
        </ul>
      </div>
    </div>
  `;

  return page({
    title: 'Account',
    description: 'Account area. Order tracking and wishlist are available without signing in.',
    path: '/account/',
    body
  });
}

/* ------------------------------- 404 ------------------------------ */
export function notFoundPage() {
  const body = html`
    <div class="container container--narrow" style="padding-block:var(--sp-8)">
      <p class="eyebrow eyebrow--accent">404</p>
      <h1 class="h1 mt-3">We cannot find that page</h1>
      <p class="lede mt-4">
        The link may be out of date, or the piece may have sold out and been retired. Here is where
        most people were heading.
      </p>

      <div class="mt-6 stack-3">
        <a class="btn" href="${url('/collections/sarees/')}">Shop all sarees</a>
      </div>

      <div class="mt-7">
        <h2 class="h3 mb-4">Popular places</h2>
        <ul class="stack-2">
          <li><a class="link" href="${url('/collections/new-arrivals/')}">New arrivals</a></li>
          <li><a class="link" href="${url('/collections/ready-to-wear/')}">Ready to wear</a></li>
          <li><a class="link" href="${url('/saree-guide/')}">Saree guide</a></li>
          <li><a class="link" href="${url('/delivery/')}">Delivery information</a></li>
          <li><a class="link" href="${url('/track-order/')}">Track your order</a></li>
          <li><a class="link" href="${url('/contact/')}">Contact us</a></li>
        </ul>
      </div>

      <div class="mt-7">
        <h2 class="h3 mb-4">Or search</h2>
        <form action="${url('/search/')}" method="get" role="search">
          <div class="field field--inline">
            <div style="flex:1">
              <label class="field__label" for="q404">What were you looking for?</label>
              <input class="input" type="search" id="q404" name="q" autocomplete="off" />
            </div>
            <button class="btn" type="submit">Search</button>
          </div>
        </form>
      </div>
    </div>
  `;

  return page({
    title: 'Page not found',
    description: 'We cannot find that page.',
    path: '/404.html',
    body
  });
}
