/* ------------------------------------------------------------------ *
 * Shared rendering for bag lines and totals.
 *
 * Used by the bag drawer, the bag page, the checkout summary and the
 * confirmation page, so a line item looks and reads the same
 * everywhere and the arithmetic is done in exactly one place.
 * ------------------------------------------------------------------ */

import { formatMoney, bagTotals, estimateDelivery, formatWindow, formatDate } from './commerce.mjs';
import { getBag, lineKey, removeLine, updateQuantity, rememberRemoved, restoreRemoved, getDiscount, getShippingId } from './store.mjs';
import { el, toast, announce, escapeHtml } from './ui.mjs';

/** Human summary of the choices made on a line. */
export function lineOptions(line) {
  const out = [];
  if (line.colourName) out.push(['Colour', line.colourName]);
  if (line.size) out.push(['Size', line.size]);
  if (line.blouseOptions) {
    if (line.blouseOptions.neckline) out.push(['Neckline', line.blouseOptions.neckline]);
    if (line.blouseOptions.sleeve) out.push(['Sleeve', line.blouseOptions.sleeve]);
  }
  if (line.measurements && Object.keys(line.measurements).length) {
    const parts = Object.entries(line.measurements).map(([k, v]) => `${k} ${v}cm`);
    out.push(['Measurements', parts.join(', ')]);
  }
  return out;
}

export function lineHasCustomisation(line) {
  return (line.services || []).length > 0;
}

export function renderLine(line, { editable = true, compact = false, catalogueData = null } = {}) {
  const key = lineKey(line);
  const services = line.services || [];
  const unit = line.price + services.reduce((s, sv) => s + sv.price, 0);
  const total = unit * line.quantity;

  const opts = lineOptions(line);
  const wrap = el('article', {
    class: `line-item${line.unavailable ? ' line-item--unavailable' : ''}`,
    dataset: { lineKey: key }
  });

  const media = el(
    'div',
    { class: 'line-item__media' },
    el('img', {
      src: line.image,
      alt: '',
      width: 900,
      height: 1200,
      loading: 'lazy',
      decoding: 'async'
    })
  );

  const bodyChildren = [
    el(
      'h3',
      { class: 'line-item__name' },
      el('a', { href: line.href, text: line.name })
    )
  ];

  if (line.unavailable) {
    bodyChildren.push(
      el('p', {
        class: 'small',
        style: 'color:var(--warn);font-weight:600;margin-top:var(--sp-2)',
        text: line.unavailableReason || 'No longer available in this option.'
      })
    );
  }

  if (opts.length) {
    const dl = el('dl', { class: 'line-item__opts' });
    for (const [k, v] of opts) {
      dl.append(
        el('div', {}, el('dt', { text: `${k}: ` }), el('dd', { style: 'display:inline;margin:0', text: v }))
      );
    }
    bodyChildren.push(dl);
  }

  if (services.length) {
    const ul = el('ul', { class: 'line-item__svc' });
    for (const s of services) {
      ul.append(
        el(
          'li',
          {},
          el('span', { text: s.label }),
          el('span', { class: 'numeric nowrap', text: `+ ${formatMoney(s.price)}` })
        )
      );
    }
    ul.append(
      el('li', {
        class: 'xs',
        style: 'color:var(--warn);display:block;margin-top:var(--sp-1)',
        text: 'Made to your measurements, so this line cannot be returned.'
      })
    );
    bodyChildren.push(ul);
  }

  const foot = el('div', { class: 'line-item__foot' });

  if (editable) {
    const qty = el('div', { class: 'qty' });
    const down = el('button', {
      type: 'button',
      'aria-label': `Reduce quantity of ${line.name}`,
      text: '−',
      disabled: line.quantity <= 1 ? true : null,
      onclick: () => {
        updateQuantity(key, line.quantity - 1);
        announce(`${line.name} quantity reduced to ${line.quantity - 1}`);
      }
    });
    const input = el('input', {
      type: 'number',
      min: '1',
      max: '10',
      value: String(line.quantity),
      inputmode: 'numeric',
      'aria-label': `Quantity of ${line.name}`,
      onchange: (e) => {
        const v = Number(e.target.value);
        if (!Number.isFinite(v) || v < 1) {
          e.target.value = String(line.quantity);
          return;
        }
        updateQuantity(key, v);
      }
    });
    const up = el('button', {
      type: 'button',
      'aria-label': `Increase quantity of ${line.name}`,
      text: '+',
      disabled: line.quantity >= 10 ? true : null,
      onclick: () => {
        updateQuantity(key, line.quantity + 1);
        announce(`${line.name} quantity increased to ${line.quantity + 1}`);
      }
    });
    qty.append(down, input, up);

    const actions = el('div', { class: 'line-item__actions' });
    if (line.href) {
      actions.append(el('a', { class: 'link link--quiet small', href: line.href, text: 'Edit options' }));
    }
    actions.append(
      el('button', {
        type: 'button',
        text: 'Remove',
        onclick: () => {
          rememberRemoved(line);
          removeLine(key);
          toast(`${line.name} removed from your bag.`, {
            action: {
              label: 'Undo',
              onClick: () => {
                restoreRemoved();
                toast('Put back in your bag.');
              }
            }
          });
        }
      })
    );

    foot.append(qty, actions);
  } else {
    foot.append(el('p', { class: 'small muted', text: `Quantity ${line.quantity}` }));
  }

  foot.append(
    el(
      'p',
      { class: 'line-item__price numeric' },
      total !== unit * line.quantity ? '' : formatMoney(total)
    )
  );

  bodyChildren.push(foot);

  wrap.append(media, el('div', {}, ...bodyChildren));
  return wrap;
}

export function renderLines(container, { editable = true } = {}) {
  if (!container) return [];
  const lines = getBag();
  container.textContent = '';
  for (const line of lines) {
    container.append(renderLine(line, { editable }));
  }
  return lines;
}

/** Totals list. `context` tailors the wording per surface. */
export function renderTotals(container, { data, context = 'bag', shippingId = null, lines = null } = {}) {
  if (!container) return null;
  const bagLines = lines || getBag();
  const totals = bagTotals({
    lines: bagLines,
    shippingId: shippingId || getShippingId(),
    discountCode: getDiscount(),
    shippingOptions: data.shipping
  });

  container.textContent = '';

  const row = (label, value, opts = {}) =>
    el(
      'li',
      { class: opts.class || null },
      el('span', {}, label, opts.note ? el('small', { text: opts.note }) : ''),
      el('span', { class: 'numeric', text: value })
    );

  const itemCount = bagLines.reduce((n, l) => n + l.quantity, 0);
  container.append(row(`Items (${itemCount})`, formatMoney(totals.itemsTotal)));

  if (totals.servicesTotal > 0) {
    container.append(
      row('Included tailoring', formatMoney(totals.servicesTotal), {
        note: 'Already counted in the item total above'
      })
    );
  }

  if (totals.discount > 0) {
    container.append(
      row(totals.discountLabel || 'Discount', `−${formatMoney(totals.discount)}`, { class: 'totals__discount' })
    );
  }

  container.append(
    row(
      totals.shippingOption.label,
      totals.shippingCost === 0 ? 'Free' : formatMoney(totals.shippingCost),
      { note: totals.shippingOption.carrier }
    )
  );

  if (totals.freeShippingGap != null && totals.freeShippingGap > 0 && context !== 'confirmation') {
    container.append(
      el('li', { style: 'display:block' },
        el('p', {
          class: 'xs',
          style: 'color:var(--ok);max-width:none',
          text: `Spend ${formatMoney(totals.freeShippingGap)} more for free standard delivery.`
        })
      )
    );
  }

  container.append(row('Total', formatMoney(totals.total), { class: 'totals__total' }));
  container.append(
    el('li', { style: 'display:block;padding-top:0' },
      el('p', {
        class: 'xs muted',
        style: 'max-width:none',
        text: `Includes ${formatMoney(totals.vat)} VAT.`
      })
    )
  );

  return totals;
}

/** Latest delivery window across every line, which is what the customer
 * actually experiences when an order ships together. */
export function orderDelivery({ data, lines = null, shippingId = null, now = new Date() }) {
  const bagLines = lines || getBag();
  if (!bagLines.length) return null;
  const shipping = data.shipping.find((s) => s.id === (shippingId || getShippingId())) || data.shipping[0];

  let latest = null;
  let earliest = null;
  let dispatch = null;
  for (const line of bagLines) {
    const serviceLeadDays = (line.services || []).reduce((max, s) => Math.max(max, s.leadDays || 0), 0);
    const est = estimateDelivery({
      stock: line.stock || 'in-stock',
      serviceLeadDays,
      shipping,
      handling: data.handling,
      now
    });
    if (!est) continue;
    if (!latest || est.latest > latest) latest = est.latest;
    if (!earliest || est.earliest > earliest) earliest = est.earliest;
    if (!dispatch || est.dispatch > dispatch) dispatch = est.dispatch;
  }
  if (!latest) return null;
  return { earliest, latest, dispatch, shipping, label: formatWindow(earliest, latest) };
}

export { formatMoney, formatWindow, formatDate, bagTotals };
