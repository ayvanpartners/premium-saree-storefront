/* ------------------------------------------------------------------ *
 * Order tracking. Finds an order placed in this browser, or one of
 * three sample orders that exist so each tracking state is reviewable.
 * ------------------------------------------------------------------ */

import * as store from './store.mjs';
import { setFieldError, announce, el, focusFirstError } from './ui.mjs';
import { formatDate, formatMoney, validatePostcode, normalisePostcode, addWorkingDays } from './commerce.mjs';

/* SAMPLE ORDERS. Dates are relative to today so the states always read
 * sensibly however long after the build this is opened. */
function sampleOrders() {
  const now = new Date();
  const daysAgo = (n) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - n);
    return d;
  };
  return {
    'SR-204815': {
      number: 'SR-204815',
      postcode: 'HA0 4LP',
      name: 'Priya',
      placedAt: daysAgo(3).toISOString(),
      stage: 'dispatched',
      hasCustomisation: false,
      carrier: 'Royal Mail Tracked 48',
      trackingRef: 'AB123456789GB',
      eta: addWorkingDays(now, 1),
      items: [{ name: 'Anaya Banarasi Brocade Saree, warm ivory', quantity: 1, price: 29800 }],
      total: 29800,
      address: 'Wembley HA0 4LP'
    },
    'SR-118342': {
      number: 'SR-118342',
      postcode: 'M1 1AE',
      name: 'Meera',
      placedAt: daysAgo(4).toISOString(),
      stage: 'tailoring',
      hasCustomisation: true,
      carrier: 'Royal Mail Tracked 48',
      trackingRef: null,
      eta: addWorkingDays(now, 6),
      items: [
        { name: 'Meenakshi Kanjivaram Silk Saree, deep burgundy', quantity: 1, price: 42500 },
        { name: 'Blouse stitched to your measurements', quantity: 1, price: 3500 },
        { name: 'Fall and pico stitching', quantity: 1, price: 1200 }
      ],
      total: 47200,
      address: 'Manchester M1 1AE'
    },
    'SR-993027': {
      number: 'SR-993027',
      postcode: 'EH1 1YZ',
      name: 'Anjali',
      placedAt: daysAgo(9).toISOString(),
      stage: 'delivered',
      hasCustomisation: false,
      carrier: 'DPD Next Day',
      trackingRef: 'DPD8827364511',
      deliveredAt: daysAgo(6),
      eta: daysAgo(6),
      items: [{ name: 'Mira Ready-to-Wear Georgette Saree, charcoal, UK 12', quantity: 1, price: 16800 }],
      total: 17195,
      address: 'Edinburgh EH1 1YZ'
    }
  };
}

const form = document.querySelector('[data-track-form]');
const result = document.querySelector('[data-track-result]');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const numberInput = document.getElementById('orderNumber');
    const postcodeInput = document.getElementById('trackPostcode');
    let ok = true;

    const rawNumber = numberInput.value.trim().toUpperCase();
    if (!rawNumber) {
      setFieldError(numberInput, 'Enter the order number from your confirmation email.');
      ok = false;
    } else if (!/^SR-?\d{6}$/i.test(rawNumber)) {
      setFieldError(
        numberInput,
        'Order numbers look like SR-123456. Check your confirmation email — it is on the first line.'
      );
      ok = false;
    } else {
      setFieldError(numberInput, null);
    }

    const pc = validatePostcode(postcodeInput.value);
    if (!pc.ok) {
      setFieldError(postcodeInput, pc.message);
      ok = false;
    } else {
      setFieldError(postcodeInput, null);
    }

    if (!ok) {
      announce('We need a little more before we can look that up.');
      focusFirstError(form);
      return;
    }

    const number = rawNumber.startsWith('SR-') ? rawNumber : rawNumber.replace(/^SR/i, 'SR-');
    const postcode = pc.value;

    // Real order placed in this browser first, then the samples.
    const own = store.findOrder(number, postcode);
    if (own) {
      renderOwnOrder(own);
      return;
    }
    const samples = sampleOrders();
    const sample = samples[number];
    if (sample && normalisePostcode(sample.postcode) === postcode) {
      renderSample(sample);
      return;
    }
    renderNotFound(number, postcode, Boolean(sample));
  });
}

function heading(text) {
  return el('h2', { class: 'h3 mb-4', text });
}

function timeline(stages) {
  const ol = el('ol', { class: 'timeline' });
  for (const s of stages) {
    const li = el('li', { dataset: { state: s.state } });
    li.append(el('p', { class: 'timeline__label', text: s.label }));
    if (s.meta) li.append(el('p', { class: 'timeline__meta', text: s.meta }));
    ol.append(li);
  }
  return ol;
}

function stagesFor(order) {
  const order_ = ['placed', 'preparing', 'tailoring', 'dispatched', 'out', 'delivered'];
  const list = [
    { id: 'placed', label: 'Order placed', meta: `${formatDate(new Date(order.placedAt))}` },
    { id: 'preparing', label: 'Preparing your order', meta: 'Checked, pressed and packed in Leicester.' }
  ];
  if (order.hasCustomisation) {
    list.push({ id: 'tailoring', label: 'With our tailor', meta: 'Stitching in progress. This sets the dispatch date.' });
  }
  list.push({
    id: 'dispatched',
    label: 'Dispatched',
    meta: order.trackingRef ? `${order.carrier} · ${order.trackingRef}` : `Will ship with ${order.carrier}.`
  });
  list.push({
    id: 'delivered',
    label: 'Delivered',
    meta:
      order.stage === 'delivered' && order.deliveredAt
        ? `Delivered ${formatDate(order.deliveredAt)}.`
        : order.eta
          ? `Estimated ${formatDate(order.eta)}.`
          : ''
  });

  const currentIndex = order_.indexOf(order.stage);
  return list.map((s) => {
    const idx = order_.indexOf(s.id);
    return {
      ...s,
      state: idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : 'todo'
    };
  });
}

function renderSample(order) {
  result.hidden = false;
  result.textContent = '';
  result.append(
    el(
      'div',
      { class: 'order-summary' },
      el('p', { class: 'eyebrow', text: `Order ${order.number}` }),
      el('h2', { class: 'h3', style: 'margin-block:var(--sp-2) var(--sp-4)', text: statusHeadline(order) }),
      el('p', { class: 'small muted', text: `Placed ${formatDate(new Date(order.placedAt))} · Delivering to ${order.address}` })
    )
  );

  const detail = el('div', { class: 'mt-6' });
  detail.append(heading('Progress'), timeline(stagesFor(order)));

  const items = el('div', { class: 'mt-6' });
  items.append(heading('In this order'));
  const ul = el('ul', { class: 'totals' });
  for (const item of order.items) {
    ul.append(
      el(
        'li',
        {},
        el('span', { text: `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ''}` }),
        el('span', { class: 'numeric', text: formatMoney(item.price) })
      )
    );
  }
  ul.append(
    el('li', { class: 'totals__total' }, el('span', { text: 'Total paid' }), el('span', { class: 'numeric', text: formatMoney(order.total) }))
  );
  items.append(ul);

  const help = el('div', { class: 'mt-6' });
  help.append(
    el('div', { class: 'notice notice--info' },
      el('div', { class: 'notice__body' },
        el('p', {}, el('strong', { text: 'Sample order' })),
        el('p', { text: 'This is demonstration data so each tracking state can be reviewed. There is no real parcel and no real tracking number.' })
      )
    )
  );

  result.append(detail, items, help);
  result.scrollIntoView({ block: 'start', behavior: 'smooth' });
  announce(`Order ${order.number} found. ${statusHeadline(order)}`);
}

function statusHeadline(order) {
  switch (order.stage) {
    case 'delivered':
      return 'Delivered';
    case 'dispatched':
      return `On its way — estimated ${formatDate(order.eta)}`;
    case 'tailoring':
      return `With our tailor — estimated ${formatDate(order.eta)}`;
    default:
      return 'Being prepared';
  }
}

function renderOwnOrder(order) {
  result.hidden = false;
  result.textContent = '';
  result.append(
    el(
      'div',
      { class: 'order-summary' },
      el('p', { class: 'eyebrow', text: `Order ${order.number}` }),
      el('h2', { class: 'h3', style: 'margin-block:var(--sp-2) var(--sp-4)', text: 'Being prepared' }),
      el('p', {
        class: 'small muted',
        text: `Placed ${formatDate(new Date(order.placedAt))} · Delivering to ${order.address.city} ${order.address.postcode}`
      })
    )
  );

  const stages = stagesFor({
    placedAt: order.placedAt,
    stage: 'preparing',
    hasCustomisation: order.hasCustomisation,
    carrier: order.shipping.carrier,
    trackingRef: null,
    eta: order.shipping.dispatchBy ? new Date(order.shipping.dispatchBy) : null
  });

  const detail = el('div', { class: 'mt-6' });
  detail.append(heading('Progress'), timeline(stages));

  const items = el('div', { class: 'mt-6' });
  items.append(heading('In this order'));
  const ul = el('ul', { class: 'totals' });
  for (const line of order.lines) {
    ul.append(
      el(
        'li',
        {},
        el('span', { text: `${line.name}${line.quantity > 1 ? ` × ${line.quantity}` : ''}` }),
        el('span', { class: 'numeric', text: formatMoney(line.price * line.quantity) })
      )
    );
  }
  ul.append(
    el('li', { class: 'totals__total' }, el('span', { text: 'Order total' }), el('span', { class: 'numeric', text: formatMoney(order.totals.total) }))
  );
  items.append(ul);

  const note = el('div', { class: 'notice notice--warn mt-6' },
    el('div', { class: 'notice__body' },
      el('p', {}, el('strong', { text: 'This is the demonstration order you placed in this browser.' })),
      el('p', { text: 'No payment was taken and no parcel exists. It is stored in this browser session only, and disappears when you close the tab.' })
    )
  );

  result.append(detail, items, note);
  result.scrollIntoView({ block: 'start', behavior: 'smooth' });
  announce(`Order ${order.number} found. Being prepared.`);
}

function renderNotFound(number, postcode, numberExists) {
  result.hidden = false;
  result.innerHTML = `
    <div class="empty-state">
      <h2>We cannot find that order</h2>
      <p>
        ${
          numberExists
            ? `Order <strong class="numeric">${number}</strong> exists, but not with the postcode <strong class="numeric">${postcode}</strong>. Check the delivery postcode on your confirmation email — it may have gone to a different address.`
            : `Nothing matches order <strong class="numeric">${number}</strong> with postcode <strong class="numeric">${postcode}</strong>.`
        }
      </p>
      <div class="empty-state__suggest">
        <h3 class="h4 mb-4">Worth checking</h3>
        <ul class="stack-2 small">
          <li>The order number is on the first line of your confirmation email, in the form SR-123456.</li>
          <li>Use the <strong>delivery</strong> postcode, not your billing postcode.</li>
          <li>If you ordered as a guest, the confirmation email is the only copy — check your spam folder.</li>
          <li>This is a demonstration: only orders placed in this browser and the three sample orders above can be found.</li>
        </ul>
        <p class="mt-5"><a class="btn btn--quiet" href="../contact/">Contact us and we will find it</a></p>
      </div>
    </div>`;
  result.scrollIntoView({ block: 'start', behavior: 'smooth' });
  announce('We could not find that order. Suggestions are below the form.');
}
