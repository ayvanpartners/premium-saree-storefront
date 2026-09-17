/* ------------------------------------------------------------------ *
 * Confirmation page: renders the order held in session storage.
 * ------------------------------------------------------------------ */

import * as store from './store.mjs';
import { renderLine } from './bag-ui.mjs';
import { formatMoney, formatDate } from './commerce.mjs';
import { el } from './ui.mjs';

const order = store.getLastOrder();
const wrap = document.querySelector('[data-confirmation]');
const missing = document.querySelector('[data-confirmation-missing]');

if (!order) {
  if (missing) missing.hidden = false;
  if (wrap) wrap.hidden = true;
} else {
  if (missing) missing.hidden = true;
  if (wrap) wrap.hidden = false;
  render(order);
}

function render(order) {
  document.title = `Order ${order.number} confirmed | ${document.title.split('|').pop().trim()}`;

  setText('[data-order-name]', order.address.firstName || 'there');
  setText('[data-order-number]', order.number);
  setText('[data-order-email]', order.email);

  const linesEl = document.querySelector('[data-confirmation-lines]');
  if (linesEl) {
    linesEl.textContent = '';
    for (const line of order.lines) linesEl.append(renderLine(line, { editable: false }));
  }

  const addressEl = document.querySelector('[data-confirmation-address]');
  if (addressEl) {
    const a = order.address;
    addressEl.innerHTML = [
      `${escapeHtml(a.firstName)} ${escapeHtml(a.lastName)}`,
      escapeHtml(a.line1),
      a.line2 ? escapeHtml(a.line2) : null,
      escapeHtml(a.city),
      a.county ? escapeHtml(a.county) : null,
      `<span class="numeric">${escapeHtml(a.postcode)}</span>`,
      escapeHtml(a.country)
    ]
      .filter(Boolean)
      .join('<br>');
    if (order.deliveryNote) {
      addressEl.innerHTML += `<br><br><span class="muted">Instructions: ${escapeHtml(order.deliveryNote)}</span>`;
    }
  }

  const shippingEl = document.querySelector('[data-confirmation-shipping]');
  if (shippingEl) {
    const parts = [`<strong>${escapeHtml(order.shipping.label)}</strong>`];
    if (order.shipping.carrier) parts.push(escapeHtml(order.shipping.carrier));
    if (order.shipping.namedDate) {
      parts.push(`Requested for ${formatDate(new Date(order.shipping.namedDate))}`);
    } else if (order.shipping.window) {
      parts.push(`Estimated arrival <strong>${escapeHtml(order.shipping.window)}</strong>`);
    }
    if (order.phone) parts.push(`Updates by text to ${escapeHtml(order.phone)}`);
    shippingEl.innerHTML = parts.join('<br>');
  }

  const totalsEl = document.querySelector('[data-confirmation-totals]');
  if (totalsEl) {
    const t = order.totals;
    totalsEl.textContent = '';
    const row = (label, value, cls = null, note = null) =>
      el(
        'li',
        { class: cls },
        el('span', {}, label, note ? el('small', { text: note }) : ''),
        el('span', { class: 'numeric', text: value })
      );
    totalsEl.append(row(`Items (${order.lines.reduce((n, l) => n + l.quantity, 0)})`, formatMoney(t.itemsTotal)));
    if (t.discount > 0) {
      totalsEl.append(row(t.discountLabel || 'Discount', `−${formatMoney(t.discount)}`, 'totals__discount'));
    }
    totalsEl.append(
      row(order.shipping.label, t.shippingCost === 0 ? 'Free' : formatMoney(t.shippingCost), null, order.shipping.carrier)
    );
    totalsEl.append(row('Total', formatMoney(t.total), 'totals__total'));
    totalsEl.append(
      el('li', { style: 'display:block;padding-top:0' },
        el('p', { class: 'xs muted', style: 'max-width:none', text: `Includes ${formatMoney(t.vat)} VAT. Not charged — demonstration only.` })
      )
    );
  }

  renderTimeline(order);
}

/* The "what happens next" timeline reflects what this order actually
 * involves — the tailoring step only appears when there is tailoring. */
function renderTimeline(order) {
  const list = document.querySelector('[data-confirmation-timeline]');
  if (!list) return;
  const dispatch = order.shipping.dispatchBy ? new Date(order.shipping.dispatchBy) : null;

  const stages = [
    {
      label: 'Order placed',
      meta: `${formatDate(new Date(order.placedAt))}. Confirmation emailed to ${order.email}.`,
      state: 'done'
    },
    {
      label: 'Preparing your order',
      meta: 'Checked, pressed and packed in our Leicester studio.',
      state: 'current'
    }
  ];

  if (order.hasCustomisation) {
    stages.push({
      label: 'With our tailor',
      meta: 'Your stitching is done before the order ships. This is why your dispatch date is later than a plain order.',
      state: 'todo'
    });
  }

  stages.push(
    {
      label: 'Dispatched',
      meta: dispatch
        ? `Expected to leave us by ${formatDate(dispatch)}. You will get an email with a tracking number.`
        : 'You will get an email with a tracking number.',
      state: 'todo'
    },
    {
      label: 'Delivered',
      meta: order.shipping.namedDate
        ? `Requested for ${formatDate(new Date(order.shipping.namedDate))}. The carrier will text a one-hour window on the morning.`
        : order.shipping.window
          ? `Estimated ${order.shipping.window}.`
          : '',
      state: 'todo'
    }
  );

  list.textContent = '';
  for (const s of stages) {
    const li = el('li', { dataset: { state: s.state } });
    li.append(el('p', { class: 'timeline__label', text: s.label }));
    if (s.meta) li.append(el('p', { class: 'timeline__meta', text: s.meta }));
    list.append(li);
  }
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
