/* ------------------------------------------------------------------ *
 * Full search results page, including the recovery route when a query
 * returns nothing.
 * ------------------------------------------------------------------ */

import { catalogue, search, recover } from './catalogue.mjs';
import { announce, el } from './ui.mjs';
import { formatMoney } from './commerce.mjs';
import * as store from './store.mjs';

const input = document.querySelector('[data-search-page-input]');
const container = document.querySelector('[data-search-page-results]');
const idle = document.querySelector('[data-search-idle]');
const form = document.querySelector('[data-search-page-form]');

const params = new URLSearchParams(location.search);
const initial = params.get('q') || '';

if (input && initial) input.value = initial;
if (initial) run(initial);

if (form) {
  form.addEventListener('submit', (e) => {
    const q = input.value.trim();
    if (!q) return; // let the browser do its thing
    e.preventDefault();
    history.replaceState(null, '', `${location.pathname}?q=${encodeURIComponent(q)}`);
    run(q);
  });
}

async function run(query) {
  if (idle) idle.hidden = true;
  container.setAttribute('aria-busy', 'true');
  renderSkeletons();

  let data;
  try {
    data = await catalogue();
  } catch {
    container.innerHTML = `
      <div class="notice notice--err">
        <div class="notice__body">
          <p><strong>Search is unavailable just now.</strong></p>
          <p>We could not load the product index. Reload the page, or <a class="link" href="collections/sarees/">browse all sarees</a> instead.</p>
        </div>
      </div>`;
    container.removeAttribute('aria-busy');
    return;
  }

  const result = search(data, query, { limit: 48 });
  container.removeAttribute('aria-busy');

  if (!result.results.length) {
    renderEmpty(result, data, query);
    return;
  }
  renderResults(result, data, query);
}

function renderSkeletons() {
  container.innerHTML = `
    <div class="product-grid product-grid--4" aria-hidden="true">
      ${Array.from({ length: 8 })
        .map(
          () =>
            `<div><div class="skeleton skeleton--media"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>`
        )
        .join('')}
    </div>`;
  announce('Searching');
}

function renderResults(result, data, query) {
  const wishlist = store.getWishlist();
  const parts = [];

  parts.push(`
    <div class="split mb-5">
      <p class="toolbar__count"><strong>${result.total}</strong> ${result.total === 1 ? 'result' : 'results'} for “${escapeHtml(query)}”</p>
      ${
        result.priceFilter
          ? `<p class="small muted">Price filter applied${
              result.priceFilter.max ? ` — under ${formatMoney(result.priceFilter.max)}` : ''
            }${result.priceFilter.min ? ` — over ${formatMoney(result.priceFilter.min)}` : ''}</p>`
          : ''
      }
    </div>`);

  if (result.categories.length) {
    parts.push(`
      <div class="mb-6">
        <h2 class="h4 mb-3">Matching categories</h2>
        <div class="search-suggest">
          ${result.categories.map((c) => `<a href="${c.href}">${escapeHtml(c.label)} <span class="xs muted">(${c.kind})</span></a>`).join('')}
        </div>
      </div>`);
  }

  parts.push(`<div class="product-grid product-grid--4">
    ${result.results.map((p) => cardHtml(p, wishlist.includes(p.id), result.tokens)).join('')}
  </div>`);

  if (result.total > result.results.length) {
    parts.push(`<p class="small muted mt-6">Showing the first ${result.results.length} of ${result.total}. Narrow your search, or <a class="link" href="collections/sarees/">use the filters on the collection page</a>.</p>`);
  }

  container.innerHTML = parts.join('');
  announce(`${result.total} result${result.total === 1 ? '' : 's'} for ${query}`);
}

function cardHtml(p, wished, tokens) {
  const buyable = p.stock !== 'out-of-stock';
  return `
    <article class="card${buyable ? '' : ' card--out'}" data-product-card data-id="${p.id}" data-name="${escapeHtml(p.name)}">
      <div class="card__media">
        ${!buyable ? '<div class="card__flags"><span class="badge badge--off">Out of stock</span></div>' : ''}
        ${p.isNew && buyable ? '<div class="card__flags"><span class="badge badge--new">New in</span></div>' : ''}
        <img src="${p.image}" alt="${escapeHtml(p.name)} shown draped on a figure. Illustration." width="900" height="1200" loading="lazy" decoding="async">
        <button class="icon-btn card__wish" type="button" data-wishlist-toggle="${p.id}" aria-pressed="${wished}">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 8.2a4.3 4.3 0 0 1 7.5 2.6c0 5.1-7.5 9.7-7.5 9.7Z"/></svg>
          <span class="visually-hidden">Save ${escapeHtml(p.name)} to wishlist</span>
        </button>
      </div>
      <h3 class="card__title"><a href="${p.href}">${highlight(p.name, tokens)}</a></h3>
      <p class="card__attr">${escapeHtml(p.fabricLabel)}</p>
      <p class="card__price numeric">${formatMoney(p.price)}</p>
      <div class="card__cta">
        <a class="btn btn--quiet btn--sm" href="${p.href}">${buyable ? 'Choose options' : 'See alternatives'}</a>
      </div>
    </article>`;
}

function renderEmpty(result, data, query) {
  const fixes = recover(data, query);
  const suggestion = fixes.length ? query.replace(new RegExp(fixes[0].from, 'i'), fixes[0].to) : null;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21M8.5 11h5"/></svg>
      </div>
      <h2>Nothing matches “${escapeHtml(query)}”</h2>
      <p>
        ${
          suggestion
            ? `Did you mean <button class="link" type="button" data-try="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>?`
            : 'That is not a term we use, or we do not stock it at the moment.'
        }
      </p>
      <div class="empty-state__suggest">
        <h3 class="h4 mb-4">Things that always return something</h3>
        <div class="search-suggest mb-5">
          ${['silk', 'cotton', 'georgette', 'Banarasi', 'ikat', 'wedding guest', 'ready to wear', 'under ₹5,000']
            .map((t) => `<a href="?q=${encodeURIComponent(t)}">${t}</a>`)
            .join('')}
        </div>
        <h3 class="h4 mb-3">Or start from a category</h3>
        <ul class="stack-2 small">
          <li><a class="link" href="collections/sarees/">All sarees</a> — filter by fabric, occasion, colour and price.</li>
          <li><a class="link" href="collections/ready-to-wear/">Ready to wear</a> — no draping needed.</li>
          <li><a class="link" href="saree-guide/first-saree/">Find your first saree</a> — four questions.</li>
          <li><a class="link" href="saree-guide/glossary/">Glossary</a> — if you met the word somewhere and are not sure what it means.</li>
        </ul>
        <p class="small muted mt-5">
          We understand “saree” and “sari”, and most regional spellings — Kanchipuram and Kanjivaram,
          Benarasi and Banarasi. If you searched for something we should stock,
          <a class="link" href="contact/">tell us</a>.
        </p>
      </div>
    </div>`;

  const tryBtn = container.querySelector('[data-try]');
  if (tryBtn) {
    tryBtn.addEventListener('click', () => {
      input.value = tryBtn.dataset.try;
      history.replaceState(null, '', `${location.pathname}?q=${encodeURIComponent(tryBtn.dataset.try)}`);
      run(tryBtn.dataset.try);
    });
  }
  announce(`No results for ${query}. Suggestions are shown below.`);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlight(text, tokens) {
  let out = escapeHtml(text);
  for (const t of tokens) {
    if (t.length < 2) continue;
    out = out.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
  }
  return out;
}
