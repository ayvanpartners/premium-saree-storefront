/* ------------------------------------------------------------------ *
 * Runs on every page: header behaviour, navigation, search, drawers,
 * bag and wishlist synchronisation, quick add, glossary terms.
 * ------------------------------------------------------------------ */

import { openDrawer, closeDrawer, closeAllDrawers, toast, announce, el, isDrawerOpen, prefersReducedMotion } from './ui.mjs';
import * as store from './store.mjs';
import { catalogue, search } from './catalogue.mjs';
import { renderLines, renderTotals } from './bag-ui.mjs';
import { formatMoney } from './commerce.mjs';

/* ----------------------------- Header ----------------------------- */
function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  let last = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (y > 8 !== last > 8) header.dataset.scrolled = y > 8 ? 'true' : 'false';
    last = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --------------------------- Mega navigation ---------------------- *
 * Opens on hover for pointer users and on click/Enter for everyone.
 * The trigger is a real link, so it still navigates when JS is absent
 * and when the panel is closed by keyboard.
 * ------------------------------------------------------------------ */
function initMegaNav() {
  const triggers = Array.from(document.querySelectorAll('[data-mega-trigger]'));
  if (!triggers.length) return;
  let openKey = null;
  let hoverTimer = null;

  const panels = new Map(
    triggers.map((t) => [t.dataset.megaTrigger, document.getElementById(`mega-${t.dataset.megaTrigger}`)])
  );

  function open(key) {
    if (openKey === key) return;
    close();
    const panel = panels.get(key);
    const trigger = triggers.find((t) => t.dataset.megaTrigger === key);
    if (!panel || !trigger) return;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    openKey = key;
  }

  function close() {
    if (!openKey) return;
    const panel = panels.get(openKey);
    const trigger = triggers.find((t) => t.dataset.megaTrigger === openKey);
    if (panel) panel.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    openKey = null;
  }

  for (const trigger of triggers) {
    const key = trigger.dataset.megaTrigger;
    const panel = panels.get(key);

    trigger.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => open(key), 90);
    });
    trigger.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (panel && !panel.matches(':hover') && !trigger.matches(':hover')) close();
      }, 220);
    });
    if (panel) {
      panel.addEventListener('mouseleave', () => {
        hoverTimer = setTimeout(() => {
          if (!trigger.matches(':hover') && !panel.matches(':hover')) close();
        }, 180);
      });
      panel.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
    }

    // Click opens the panel rather than navigating, but only on wide
    // screens where the panel exists; narrow screens use the drawer.
    trigger.addEventListener('click', (e) => {
      if (!window.matchMedia('(min-width: 64em)').matches) return;
      if (openKey === key) return; // second click follows the link
      e.preventDefault();
      open(key);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        open(key);
        const first = panel && panel.querySelector('a');
        if (first) first.focus();
      }
    });
  }

  document.addEventListener('focusin', (e) => {
    if (!openKey) return;
    const panel = panels.get(openKey);
    const trigger = triggers.find((t) => t.dataset.megaTrigger === openKey);
    if (panel && !panel.contains(e.target) && e.target !== trigger) close();
  });

  document.addEventListener('ui:escape', () => {
    if (openKey) {
      const trigger = triggers.find((t) => t.dataset.megaTrigger === openKey);
      close();
      if (trigger) trigger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!openKey) return;
    const panel = panels.get(openKey);
    const trigger = triggers.find((t) => t.dataset.megaTrigger === openKey);
    if (panel && !panel.contains(e.target) && !trigger.contains(e.target)) close();
  });
}

/* ------------------------- Mobile navigation ---------------------- */
function initMobileNav() {
  document.querySelectorAll('.mobile-nav__link[aria-controls]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });
}

/* ------------------------------ Drawers --------------------------- */
function initDrawers() {
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-open-drawer]');
    if (opener) {
      e.preventDefault();
      openDrawer(opener.dataset.openDrawer, opener);
      return;
    }
    const closer = e.target.closest('[data-close-drawer]');
    if (closer) {
      e.preventDefault();
      const drawer = closer.closest('[data-drawer]');
      closeDrawer(drawer ? drawer.id : undefined);
    }
  });

  const overlay = document.querySelector('[data-overlay]');
  if (overlay) overlay.addEventListener('click', () => closeAllDrawers());

  // Mark panels inert at rest so screen readers skip them.
  document.querySelectorAll('[data-drawer]').forEach((d) => d.setAttribute('inert', ''));
}

/* ------------------------------- Search --------------------------- */
function initSearch() {
  const toggle = document.querySelector('[data-search-toggle]');
  const panel = document.getElementById('search-panel');
  const input = document.querySelector('[data-search-input]');
  const results = document.querySelector('[data-search-results]');
  const closeBtn = document.querySelector('[data-search-close]');
  if (!toggle || !panel || !input || !results) return;

  let open = false;
  let idleRendered = false;

  function show() {
    open = true;
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
    if (!idleRendered) {
      renderIdle();
      idleRendered = true;
    }
    // Warm the index so the first keystroke is instant.
    catalogue().catch(() => {});
  }

  function hide() {
    open = false;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }

  toggle.addEventListener('click', () => (open ? hide() : show()));
  if (closeBtn) closeBtn.addEventListener('click', hide);
  document.addEventListener('ui:escape', () => {
    if (open) hide();
  });
  document.addEventListener('click', (e) => {
    if (open && !panel.contains(e.target) && !toggle.contains(e.target)) hide();
  });

  function renderIdle() {
    results.innerHTML = `
      <div class="search-results__group">
        <h3>Popular searches</h3>
        <div class="search-suggest">
          ${['silk saree', 'Banarasi', 'wedding guest', 'ready to wear', 'cotton', 'under £100']
            .map((t) => `<a href="#" data-suggest="${t}">${t}</a>`)
            .join('')}
        </div>
      </div>`;
    results.querySelectorAll('[data-suggest]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        input.value = a.dataset.suggest;
        runSearch(a.dataset.suggest);
      });
    });
  }

  let debounce = null;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    if (!q) {
      renderIdle();
      return;
    }
    if (q.length < 2) return;
    results.innerHTML = `<div class="search-results__group"><p class="small muted">Searching…</p></div>`;
    debounce = setTimeout(() => runSearch(q), 160);
  });

  async function runSearch(q) {
    let data;
    try {
      data = await catalogue();
    } catch {
      results.innerHTML = `
        <div class="search-results__group">
          <p class="small">We could not load the search index just now.
          <a class="link" href="${new URL('../../collections/sarees/', import.meta.url).pathname}">Browse all sarees</a> instead.</p>
        </div>`;
      return;
    }
    const r = search(data, q, { limit: 6 });
    renderResults(r, data);
  }

  function renderResults(r, data) {
    if (!r.results.length) {
      results.innerHTML = `
        <div class="search-results__group">
          <p class="small"><strong>Nothing matches “${escape(r.query)}”.</strong></p>
          ${r.corrected ? `<p class="small muted">Did you mean <button class="link" type="button" data-correct="${escape(r.corrected)}">${escape(r.corrected)}</button>?</p>` : ''}
          <p class="small muted mt-2">Try a fabric (silk, cotton, georgette), a weave (Banarasi, ikat), or an occasion (wedding, festive).</p>
          <p class="small mt-3"><a class="link link--arrow" href="${data.base}/search/?q=${encodeURIComponent(r.query)}">See full search page</a></p>
        </div>`;
      const btn = results.querySelector('[data-correct]');
      if (btn) {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.correct;
          runSearch(btn.dataset.correct);
        });
      }
      announce(`No results for ${r.query}`);
      return;
    }

    const products = r.results
      .map(
        (p) => `
        <a class="search-preview__item" href="${p.href}">
          <img src="${p.image}" alt="" width="900" height="1200" loading="lazy" decoding="async">
          <span class="search-preview__meta">
            <strong>${highlight(p.name, r.tokens)}</strong>
            <span>${escape(p.fabricLabel)}</span>
            <span>${formatMoney(p.price)}${p.stock === 'out-of-stock' ? ' · out of stock' : ''}</span>
          </span>
        </a>`
      )
      .join('');

    results.innerHTML = `
      ${
        r.categories.length
          ? `<div class="search-results__group">
               <h3>Categories</h3>
               <div class="search-suggest">
                 ${r.categories.map((c) => `<a href="${c.href}">${escape(c.label)}</a>`).join('')}
               </div>
             </div>`
          : ''
      }
      <div class="search-results__group">
        <h3>Products${r.total > r.results.length ? ` — showing ${r.results.length} of ${r.total}` : ''}</h3>
        <div class="search-preview">${products}</div>
        ${
          r.total > r.results.length
            ? `<p class="small mt-4"><a class="link link--arrow" href="${data.base}/search/?q=${encodeURIComponent(r.query)}">See all ${r.total} results</a></p>`
            : ''
        }
      </div>`;
    announce(`${r.total} result${r.total === 1 ? '' : 's'} for ${r.query}`);
  }
}

function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlight(text, tokens) {
  let out = escape(text);
  for (const t of tokens) {
    if (t.length < 2) continue;
    out = out.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
  }
  return out;
}

/* ------------------------- Bag synchronisation -------------------- */
let catalogueData = null;

async function ensureData() {
  if (catalogueData) return catalogueData;
  catalogueData = await catalogue();
  return catalogueData;
}

function updateBagCount() {
  const count = store.bagCount();
  document.querySelectorAll('[data-bag-count]').forEach((n) => {
    n.textContent = String(count);
    n.dataset.count = String(count);
  });
  document.querySelectorAll('[data-bag-count-text]').forEach((n) => {
    n.textContent = count === 1 ? '1 item' : `${count} items`;
  });
}

function updateWishlistCount() {
  const ids = store.getWishlist();
  document.querySelectorAll('[data-wishlist-count]').forEach((n) => {
    n.textContent = String(ids.length);
    n.dataset.count = String(ids.length);
  });
  document.querySelectorAll('[data-wishlist-count-text]').forEach((n) => {
    n.textContent = ids.length === 1 ? '1 item' : `${ids.length} items`;
  });
  document.querySelectorAll('[data-wishlist-toggle]').forEach((btn) => {
    const on = ids.includes(btn.dataset.wishlistToggle);
    btn.setAttribute('aria-pressed', String(on));
    const label = btn.querySelector('[data-wishlist-label]');
    if (label) label.textContent = on ? 'Saved to wishlist' : 'Save to wishlist';
    const sr = btn.querySelector('.visually-hidden');
    if (sr && !label) {
      sr.textContent = `${on ? 'Remove' : 'Save'} ${sr.textContent.replace(/^(Save|Remove)\s+/, '')}`;
    }
  });
}

async function renderBagDrawer() {
  const body = document.querySelector('[data-bag-drawer-body]');
  const foot = document.querySelector('[data-bag-drawer-foot]');
  const totalsEl = document.querySelector('[data-bag-drawer-totals]');
  if (!body) return;

  const lines = store.getBag();
  if (!lines.length) {
    body.innerHTML = `
      <div style="text-align:center;padding:var(--sp-7) var(--sp-2)">
        <p class="h3" style="margin-bottom:var(--sp-3)">Your bag is empty</p>
        <p class="small muted" style="margin-inline:auto">Nothing in here yet. If you were partway through choosing, it may be on your wishlist.</p>
        <div class="stack-3" style="margin-top:var(--sp-5)">
          <a class="btn btn--block" href="${withBase('/collections/sarees/')}">Shop sarees</a>
          <a class="btn btn--quiet btn--block" href="${withBase('/wishlist/')}">View wishlist</a>
        </div>
      </div>`;
    if (foot) foot.hidden = true;
    return;
  }

  renderLines(body, { editable: true });
  if (foot) foot.hidden = false;
  try {
    const data = await ensureData();
    renderTotals(totalsEl, { data, context: 'drawer' });
  } catch {
    if (totalsEl) totalsEl.innerHTML = '<li><span>Total</span><span>See bag</span></li>';
  }
}

function withBase(path) {
  // /assets/js/app.mjs -> strip two segments to find the site root.
  const root = new URL('../../', import.meta.url);
  return new URL(path.replace(/^\//, ''), root).pathname;
}

/* ---------------------------- Quick add --------------------------- */
function initQuickAdd() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-quick-add]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.quickAdd;
    btn.classList.add('btn--busy');
    btn.disabled = true;
    try {
      const data = await ensureData();
      const product = data.products.find((p) => p.id === id);
      if (!product) throw new Error('not found');

      // Anything with a real choice to make goes to the product page
      // instead — quick-add must never guess a size or a service.
      if (product.sizes || product.colours.length > 1) {
        window.location.href = product.href;
        return;
      }
      const colour = product.colours[0];
      store.addToBag({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        href: product.href,
        stock: product.stock,
        colour: colour ? colour.slug : null,
        colourName: colour ? colour.name : null,
        size: null,
        services: [],
        quantity: 1
      });
      toast(`${product.name} added to your bag.`, {
        title: 'Added',
        action: { label: 'View bag', onClick: () => openDrawer('bag-drawer', btn) }
      });
    } catch {
      toast('We could not add that just now. Please try the product page.', { tone: 'err' });
    } finally {
      btn.classList.remove('btn--busy');
      btn.disabled = false;
    }
  });
}

/* --------------------------- Wishlist hearts ---------------------- */
function initWishlist() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.wishlistToggle;
    const added = store.toggleWishlist(id);
    const card = btn.closest('[data-product-card]');
    const name = card ? card.dataset.name : 'Item';
    announce(added ? `${name} saved to wishlist` : `${name} removed from wishlist`);
    if (added) {
      toast(`${name} saved to your wishlist.`, {
        action: { label: 'View wishlist', onClick: () => (window.location.href = withBase('/wishlist/')) }
      });
    }
  });
}

/* ---------------------------- Glossary terms ---------------------- */
function initTerms() {
  const dialog = document.getElementById('term-dialog');
  if (!dialog) return;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-term]');
    if (!btn) return;
    e.preventDefault();
    dialog.querySelector('[data-term-title]').textContent = btn.dataset.term;
    dialog.querySelector('[data-term-body]').textContent = btn.dataset.termDef || '';
    const extra = dialog.querySelector('[data-term-extra]');
    extra.textContent = btn.dataset.termExtra || '';
    extra.hidden = !btn.dataset.termExtra;
    dialog.__trigger = btn;
    dialog.showModal();
  });
}

/* ------------------------------- Boot ----------------------------- */
function boot() {
  initHeader();
  initMegaNav();
  initMobileNav();
  initDrawers();
  initSearch();
  initQuickAdd();
  initWishlist();
  initTerms();

  updateBagCount();
  updateWishlistCount();
  renderBagDrawer();

  store.on('bag:change', () => {
    updateBagCount();
    renderBagDrawer();
  });
  store.on('wishlist:change', updateWishlistCount);
  store.on('bag:added', () => {
    if (!isDrawerOpen('bag-drawer')) return;
    renderBagDrawer();
  });

  if (!store.storageAvailable()) {
    // Worth saying out loud: the bag will not survive a reload.
    toast(
      'Your browser is blocking site storage, so your bag will not be remembered if you reload. Everything else works normally.',
      { tone: 'err', duration: 12000, title: 'Storage unavailable' }
    );
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

export { ensureData, withBase, updateBagCount, renderBagDrawer };
