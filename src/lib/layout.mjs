/* ------------------------------------------------------------------ *
 * The page shell: head, service strip, header, navigation, search,
 * footer, bag drawer, toast region and the glossary dialog.
 * ------------------------------------------------------------------ */

import { BRAND, site, nav, footer, serviceStrip, paymentMethods, returnsPolicy } from '../data/site.mjs';
import { html, raw, esc, url, icon, attrs } from './html.mjs';

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231C1A19'/%3E%3Cpath d='M6 22c4-2 6-6 6-12M12 22c4-2 6-6 6-12M18 22c4-2 6-6 6-12' stroke='%23FAF7F2' stroke-width='2' fill='none'/%3E%3Cpath d='M4 26h24' stroke='%236E1B2B' stroke-width='3'/%3E%3C/svg%3E";

function serviceStripMarkup() {
  return html`
    <div class="service-strip">
      <div class="container service-strip__inner">
        <ul>
          ${serviceStrip.map(
            (item) => raw(`<li><a href="${url(item.href)}">${esc(item.text)}</a></li>`)
          )}
        </ul>
      </div>
    </div>
  `;
}

function megaPanel(item) {
  if (!item.panel) return '';
  const { columns, feature } = item.panel;
  return html`
    <div class="mega" id="mega-${item.key}" hidden data-mega>
      <div class="container">
        <div class="mega__grid">
          ${columns.map(
            (col) => raw(`
            <div class="mega__col">
              <h3>${esc(col.heading)}</h3>
              <ul>
                ${col.links
                  .map(
                    (l) => `<li><a href="${url(l.href)}"${l.emphasis ? ' data-emphasis' : ''}>${esc(l.label)}${
                      l.hint ? `<span>${esc(l.hint)}</span>` : ''
                    }</a></li>`
                  )
                  .join('')}
              </ul>
            </div>`)
          )}
          ${feature
            ? raw(`
            <div class="mega__feature">
              <h3>${esc(feature.heading)}</h3>
              <p>${esc(feature.body)}</p>
              <a class="btn btn--ghost btn--sm" href="${url(feature.cta.href)}">${esc(feature.cta.label)}</a>
            </div>`)
            : ''}
        </div>
      </div>
    </div>
  `;
}

function headerMarkup(activeKey) {
  return html`
    <header class="site-header" data-header>
      <div class="container site-header__bar">
        <button
          class="icon-btn nav-toggle"
          type="button"
          data-open-drawer="nav-drawer"
          aria-expanded="false"
          aria-controls="nav-drawer"
        >
          ${raw(icon('menu'))}
          <span class="visually-hidden">Menu</span>
        </button>

        <a class="brand" href="${url('/')}">${BRAND}</a>

        <nav class="primary-nav" aria-label="Main">
          <ul>
            ${nav.map((item) =>
              raw(
                item.panel
                  ? `<li>
                      <a class="primary-nav__link" href="${url(item.href)}"
                         ${activeKey === item.key ? 'aria-current="page"' : ''}
                         aria-expanded="false" aria-controls="mega-${item.key}" data-mega-trigger="${item.key}">
                        ${esc(item.label)} ${icon('chevron', { size: 12 })}
                      </a>
                    </li>`
                  : `<li><a class="primary-nav__link" href="${url(item.href)}" ${
                      activeKey === item.key ? 'aria-current="page"' : ''
                    }>${esc(item.label)}</a></li>`
              )
            )}
          </ul>
        </nav>

        <div class="header-actions">
          <button
            class="icon-btn"
            type="button"
            data-search-toggle
            aria-expanded="false"
            aria-controls="search-panel"
          >
            ${raw(icon('search'))}<span class="visually-hidden">Search</span>
          </button>
          <a class="icon-btn icon-btn--account" href="${url('/account/')}">
            ${raw(icon('user'))}<span class="visually-hidden">Account</span>
          </a>
          <a class="icon-btn" href="${url('/wishlist/')}">
            ${raw(icon('heart'))}
            <span class="icon-btn__count" data-wishlist-count data-count="0" aria-hidden="true">0</span>
            <span class="visually-hidden">Wishlist, <span data-wishlist-count-text>0 items</span></span>
          </a>
          <button class="icon-btn" type="button" data-open-drawer="bag-drawer" aria-expanded="false" aria-controls="bag-drawer">
            ${raw(icon('bag'))}
            <span class="icon-btn__count" data-bag-count data-count="0" aria-hidden="true">0</span>
            <span class="visually-hidden">Shopping bag, <span data-bag-count-text>0 items</span></span>
          </button>
        </div>
      </div>

      ${nav.map((item) => raw(megaPanel(item)))}
      ${raw(searchPanel())}
    </header>
  `;
}

function searchPanel() {
  return html`
    <div class="search-panel" id="search-panel" hidden>
      <div class="container">
        <form class="search-form" action="${url('/search/')}" method="get" role="search" data-search-form>
          <label class="visually-hidden" for="site-search">Search sarees, fabrics and weaves</label>
          <input
            class="search-form__input"
            type="search"
            id="site-search"
            name="q"
            placeholder="Search “silk saree”, “Banarasi”, “wedding”…"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
            aria-describedby="search-help"
            data-search-input
          />
          <button class="btn" type="submit">Search</button>
          <button class="icon-btn" type="button" data-search-close>
            ${raw(icon('close'))}<span class="visually-hidden">Close search</span>
          </button>
        </form>
        <p class="visually-hidden" id="search-help">
          Results appear below as you type. We understand both “saree” and “sari”.
        </p>
        <div class="search-results" data-search-results aria-live="polite"></div>
      </div>
    </div>
  `;
}

function navDrawer() {
  return html`
    <div class="drawer drawer--left" id="nav-drawer" role="dialog" aria-modal="true" aria-label="Menu" data-drawer>
      <div class="drawer__head">
        <span class="drawer__title">Menu</span>
        <button class="icon-btn" type="button" data-close-drawer>
          ${raw(icon('close'))}<span class="visually-hidden">Close menu</span>
        </button>
      </div>
      <div class="drawer__body">
        <nav class="mobile-nav" aria-label="Main, mobile">
          <ul>
            ${nav.map((item, i) =>
              raw(
                item.panel
                  ? `<li class="mobile-nav__item">
                      <button class="mobile-nav__link" type="button" aria-expanded="false" aria-controls="mnav-${item.key}">
                        ${esc(item.label)} ${icon('chevron', { size: 14 })}
                      </button>
                      <div class="mobile-nav__panel" id="mnav-${item.key}" hidden>
                        <a href="${url(item.href)}"><strong>All ${esc(item.label.toLowerCase())}</strong></a>
                        ${item.panel.columns
                          .map(
                            (col) =>
                              `<h3>${esc(col.heading)}</h3>` +
                              col.links
                                .map(
                                  (l) =>
                                    `<a href="${url(l.href)}">${esc(l.label)}${
                                      l.hint ? `<span>${esc(l.hint)}</span>` : ''
                                    }</a>`
                                )
                                .join('')
                          )
                          .join('')}
                      </div>
                    </li>`
                  : `<li class="mobile-nav__item"><a class="mobile-nav__link" href="${url(item.href)}">${esc(
                      item.label
                    )}</a></li>`
              )
            )}
          </ul>
          <div class="mobile-nav__secondary">
            <a href="${url('/account/')}">Account</a>
            <a href="${url('/wishlist/')}">Wishlist</a>
            <a href="${url('/track-order/')}">Track your order</a>
            <a href="${url('/delivery/')}">Delivery</a>
            <a href="${url('/returns/')}">Returns</a>
            <a href="${url('/contact/')}">Contact us</a>
          </div>
        </nav>
      </div>
    </div>
  `;
}

function bagDrawer() {
  return html`
    <div
      class="drawer drawer--right"
      id="bag-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bag-drawer-title"
      data-drawer
    >
      <div class="drawer__head">
        <h2 class="drawer__title" id="bag-drawer-title">Your bag</h2>
        <button class="icon-btn" type="button" data-close-drawer>
          ${raw(icon('close'))}<span class="visually-hidden">Close bag</span>
        </button>
      </div>
      <div class="drawer__body" data-bag-drawer-body>
        <!-- Rendered by bag.mjs from stored state. -->
      </div>
      <div class="drawer__foot" data-bag-drawer-foot hidden>
        <ul class="totals" data-bag-drawer-totals></ul>
        <a class="btn btn--accent btn--block btn--lg" href="${url('/checkout/')}">Go to checkout</a>
        <a class="btn btn--quiet btn--block" href="${url('/bag/')}">View full bag</a>
        <p class="xs muted" style="text-align:center">
          ${raw(icon('lock', { size: 13 }))} Demonstration checkout — no payment is taken.
        </p>
      </div>
    </div>
  `;
}

function footerMarkup() {
  return html`
    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="brand">${BRAND}</span>
            <p>${site.tagline}</p>
            <dl class="footer-contact">
              <dt>Customer service</dt>
              <dd><a href="mailto:${site.contact.email}">${site.contact.email}</a></dd>
              <dd><a href="tel:${site.contact.phone}">${site.contact.phoneDisplay}</a></dd>
              <dd class="xs" style="color:#97918a">${site.contact.hours}</dd>
              <dt>Dispatched from</dt>
              <dd>
                ${site.studio.city}, ${site.studio.country}
                <span class="sample-tag" style="color:#b3ada5;border-color:#45403c">Sample</span>
              </dd>
            </dl>
          </div>
          <div class="footer-cols">
            ${footer.map(
              (col) => raw(`
              <div>
                <h3>${esc(col.heading)}</h3>
                <ul>
                  ${col.links.map((l) => `<li><a href="${url(l.href)}">${esc(l.label)}</a></li>`).join('')}
                </ul>
              </div>`)
            )}
          </div>
        </div>

        <div class="footer-bottom">
          <p style="max-width:44ch">
            © ${new Date().getFullYear()} ${BRAND}. A demonstration storefront — see the
            <a href="${url('/demo-notice/')}">demonstration notice</a>. Prices include UK VAT.
          </p>
          <div class="payment-marks" role="list" aria-label="Payment methods we would accept">
            ${paymentMethods.map((m) => raw(`<span class="payment-mark" role="listitem">${esc(m.label)}</span>`))}
          </div>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Render a complete page document.
 */
export function page({
  title,
  description,
  path = '/',
  activeKey = null,
  body,
  bodyClass = '',
  pageData = null,
  jsonLd = null,
  scripts = [],
  hideFooter = false
}) {
  const fullTitle = title ? `${title} | ${BRAND}` : `${BRAND} — ${site.tagline}`;
  return `<!doctype html>
<html lang="en-GB" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description || site.tagline)}">
<meta name="theme-color" content="#FAF7F2">
<meta name="color-scheme" content="light">
<link rel="icon" href="${FAVICON}">
<link rel="canonical" href="${esc(url(path))}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description || site.tagline)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_GB">
<link rel="preload" href="${url('/assets/fonts/fraunces-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${url('/assets/fonts/instrument-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${url('/assets/css/site.css')}">
<script>document.documentElement.className='js';</script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body${bodyClass ? ` class="${esc(bodyClass)}"` : ''}${pageData ? ` data-page="${esc(pageData)}"` : ''}>
<a class="skip-link" href="#main">Skip to main content</a>
${serviceStripMarkup()}
${headerMarkup(activeKey)}
<main id="main" tabindex="-1">
${body}
</main>
${hideFooter ? '' : footerMarkup()}
${navDrawer()}
${bagDrawer()}
<div class="overlay" data-overlay hidden></div>
<div class="toast-region" data-toast-region aria-live="polite" aria-atomic="false"></div>
<div class="sr-live" data-sr-live role="status" aria-live="polite"></div>
${glossaryDialog()}
<script type="module" src="${url('/assets/js/app.mjs')}"></script>
${scripts.map((s) => `<script type="module" src="${url(s)}"></script>`).join('\n')}
</body>
</html>`;
}

function glossaryDialog() {
  return `<dialog id="term-dialog" aria-labelledby="term-dialog-title">
  <div class="modal__head">
    <div>
      <p class="eyebrow">In plain English</p>
      <h2 class="h3" id="term-dialog-title" data-term-title>Term</h2>
    </div>
    <button class="icon-btn" type="button" data-close-dialog>
      ${icon('close')}<span class="visually-hidden">Close</span>
    </button>
  </div>
  <div class="modal__body">
    <p data-term-body></p>
    <p class="small muted mt-4" data-term-extra></p>
    <p class="mt-5"><a class="link link--accent link--arrow" href="${url('/saree-guide/glossary/')}">See the full glossary</a></p>
  </div>
</dialog>`;
}

export { returnsPolicy };
