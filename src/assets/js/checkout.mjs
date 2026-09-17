/* ------------------------------------------------------------------ *
 * Checkout: validation, UK postcode lookup, delivery method, order
 * placement, and recovery from the three things that actually go wrong
 * — a declined payment, stock disappearing, and an expired session.
 *
 * No card details are collected anywhere in this file. That is
 * deliberate: see the notice rendered on the page.
 * ------------------------------------------------------------------ */

import { catalogue } from './catalogue.mjs';
import * as store from './store.mjs';
import { renderLines, renderTotals, orderDelivery } from './bag-ui.mjs';
import { announce, setFieldError, focusFirstError, toast, el } from './ui.mjs';
import {
  formatMoney,
  formatWindow,
  formatDate,
  validatePostcode,
  lookupPostcode,
  normalisePostcode,
  estimateDelivery,
  makeOrderNumber,
  bagTotals,
  discountCodes
} from './commerce.mjs';

const form = document.querySelector('[data-checkout-form]');
const emptyEl = document.querySelector('[data-checkout-empty]');
const mainEl = document.querySelector('[data-checkout-main]');
const alertsEl = document.querySelector('[data-checkout-alerts]');
const linesEl = document.querySelector('[data-checkout-lines]');
const totalsEl = document.querySelector('[data-checkout-totals]');
const shippingEl = document.querySelector('[data-shipping-options]');
const submitTotal = document.querySelector('[data-submit-total]');
const contextEl = document.querySelector('[data-delivery-context]');

let data = null;
const simulated = { payment: false, stock: false, session: false };

boot();

async function boot() {
  const lines = store.getBag();
  if (!lines.length) {
    if (emptyEl) emptyEl.hidden = false;
    if (mainEl) mainEl.hidden = true;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;
  if (mainEl) mainEl.hidden = false;

  try {
    data = await catalogue();
  } catch {
    if (alertsEl) {
      alertsEl.append(
        alert(
          'err',
          'We could not load delivery options',
          'Something went wrong fetching our delivery data. Reload the page, and if it keeps happening please contact us — we can take an order over the phone.'
        )
      );
    }
    return;
  }

  renderShipping();
  renderSummary();
  initValidation();
  initPostcode();
  initCountry();
  initDiscount();
  initSimulations();

  store.on('bag:change', () => {
    if (!store.getBag().length) {
      if (emptyEl) emptyEl.hidden = false;
      if (mainEl) mainEl.hidden = true;
      return;
    }
    renderSummary();
    renderShipping();
  });

  form.addEventListener('submit', onSubmit);
}

/* ---------------------------- Rendering --------------------------- */
function renderSummary() {
  renderLines(linesEl, { editable: false });
  const totals = renderTotals(totalsEl, { data, context: 'checkout', shippingId: currentShipping() });
  if (submitTotal && totals) submitTotal.textContent = formatMoney(totals.total);

  const caveat = document.querySelector('[data-returns-caveat]');
  if (caveat) {
    const custom = store.getBag().filter((l) => (l.services || []).length);
    caveat.textContent = custom.length
      ? `${custom.length} ${custom.length === 1 ? 'line is' : 'lines are'} made to your measurements and cannot be returned.`
      : 'Everything in this order is returnable within 30 days.';
  }
  return totals;
}

function currentShipping() {
  const checked = form.querySelector('input[name="shipping"]:checked');
  return checked ? checked.value : store.getShippingId();
}

function renderShipping() {
  if (!shippingEl || !data) return;
  const selected = currentShipping();
  const region = (form.querySelector('[data-country]') || {}).value || 'uk';

  const options =
    region === 'uk'
      ? data.shipping
      : data.international.regions
          .filter((r) => r.id === region)
          .map((r) => ({ id: r.id, label: r.label, carrier: 'Tracked international', minDays: r.minDays, maxDays: r.maxDays, price: r.price, freeOver: null, note: 'Duties payable by the recipient.' }));

  shippingEl.innerHTML = '';
  for (const option of options) {
    const est = orderDelivery({ data, shippingId: option.id, lines: store.getBag() }) || null;
    // International options are not in the shared shipping list, so
    // estimate directly for them.
    const window_ =
      est && data.shipping.some((s) => s.id === option.id)
        ? est.label
        : estimateWindowFor(option);

    const totals = bagTotals({
      lines: store.getBag(),
      shippingId: option.id,
      discountCode: store.getDiscount(),
      shippingOptions: [...data.shipping, ...options]
    });

    const wrap = el('div', { class: 'payment-option' });
    const label = el('label', { class: 'check', style: 'min-height:2.5rem' });
    const input = el('input', {
      type: 'radio',
      name: 'shipping',
      value: option.id,
      checked: option.id === selected ? true : null
    });
    input.addEventListener('change', () => {
      store.setShippingId(option.id);
      renderSummary();
      toggleNamedDay();
      announce(`${option.label} selected. Estimated arrival ${window_}.`);
    });

    const text = el('span', { class: 'check__text' });
    text.append(
      el('strong', { text: option.label }),
      el('span', {
        class: 'check__note',
        text: `${window_} · ${option.carrier}`
      }),
      el('span', {
        class: 'check__note',
        style: 'font-weight:600;color:var(--ink)',
        text: totals.shippingCost === 0 ? 'Free' : formatMoney(option.price)
      }),
      el('span', { class: 'check__note', text: option.note })
    );
    label.append(input, text);
    wrap.append(label);
    shippingEl.append(wrap);
  }

  toggleNamedDay();

  if (contextEl) {
    const slowest = store.getBag().reduce(
      (acc, l) => {
        const lead = (l.services || []).reduce((m, s) => Math.max(m, s.leadDays || 0), 0);
        const handling = data.handling[l.stock || 'in-stock'] || 1;
        return handling + lead > acc.total ? { total: handling + lead, line: l, lead } : acc;
      },
      { total: 0, line: null, lead: 0 }
    );
    if (slowest.line) {
      contextEl.textContent =
        slowest.lead > 0
          ? `Dates below account for the tailoring on “${slowest.line.name}”, which adds ${slowest.lead} working days. Your order ships together.`
          : slowest.line.stock === 'made-to-order'
            ? `“${slowest.line.name}” is made to order, which sets the dispatch date for the whole order. Ask us to split the order if you would rather have the rest sooner.`
            : 'Your order ships together from Leicester.';
    }
  }
}

function estimateWindowFor(option) {
  const lines = store.getBag();
  let latest = null;
  let earliest = null;
  for (const line of lines) {
    const lead = (line.services || []).reduce((m, s) => Math.max(m, s.leadDays || 0), 0);
    const est = estimateDelivery({
      stock: line.stock || 'in-stock',
      serviceLeadDays: lead,
      shipping: option,
      handling: data.handling,
      now: new Date()
    });
    if (!est) continue;
    if (!latest || est.latest > latest) latest = est.latest;
    if (!earliest || est.earliest > earliest) earliest = est.earliest;
  }
  return latest ? formatWindow(earliest, latest) : 'Date unavailable';
}

function toggleNamedDay() {
  const field = document.querySelector('[data-namedday-field]');
  const input = document.querySelector('[data-namedday-input]');
  if (!field || !input) return;
  const isNamed = currentShipping() === 'namedday';
  field.hidden = !isNamed;
  if (isNamed && data) {
    const est = orderDelivery({ data, shippingId: 'namedday', lines: store.getBag() });
    if (est) {
      const min = est.earliest;
      const max = new Date(min.getTime());
      max.setDate(max.getDate() + 21);
      const iso = (d) => d.toISOString().slice(0, 10);
      input.min = iso(min);
      input.max = iso(max);
      if (!input.value) input.value = iso(min);
    }
  }
}

/* ---------------------------- Validation -------------------------- */
const VALIDATORS = {
  email(value) {
    if (!value.trim()) return 'Enter your email address so we can send your confirmation.';
    // Deliberately permissive: the only real test is delivery.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
      return 'That does not look like an email address. Check for a missing @ or a typo in the domain.';
    }
    return null;
  },
  phone(value) {
    const v = value.trim();
    if (!v) return null; // optional
    if (!/^[\d\s+()-]{9,20}$/.test(v)) return 'Enter a phone number using digits, spaces and + only.';
    return null;
  },
  text(value) {
    return value.trim() ? null : 'This one is needed.';
  },
  postcode(value) {
    const r = validatePostcode(value);
    return r.ok ? null : r.message;
  }
};

function initValidation() {
  form.querySelectorAll('[data-validate]').forEach((input) => {
    const run = () => {
      const kind = input.dataset.validate;
      const validator = VALIDATORS[kind];
      if (!validator) return true;
      let message = validator(input.value);
      if (message && kind === 'text') {
        const labelEl = input.closest('.field').querySelector('.field__label');
        const label = labelEl ? labelEl.textContent.replace(/\s*\(optional\)\s*$/i, '').trim() : 'This field';
        message = `Enter your ${label.toLowerCase()}.`;
      }
      setFieldError(input, message);
      return !message;
    };
    input.addEventListener('blur', run);
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') run();
    });
    input.__validate = run;
  });
}

function validateAll() {
  let ok = true;
  const manual = document.getElementById('manual-address');
  form.querySelectorAll('[data-validate]').forEach((input) => {
    // Skip address fields that are hidden because lookup is in use.
    if (manual && manual.hidden && manual.contains(input)) return;
    if (input.closest('[hidden]')) return;
    if (input.__validate && !input.__validate()) ok = false;
  });

  // Named-day needs a date and a phone number.
  if (currentShipping() === 'namedday') {
    const date = document.querySelector('[data-namedday-input]');
    if (date && !date.value) {
      setFieldError(date, 'Choose the day you would like it to arrive.');
      ok = false;
    }
    const phone = document.getElementById('phone');
    if (phone && !phone.value.trim()) {
      setFieldError(phone, 'Named-day delivery needs a mobile number so the carrier can text your arrival window.');
      ok = false;
    }
  }

  // An address must exist one way or the other.
  const line1 = document.getElementById('line1');
  const postcode = document.getElementById('postcode');
  if (manual && manual.hidden && (!line1.value.trim() || !postcode.value.trim())) {
    const lookupInput = document.querySelector('[data-postcode-input]');
    setFieldError(
      lookupInput,
      'Find your address with your postcode, or enter it manually using the link below.'
    );
    ok = false;
  }

  return ok;
}

/* -------------------------- Postcode lookup ----------------------- */
function initPostcode() {
  const input = document.querySelector('[data-postcode-input]');
  const findBtn = document.querySelector('[data-postcode-find]');
  const resultsField = document.querySelector('[data-postcode-results]');
  const picker = document.querySelector('[data-address-pick]');
  const manualToggle = document.querySelector('[data-manual-toggle]');
  const manual = document.getElementById('manual-address');
  if (!input || !findBtn || !manual) return;

  function showManual(focus = true) {
    manual.hidden = false;
    if (manualToggle) {
      manualToggle.setAttribute('aria-expanded', 'true');
      manualToggle.textContent = 'Use postcode lookup instead';
    }
    if (focus) {
      const first = document.getElementById('line1');
      if (first) first.focus();
    }
  }

  function hideManual() {
    manual.hidden = true;
    if (manualToggle) {
      manualToggle.setAttribute('aria-expanded', 'false');
      manualToggle.textContent = 'Enter address manually instead';
    }
  }

  if (manualToggle) {
    manualToggle.addEventListener('click', () => {
      if (manual.hidden) showManual();
      else hideManual();
    });
  }

  findBtn.addEventListener('click', () => {
    const check = validatePostcode(input.value);
    if (!check.ok) {
      setFieldError(input, check.message);
      announce(check.message);
      return;
    }
    setFieldError(input, null);
    findBtn.classList.add('btn--busy');

    // A real lookup is a network call; the delay is here so the loading
    // state is real rather than decorative.
    setTimeout(() => {
      findBtn.classList.remove('btn--busy');
      const result = lookupPostcode(input.value);

      if (result.status === 'found') {
        if (resultsField) resultsField.hidden = false;
        picker.innerHTML =
          `<option value="">${result.addresses.length} addresses found — choose one</option>` +
          result.addresses
            .map(
              (a, i) =>
                `<option value="${i}">${[a.line1, a.line2, a.city].filter(Boolean).join(', ')}</option>`
            )
            .join('');
        picker.focus();
        announce(`${result.addresses.length} addresses found for ${result.postcode}.`);

        picker.onchange = () => {
          const chosen = result.addresses[Number(picker.value)];
          if (!chosen) return;
          document.getElementById('line1').value = chosen.line1;
          document.getElementById('line2').value = chosen.line2 || '';
          document.getElementById('city').value = chosen.city;
          document.getElementById('postcode').value = result.postcode;
          showManual(false);
          form.querySelectorAll('#manual-address [data-validate]').forEach((i) => {
            if (i.__validate) i.__validate();
          });
          announce('Address filled in. Check it and change anything that is wrong.');
        };
      } else {
        // Unknown postcode must never be a dead end.
        if (resultsField) resultsField.hidden = true;
        setFieldError(
          input,
          `We could not find addresses for ${result.postcode || input.value.trim()}. This demonstration only holds a few postcodes — enter your address below instead.`
        );
        document.getElementById('postcode').value = normalisePostcode(input.value) || input.value.trim();
        showManual();
        announce('No addresses found. Manual entry is open below and your postcode has been carried over.');
      }
    }, 550);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findBtn.click();
    }
  });
}

/* --------------------------- Country note ------------------------- */
function initCountry() {
  const select = form.querySelector('[data-country]');
  const note = document.querySelector('[data-duties-note]');
  if (!select) return;
  select.addEventListener('change', () => {
    if (note) note.hidden = select.value === 'uk';
    store.setShippingId(select.value === 'uk' ? 'standard' : select.value);
    renderShipping();
    renderSummary();
    if (select.value !== 'uk') {
      announce('Delivering outside the UK. Import duty and local tax may apply and are paid by the recipient.');
    }
  });
}

/* ---------------------------- Discount ---------------------------- */
function initDiscount() {
  const toggle = document.querySelector('[data-discount-toggle]');
  const panel = document.getElementById('checkout-discount');
  const input = document.querySelector('[data-discount-input]');
  const applyBtn = document.querySelector('[data-discount-apply]');
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
    store.setDiscount(code || null);
    const totals = renderSummary();
    if (totals && totals.discountError) {
      setFieldError(input, totals.discountError);
      if (okEl) okEl.hidden = true;
      store.setDiscount(null);
      renderSummary();
      announce(totals.discountError);
    } else {
      setFieldError(input, null);
      if (okEl && totals) {
        okEl.textContent = `${totals.discountLabel || 'Discount applied'}. You saved ${formatMoney(totals.discount)}.`;
        okEl.hidden = false;
      }
      announce('Discount applied.');
    }
  });
}

/* ----------------------- Demonstration states --------------------- */
function alert(tone, heading, body, actions = []) {
  const toneClass = { err: 'notice--err', warn: 'notice--warn', info: 'notice--info' }[tone] || '';
  const wrap = el('div', { class: `notice ${toneClass}`, role: tone === 'err' ? 'alert' : null, tabindex: '-1' });
  const bodyEl = el('div', { class: 'notice__body' });
  bodyEl.append(el('p', {}, el('strong', { text: heading })), el('p', { text: body }));
  if (actions.length) {
    const cluster = el('div', { class: 'cluster', style: 'margin-top:var(--sp-3)' });
    for (const a of actions) {
      const btn = el('button', { class: 'btn btn--sm btn--quiet', type: 'button', text: a.label });
      btn.addEventListener('click', a.onClick);
      cluster.append(btn);
    }
    bodyEl.append(cluster);
  }
  wrap.append(bodyEl);
  return wrap;
}

function initSimulations() {
  document.querySelectorAll('[data-simulate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.simulate;
      if (kind === 'reset') {
        simulated.payment = false;
        simulated.stock = false;
        simulated.session = false;
        alertsEl.textContent = '';
        store.getBag().forEach((l) => {});
        restoreStock();
        toast('Simulated problems cleared.');
        return;
      }
      if (kind === 'payment-failure') {
        simulated.payment = true;
        toast('Next attempt to place the order will be declined.', { title: 'Simulation armed' });
      }
      if (kind === 'stock-change') {
        simulated.stock = true;
        applyStockProblem();
      }
      if (kind === 'session-expiry') {
        simulated.session = true;
        showSessionExpiry();
      }
    });
  });
}

function applyStockProblem() {
  const lines = store.getBag();
  if (!lines.length) return;
  const victim = lines[0];
  victim.unavailable = true;
  victim.unavailableReason = `Sold out in ${victim.colourName || 'this option'}${victim.size ? `, ${victim.size}` : ''} while you were checking out.`;
  store.replaceLine(store.lineKey(victim), victim);

  alertsEl.textContent = '';
  const banner = alert(
    'warn',
    'One item sold out while you were checking out',
    `“${victim.name}” is no longer available in the option you chose. We have not changed anything or charged you — choose what you would like to do.`,
    [
      {
        label: 'Remove it and continue',
        onClick: () => {
          store.removeLine(store.lineKey(victim));
          alertsEl.textContent = '';
          simulated.stock = false;
          renderSummary();
          announce('Item removed. Your total has been updated.');
          toast('Removed. Your total has been updated.');
        }
      },
      {
        label: 'Keep shopping instead',
        onClick: () => {
          window.location.href = new URL('../../collections/sarees/', import.meta.url).pathname;
        }
      }
    ]
  );
  alertsEl.append(banner);
  banner.focus();
  renderSummary();
  announce('One item in your bag has sold out. Details are at the top of the page.');
}

function restoreStock() {
  for (const line of store.getBag()) {
    if (line.unavailable) {
      delete line.unavailable;
      delete line.unavailableReason;
      store.replaceLine(store.lineKey(line), line);
    }
  }
  renderSummary();
}

function showSessionExpiry() {
  alertsEl.textContent = '';
  const banner = alert(
    'info',
    'Your session timed out',
    'For security we cleared the payment session after a period of inactivity. Nothing has been charged and nothing in your bag has been lost — check your details and place the order again.',
    [
      {
        label: 'Start again',
        onClick: () => {
          simulated.session = false;
          alertsEl.textContent = '';
          const email = document.getElementById('email');
          if (email) email.focus();
        }
      }
    ]
  );
  alertsEl.append(banner);
  banner.focus();
  announce('Your session timed out. Nothing has been charged and your bag is intact.');
}

/* --------------------------- Placing the order -------------------- */
function onSubmit(e) {
  e.preventDefault();
  const btn = document.querySelector('[data-place-order]');
  const errorEl = document.querySelector('[data-checkout-error]');
  if (errorEl) errorEl.hidden = true;

  if (simulated.session) {
    showSessionExpiry();
    return;
  }

  const unavailable = store.getBag().filter((l) => l.unavailable);
  if (unavailable.length) {
    applyStockProblem();
    if (errorEl) {
      errorEl.textContent = 'Resolve the sold-out item at the top of the page before placing your order.';
      errorEl.hidden = false;
    }
    return;
  }

  if (!validateAll()) {
    if (errorEl) {
      errorEl.textContent =
        'Some details still need attention. They are highlighted above, and nothing you have typed has been lost.';
      errorEl.hidden = false;
    }
    announce('Some details need attention. The fields are highlighted above.');
    focusFirstError(form);
    return;
  }

  if (btn) {
    btn.classList.add('btn--busy');
    btn.disabled = true;
  }

  setTimeout(() => {
    if (btn) {
      btn.classList.remove('btn--busy');
      btn.disabled = false;
    }

    if (simulated.payment) {
      simulated.payment = false;
      const method = (form.querySelector('[data-payment-method]:checked') || {}).value || 'card';
      alertsEl.textContent = '';
      const banner = alert(
        'err',
        'Your payment was declined',
        'Your bank declined the payment. Nothing has been charged and your bag is exactly as it was. Declines are usually a bank-side security check rather than a problem with your card — trying again often works, or use a different method.',
        [
          {
            label: 'Try again',
            onClick: () => {
              alertsEl.textContent = '';
              if (btn) btn.focus();
            }
          },
          {
            label: 'Use a different method',
            onClick: () => {
              alertsEl.textContent = '';
              const other = Array.from(form.querySelectorAll('[data-payment-method]')).find(
                (r) => r.value !== method
              );
              if (other) {
                other.checked = true;
                other.focus();
              }
            }
          },
          {
            label: 'Contact us instead',
            onClick: () => {
              window.location.href = new URL('../../contact/', import.meta.url).pathname;
            }
          }
        ]
      );
      alertsEl.append(banner);
      banner.focus();
      banner.scrollIntoView({ block: 'center', behavior: 'smooth' });
      announce('Your payment was declined. Nothing has been charged. Options are at the top of the page.');
      if (errorEl) {
        errorEl.textContent = 'Payment declined. See the options at the top of the page.';
        errorEl.hidden = false;
      }
      return;
    }

    placeOrder();
  }, 900);
}

function placeOrder() {
  const lines = store.getBag();
  const totals = bagTotals({
    lines,
    shippingId: currentShipping(),
    discountCode: store.getDiscount(),
    shippingOptions: data.shipping
  });
  const est = orderDelivery({ data, shippingId: currentShipping(), lines });
  const namedDate = (document.querySelector('[data-namedday-input]') || {}).value || null;

  const get = (id) => (document.getElementById(id) || {}).value || '';

  const order = {
    number: makeOrderNumber(Date.now()),
    placedAt: new Date().toISOString(),
    demonstration: true,
    email: get('email'),
    phone: get('phone'),
    address: {
      firstName: get('firstName'),
      lastName: get('lastName'),
      line1: get('line1'),
      line2: get('line2'),
      city: get('city'),
      county: get('county'),
      postcode: normalisePostcode(get('postcode')) || get('postcode'),
      country: (form.querySelector('[data-country]') || {}).selectedOptions?.[0]?.textContent || 'United Kingdom'
    },
    deliveryNote: get('deliveryNote'),
    shipping: {
      id: currentShipping(),
      label: est ? est.shipping.label : 'Standard delivery',
      carrier: est ? est.shipping.carrier : '',
      window: est ? est.label : null,
      dispatchBy: est ? est.dispatch.toISOString() : null,
      namedDate
    },
    payment: {
      method: (form.querySelector('[data-payment-method]:checked') || {}).value || 'card',
      charged: false
    },
    marketing: Boolean((document.querySelector('[data-marketing]') || {}).checked),
    lines: lines.map((l) => ({ ...l })),
    totals: {
      itemsTotal: totals.itemsTotal,
      discount: totals.discount,
      discountLabel: totals.discountLabel,
      shippingCost: totals.shippingCost,
      total: totals.total,
      vat: totals.vat
    },
    hasCustomisation: lines.some((l) => (l.services || []).length > 0)
  };

  store.saveOrder(order);
  store.clearBag();
  store.setDiscount(null);
  window.location.href = new URL('../../order-confirmation/', import.meta.url).pathname;
}
