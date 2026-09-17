/* ------------------------------------------------------------------ *
 * Bag page: line items, totals, discount code entry.
 * ------------------------------------------------------------------ */

import { catalogue } from './catalogue.mjs';
import * as store from './store.mjs';
import { renderLines, renderTotals } from './bag-ui.mjs';
import { announce, setFieldError, toast } from './ui.mjs';
import { discountCodes, formatMoney } from './commerce.mjs';

const empty = document.querySelector('[data-bag-empty]');
const linesEl = document.querySelector('[data-bag-lines]');
const summary = document.querySelector('[data-bag-summary]');
const totalsEl = document.querySelector('[data-totals]');
const continueEl = document.querySelector('[data-bag-continue]');

let data = null;

async function render() {
  const lines = store.getBag();
  const hasLines = lines.length > 0;

  if (empty) empty.hidden = hasLines;
  if (summary) summary.hidden = !hasLines;
  if (continueEl) continueEl.hidden = !hasLines;

  renderLines(linesEl, { editable: true });

  if (!hasLines) return;
  if (!data) {
    try {
      data = await catalogue();
    } catch {
      if (totalsEl) totalsEl.innerHTML = '<li><span>Total</span><span>Unavailable</span></li>';
      return;
    }
  }
  renderTotals(totalsEl, { data, context: 'bag' });
}

/* ------------------------- Discount code -------------------------- */
function initDiscount() {
  const toggle = document.querySelector('[data-discount-toggle]');
  const panel = document.getElementById('discount-field');
  const input = document.querySelector('[data-discount-input]');
  const applyBtn = document.querySelector('[data-discount-apply]');
  const errorEl = document.querySelector('[data-discount-error]');
  const okEl = document.querySelector('[data-discount-ok]');

  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      if (!open && input) input.focus();
    });
  }

  const existing = store.getDiscount();
  if (existing && input) {
    input.value = existing;
    if (panel) panel.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  if (!applyBtn || !input) return;

  applyBtn.addEventListener('click', () => {
    const code = input.value.trim().toUpperCase();
    if (!code) {
      store.setDiscount(null);
      setFieldError(input, null);
      if (okEl) okEl.hidden = true;
      render();
      return;
    }

    store.setDiscount(code);
    const totals = renderTotals(totalsEl, { data, context: 'bag' });

    if (totals && totals.discountError) {
      setFieldError(input, totals.discountError);
      if (okEl) okEl.hidden = true;
      announce(totals.discountError);
      // Keep the code in the field so it can be corrected, not retyped.
      store.setDiscount(null);
      renderTotals(totalsEl, { data, context: 'bag' });
      return;
    }

    setFieldError(input, null);
    if (okEl) {
      const label = totals && totals.discountLabel ? totals.discountLabel : 'Discount applied';
      const saved = totals && totals.discount > 0 ? ` You saved ${formatMoney(totals.discount)}.` : '';
      okEl.textContent = `${label}.${saved}`;
      okEl.hidden = false;
    }
    announce(`Discount code applied. ${totals && totals.discountLabel ? totals.discountLabel : ''}`);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyBtn.click();
    }
  });
}

store.on('bag:change', render);
initDiscount();
render();
