/* ------------------------------------------------------------------ *
 * Collection page: filtering, sorting, load-more, filter chips, the
 * mobile filter drawer, and returning you to where you were.
 *
 * Products are rendered server-side and filtered in place, so the page
 * is complete and indexable before any script runs, and filtering has
 * no network cost. Without JavaScript the same form submits as a GET
 * and the server-rendered page still lists everything.
 * ------------------------------------------------------------------ */

import { openDrawer, closeDrawer, announce, prefersReducedMotion } from './ui.mjs';

const PAGE_SIZE = 12;
const STATE_KEY = 'collectionState';

const FACETS = {
  occasion: { attr: 'occasions', multi: true, label: 'Occasion' },
  fabric: { attr: 'fabric', label: 'Fabric' },
  colour: { attr: 'colour', label: 'Colour' },
  weave: { attr: 'weave', label: 'Weave' },
  price: { attr: 'price', label: 'Price', range: true },
  rtw: { attr: 'rtw', label: 'Ready to wear', flag: 'yes' },
  stock: { attr: 'stock', label: 'Availability', stock: true },
  blouse: { attr: null, label: 'Blouse piece included', blouse: true }
};

const PRICE_BANDS = {
  '0-2500': [0, 2500],
  '2500-5000': [2500, 5000],
  '5000-10000': [5000, 10000],
  '10000-999999': [10000, Infinity]
};

const LABELS = {
  price: { '0-2500': 'Under ₹2,500', '2500-5000': '₹2,500 to ₹5,000', '5000-10000': '₹5,000 to ₹10,000', '10000-999999': '₹10,000 and above' },
  rtw: { yes: 'Ready to wear' },
  stock: { 'in-stock': 'In stock now' },
  blouse: { included: 'Blouse piece included' }
};

const form = document.querySelector('[data-filter-form]');
const grid = document.querySelector('[data-product-grid]');
const sortSelect = document.querySelector('[data-sort]');
const countEl = document.querySelector('[data-result-count]');
const chipsEl = document.querySelector('[data-applied-filters]');
const noResults = document.querySelector('[data-no-results]');
const loadMore = document.querySelector('[data-load-more]');
const loadMoreBtn = document.querySelector('[data-load-more-btn]');
const drawerBody = document.querySelector('[data-filter-drawer-body]');
const openFiltersBtn = document.querySelector('[data-open-filters]');
const activeCountBadge = document.querySelector('[data-active-filter-count]');
const drawerCount = document.querySelector('[data-drawer-count]');

if (form && grid) init();

function init() {
  const cards = Array.from(grid.querySelectorAll('[data-product-card]'));
  let shown = PAGE_SIZE;

  // Human-readable labels for the facets that come from the DOM.
  const dynamicLabels = {};
  form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const text = input.closest('label');
    if (!text) return;
    const span = text.querySelector('.check__text, .filter-swatch span:last-child');
    if (!span) return;
    // Only the direct text of the label — not the "(12)" count span or
    // the plain-English hint nested inside it, both of which would
    // otherwise end up inside a filter chip.
    const label = Array.from(span.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (label) dynamicLabels[`${input.name}:${input.value}`] = label;
  });

  applyFromUrl();
  // Read the saved position now, but scroll after the first apply() has
  // put the grid into its final shape — otherwise we would scroll
  // against a layout that is about to change.
  const pendingScroll = readSavedScroll();

  form.addEventListener('change', () => {
    shown = PAGE_SIZE;
    apply({ pushUrl: true });
  });

  form.addEventListener('submit', (e) => {
    // With JS we filter in place rather than reloading.
    e.preventDefault();
    shown = PAGE_SIZE;
    apply({ pushUrl: true });
    if (window.matchMedia('(max-width: 63.99em)').matches) closeDrawer('filter-drawer');
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      shown = Math.max(shown, PAGE_SIZE);
      apply({ pushUrl: true });
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      const before = shown;
      shown += PAGE_SIZE;
      apply({ pushUrl: false });
      // Move focus to the first newly revealed card for keyboard users.
      const visible = cards.filter((c) => !c.hidden);
      const next = visible[before];
      if (next) {
        const link = next.querySelector('a');
        if (link) link.focus({ preventScroll: false });
      }
      announce(`Showing ${Math.min(shown, visible.length)} of ${visible.length}`);
    });
  }

  // The filter form is moved into the drawer on narrow screens so the
  // document only ever contains one set of filter controls.
  if (openFiltersBtn && drawerBody) {
    openFiltersBtn.addEventListener('click', () => {
      drawerBody.append(form);
      openDrawer('filter-drawer', openFiltersBtn);
    });
    const drawer = document.getElementById('filter-drawer');
    if (drawer) {
      const rail = document.querySelector('.filter-rail');
      const observer = new MutationObserver(() => {
        if (drawer.dataset.open !== 'true' && rail && form.parentElement === drawerBody) {
          rail.append(form);
        }
      });
      observer.observe(drawer, { attributes: true, attributeFilter: ['data-open'] });
    }
    const apply2 = document.querySelector('[data-apply-filters]');
    if (apply2) apply2.addEventListener('click', () => closeDrawer('filter-drawer'));
    const clear = document.querySelector('[data-clear-filters]');
    if (clear)
      clear.addEventListener('click', () => {
        clearAll();
        closeDrawer('filter-drawer');
      });
  }

  window.addEventListener('popstate', () => {
    applyFromUrl();
    apply({ pushUrl: false });
  });

  // Remember filters and position when leaving for a product page.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="/products/"]');
    if (!link) return;
    try {
      sessionStorage.setItem(
        STATE_KEY,
        JSON.stringify({
          path: location.pathname,
          search: location.search,
          scrollY: window.scrollY,
          shown
        })
      );
    } catch {
      /* storage may be unavailable; losing scroll position is survivable */
    }
  });

  apply({ pushUrl: false });

  if (pendingScroll != null) {
    // Cards reserve their height with aspect-ratio, so the layout is
    // already final here and this lands in the right place without
    // waiting for images. No requestAnimationFrame: it does not fire
    // in a background tab, which would silently skip the restore.
    window.scrollTo({ top: pendingScroll, behavior: 'instant' });
    // Images that finish late can still nudge things, so correct once
    // everything has settled.
    window.addEventListener(
      'load',
      () => {
        if (Math.abs(window.scrollY - pendingScroll) > 4) {
          window.scrollTo({ top: pendingScroll, behavior: 'instant' });
        }
      },
      { once: true }
    );
  }

  /* ------------------------------------------------------------------ */

  function selected() {
    const out = {};
    for (const [name] of Object.entries(FACETS)) {
      const inputs = Array.from(form.querySelectorAll(`input[name="${name}"]:checked`));
      if (inputs.length) out[name] = inputs.map((i) => i.value);
    }
    return out;
  }

  function matches(card, sel) {
    for (const [name, values] of Object.entries(sel)) {
      const facet = FACETS[name];
      if (!facet) continue;

      if (facet.range) {
        const price = Number(card.dataset.price);
        const ok = values.some((v) => {
          const band = PRICE_BANDS[v];
          return band && price >= band[0] && price < band[1];
        });
        if (!ok) return false;
        continue;
      }
      if (facet.stock) {
        const s = card.dataset.stock;
        if (!(s === 'in-stock' || s === 'low-stock')) return false;
        continue;
      }
      if (facet.blouse) {
        if (card.dataset.blouse !== 'included') return false;
        continue;
      }
      if (facet.flag) {
        if (card.dataset[facet.attr] !== facet.flag) return false;
        continue;
      }
      if (facet.multi) {
        const have = (card.dataset[facet.attr] || '').split(' ');
        if (!values.some((v) => have.includes(v))) return false;
        continue;
      }
      if (!values.includes(card.dataset[facet.attr])) return false;
    }
    return true;
  }

  function sortCards(list) {
    const mode = sortSelect ? sortSelect.value : 'featured';
    const byName = (a, b) => a.dataset.name.localeCompare(b.dataset.name, 'en-GB');
    const stockRank = { 'in-stock': 0, 'low-stock': 1, 'made-to-order': 2, 'out-of-stock': 3 };
    const sorted = [...list];
    switch (mode) {
      case 'price-asc':
        sorted.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price) || byName(a, b));
        break;
      case 'price-desc':
        sorted.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price) || byName(a, b));
        break;
      case 'newest':
        sorted.sort((a, b) => (b.dataset.new === 'yes') - (a.dataset.new === 'yes') || byName(a, b));
        break;
      case 'delivery':
        sorted.sort((a, b) => stockRank[a.dataset.stock] - stockRank[b.dataset.stock] || byName(a, b));
        break;
      case 'ease':
        sorted.sort((a, b) => Number(a.dataset.ease || 3) - Number(b.dataset.ease || 3) || byName(a, b));
        break;
      case 'name':
        sorted.sort(byName);
        break;
      default:
        // Featured: catalogue order, but never lead with out-of-stock.
        sorted.sort(
          (a, b) =>
            (a.dataset.stock === 'out-of-stock') - (b.dataset.stock === 'out-of-stock') ||
            Number(a.dataset.index) - Number(b.dataset.index)
        );
    }
    return sorted;
  }

  function apply({ pushUrl }) {
    const sel = selected();
    const matching = cards.filter((c) => matches(c, sel));
    const ordered = sortCards(matching);

    // Reorder in the DOM so tab order follows visual order.
    for (const card of ordered) grid.append(card);
    for (const card of cards) {
      const isMatch = matching.includes(card);
      const visible = isMatch && ordered.indexOf(card) < shown;
      card.hidden = !visible;
    }

    const total = matching.length;
    const visibleCount = Math.min(shown, total);

    if (countEl) {
      countEl.innerHTML = `<strong>${total}</strong> ${total === 1 ? 'piece' : 'pieces'}${
        Object.keys(sel).length ? ' match your filters' : ''
      }`;
    }
    if (drawerCount) drawerCount.textContent = String(total);

    const activeCount = Object.values(sel).reduce((n, v) => n + v.length, 0);
    if (activeCountBadge) {
      activeCountBadge.textContent = String(activeCount);
      activeCountBadge.hidden = activeCount === 0;
    }

    renderChips(sel);

    if (noResults) noResults.hidden = total > 0;
    grid.hidden = total === 0;

    if (loadMore) {
      loadMore.hidden = total <= PAGE_SIZE;
      const shownEl = loadMore.querySelector('[data-shown]');
      const totalEl = loadMore.querySelector('[data-total]');
      const bar = loadMore.querySelector('[data-progress-bar]');
      if (shownEl) shownEl.textContent = String(visibleCount);
      if (totalEl) totalEl.textContent = String(total);
      if (bar) bar.style.width = `${Math.round((visibleCount / Math.max(total, 1)) * 100)}%`;
      if (loadMoreBtn) {
        loadMoreBtn.hidden = visibleCount >= total;
        loadMoreBtn.textContent = `Load ${Math.min(PAGE_SIZE, total - visibleCount)} more`;
      }
    }

    if (total === 0) renderSuggestions(sel);
    if (pushUrl) writeUrl(sel);
  }

  function renderChips(sel) {
    if (!chipsEl) return;
    chipsEl.textContent = '';
    const entries = [];
    for (const [name, values] of Object.entries(sel)) {
      for (const v of values) {
        const label =
          (LABELS[name] && LABELS[name][v]) || dynamicLabels[`${name}:${v}`] || `${FACETS[name].label}: ${v}`;
        entries.push({ name, value: v, label });
      }
    }
    if (!entries.length) return;

    for (const entry of entries) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.innerHTML = `<span>${escapeHtml(entry.label)}</span><span class="chip__x" aria-hidden="true">×</span>`;
      chip.setAttribute('aria-label', `Remove filter: ${entry.label}`);
      chip.addEventListener('click', () => {
        const input = form.querySelector(`input[name="${entry.name}"][value="${cssEscape(entry.value)}"]`);
        if (input) input.checked = false;
        shown = PAGE_SIZE;
        apply({ pushUrl: true });
        announce(`${entry.label} filter removed`);
        chipsEl.querySelector('button')?.focus();
      });
      chipsEl.append(chip);
    }

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'chip chip--clear';
    clear.textContent = 'Clear all';
    clear.addEventListener('click', clearAll);
    chipsEl.append(clear);
  }

  function clearAll() {
    form.querySelectorAll('input:checked').forEach((i) => (i.checked = false));
    shown = PAGE_SIZE;
    apply({ pushUrl: true });
    announce('All filters cleared');
    if (openFiltersBtn) openFiltersBtn.focus();
  }

  /* When nothing matches, say which single filter to drop — the one
   * whose removal returns the most products. */
  function renderSuggestions(sel) {
    const list = noResults && noResults.querySelector('[data-suggestions]');
    if (!list) return;
    list.textContent = '';
    const options = [];
    for (const [name, values] of Object.entries(sel)) {
      const reduced = { ...sel };
      delete reduced[name];
      const n = cards.filter((c) => matches(c, reduced)).length;
      if (n > 0) {
        const label =
          values
            .map((v) => (LABELS[name] && LABELS[name][v]) || dynamicLabels[`${name}:${v}`] || v)
            .join(' or ');
        options.push({ name, label, n, facet: FACETS[name].label });
      }
    }
    options.sort((a, b) => b.n - a.n);
    for (const opt of options.slice(0, 3)) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link';
      btn.textContent = `Drop “${opt.label}”`;
      btn.addEventListener('click', () => {
        form.querySelectorAll(`input[name="${opt.name}"]:checked`).forEach((i) => (i.checked = false));
        shown = PAGE_SIZE;
        apply({ pushUrl: true });
        announce(`Filter removed, ${opt.n} pieces now shown`);
      });
      li.append(btn, document.createTextNode(` — ${opt.n} ${opt.n === 1 ? 'piece' : 'pieces'} would match`));
      list.append(li);
    }
    if (!options.length) {
      const li = document.createElement('li');
      li.textContent = 'Clearing all filters shows everything in this collection.';
      list.append(li);
    }
  }

  function writeUrl(sel) {
    const params = new URLSearchParams();
    for (const [name, values] of Object.entries(sel)) {
      for (const v of values) params.append(name, v);
    }
    if (sortSelect && sortSelect.value !== 'featured') params.set('sort', sortSelect.value);
    const qs = params.toString();
    const next = qs ? `${location.pathname}?${qs}` : location.pathname;
    history.replaceState(null, '', next);
  }

  function applyFromUrl() {
    const params = new URLSearchParams(location.search);
    form.querySelectorAll('input:checked').forEach((i) => (i.checked = false));
    for (const [name, value] of params.entries()) {
      if (name === 'sort') {
        if (sortSelect && Array.from(sortSelect.options).some((o) => o.value === value)) sortSelect.value = value;
        continue;
      }
      const input = form.querySelector(`input[name="${name}"][value="${cssEscape(value)}"]`);
      if (input && !input.disabled) input.checked = true;
    }
  }

  /** Returns the scroll position to restore, or null. Also restores how
   * many products were on screen, so "load more" is not undone by
   * looking at one product. */
  function readSavedScroll() {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(STATE_KEY);
      const state = JSON.parse(raw);
      if (state.path !== location.pathname) return null;
      // Only restore when arriving back at the same filtered view.
      if ((state.search || '') !== (location.search || '')) return null;
      shown = Math.max(PAGE_SIZE, Number(state.shown) || PAGE_SIZE);
      const y = Number(state.scrollY);
      return Number.isFinite(y) && y > 0 ? y : null;
    } catch {
      return null;
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cssEscape(s) {
  return String(s).replace(/["\\]/g, '\\$&');
}
