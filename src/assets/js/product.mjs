/* ------------------------------------------------------------------ *
 * Product page: gallery, option selection, optional services,
 * measurement validation, live price and delivery recalculation, and
 * adding to the bag.
 *
 * The rule this file exists to enforce: the customer never sees a
 * number that is out of date. Ticking a service changes the total and
 * the delivery window in the same frame.
 * ------------------------------------------------------------------ */

import { toast, announce, setFieldError, focusFirstError, prefersReducedMotion } from './ui.mjs';
import * as store from './store.mjs';
import { catalogue } from './catalogue.mjs';
import { formatMoney, estimateDelivery, formatWindow, formatDate, validateMeasurement } from './commerce.mjs';
import { openDrawer } from './ui.mjs';

const json = document.querySelector('[data-product-json]');
if (json) init(JSON.parse(json.textContent));

function init(product) {
  const form = document.querySelector('[data-buy-form]');
  if (!form) return;

  let data = null;
  catalogue()
    .then((d) => {
      data = d;
      refresh();
    })
    .catch(() => {
      /* Prices still render from the server-side markup. */
    });

  initGallery(product);
  initQuantity();
  initServices();
  initSticky();
  initSizeFeedback();

  form.addEventListener('change', refresh);
  form.addEventListener('submit', onSubmit);

  const stickyAdd = document.querySelector('[data-sticky-add]');
  if (stickyAdd) {
    stickyAdd.addEventListener('click', () => form.requestSubmit());
  }

  refresh();

  /* --------------------------- Gallery ---------------------------- */
  function initGallery(product) {
    const thumbs = Array.from(document.querySelectorAll('.gallery__thumb'));
    const main = document.querySelector('[data-gallery-image]');
    const caption = document.querySelector('[data-gallery-caption]');
    const zoomBtn = document.querySelector('[data-zoom]');
    const zoomDialog = document.getElementById('zoom-dialog');
    const zoomImg = document.querySelector('[data-zoom-image]');
    const zoomCaption = document.querySelector('[data-zoom-caption]');
    if (!main || !thumbs.length) return;

    let current = 0;

    function select(index, { focus = false } = {}) {
      const thumb = thumbs[index];
      if (!thumb) return;
      current = index;
      const img = thumb.querySelector('img');
      main.src = img.src;
      main.alt = `${product.name}, ${thumb.dataset.label.toLowerCase()}. Illustration.`;
      if (caption) caption.textContent = thumb.dataset.label;
      thumbs.forEach((t, i) => {
        t.setAttribute('aria-selected', String(i === index));
        t.setAttribute('aria-current', String(i === index));
        t.tabIndex = i === index ? 0 : -1;
      });
      const panel = document.getElementById('gallery-main');
      if (panel) panel.setAttribute('aria-labelledby', thumb.id);
      if (focus) thumb.focus();
    }

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => select(i));
      thumb.addEventListener('keydown', (e) => {
        const horizontal = window.matchMedia('(max-width: 59.99em)').matches;
        const next = horizontal ? 'ArrowRight' : 'ArrowDown';
        const prev = horizontal ? 'ArrowLeft' : 'ArrowUp';
        if (e.key === next) {
          e.preventDefault();
          select((current + 1) % thumbs.length, { focus: true });
        } else if (e.key === prev) {
          e.preventDefault();
          select((current - 1 + thumbs.length) % thumbs.length, { focus: true });
        } else if (e.key === 'Home') {
          e.preventDefault();
          select(0, { focus: true });
        } else if (e.key === 'End') {
          e.preventDefault();
          select(thumbs.length - 1, { focus: true });
        }
      });
    });

    if (zoomBtn && zoomDialog && zoomImg) {
      zoomBtn.addEventListener('click', () => {
        zoomImg.src = main.src;
        zoomImg.alt = main.alt;
        if (zoomCaption) zoomCaption.textContent = thumbs[current].dataset.label;
        zoomDialog.__trigger = zoomBtn;
        zoomDialog.showModal();
      });
    }

    // Colour changes swap the whole gallery, because the artwork for
    // every view is generated per colourway.
    form.addEventListener('change', (e) => {
      if (!e.target.matches('input[name="colour"]')) return;
      const slug = e.target.value;
      for (const thumb of thumbs) {
        const img = thumb.querySelector('img');
        img.src = `${product.imageBase}${product.id}__${slug}__${thumb.dataset.view}.svg`;
      }
      select(current);
      const name = e.target.dataset.colourName;
      const nameEl = document.querySelector('[data-colour-name]');
      if (nameEl) nameEl.textContent = name;
      announce(`Colour changed to ${name}`);
    });
  }

  /* -------------------------- Quantity ---------------------------- */
  function initQuantity() {
    const input = document.querySelector('[data-qty]');
    const down = document.querySelector('[data-qty-down]');
    const up = document.querySelector('[data-qty-up]');
    if (!input) return;
    const sync = () => {
      const v = Number(input.value) || 1;
      if (down) down.disabled = v <= 1;
      if (up) up.disabled = v >= 10;
    };
    if (down)
      down.addEventListener('click', () => {
        input.value = String(Math.max(1, (Number(input.value) || 1) - 1));
        sync();
        refresh();
      });
    if (up)
      up.addEventListener('click', () => {
        input.value = String(Math.min(10, (Number(input.value) || 1) + 1));
        sync();
        refresh();
      });
    input.addEventListener('input', () => {
      sync();
      refresh();
    });
    sync();
  }

  /* ------------------------ Optional services --------------------- */
  function initServices() {
    document.querySelectorAll('[data-service]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const wrap = checkbox.closest('[data-service-wrap]');
        const id = checkbox.dataset.service;
        wrap.querySelectorAll(`[data-service-fields="${id}"]`).forEach((f) => {
          f.hidden = !checkbox.checked;
        });
        if (!checkbox.checked) {
          // Clear errors from fields that are no longer required.
          wrap.querySelectorAll('input, select').forEach((f) => {
            if (f !== checkbox) setFieldError(f, null);
          });
        } else {
          announce(`${wrap.querySelector('.service-option__label span').textContent} added. Price and delivery updated.`);
        }
      });
    });

    // Unit toggle relabels the fields and re-validates what is typed.
    document.querySelectorAll('[data-unit-toggle]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const owner = radio.dataset.unitToggle;
        const unit = radio.value;
        document
          .querySelectorAll(`[data-service-fields="${owner}"] [data-unit-label="${owner}"]`)
          .forEach((span) => {
            span.textContent = unit === 'cm' ? '(cm)' : '(inches)';
          });
        document.querySelectorAll(`[data-service-owner="${owner}"]`).forEach((input) => {
          if (input.value.trim()) validateField(input);
        });
      });
    });

    document.querySelectorAll('[data-measurement]').forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.value.trim()) validateField(input);
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });
  }

  function unitFor(serviceId) {
    const checked = document.querySelector(`[data-unit-toggle="${serviceId}"]:checked`);
    return checked ? checked.value : 'cm';
  }

  function validateField(input) {
    const serviceId = input.dataset.serviceOwner;
    const unit = unitFor(serviceId);
    const field = {
      id: input.dataset.measurement,
      label: input.closest('.field').querySelector('.field__label').textContent.trim().replace(/\s*\(.*\)$/, ''),
      minCm: Number(input.dataset.min),
      maxCm: Number(input.dataset.max)
    };
    const result = validateMeasurement(field, input.value, unit);
    setFieldError(input, result.ok ? null : result.message);
    return result;
  }

  /* --------------------------- Size state ------------------------- */
  function initSizeFeedback() {
    const group = document.querySelector('[data-size-group]');
    if (!group) return;
    group.addEventListener('change', () => {
      const chosen = group.querySelector('input[name="size"]:checked');
      const required = document.querySelector('[data-size-required]');
      const error = document.querySelector('[data-size-error]');
      if (chosen) {
        if (required) required.textContent = `— ${chosen.value}`;
        if (error) error.hidden = true;
        if (chosen.dataset.sizeStock === 'low-stock') {
          announce(`${chosen.value} selected. Low stock in this size.`);
        }
      }
    });
  }

  /* ------------------------ Live recalculation -------------------- */
  function chosenServices() {
    return Array.from(document.querySelectorAll('[data-service]:checked')).map((c) => ({
      id: c.dataset.service,
      label: c.closest('.service-option').querySelector('.service-option__label span').textContent.trim(),
      price: Number(c.dataset.price),
      leadDays: Number(c.dataset.lead),
      requiresMeasurements: c.dataset.measurements === 'yes'
    }));
  }

  function refresh() {
    const qty = Number((document.querySelector('[data-qty]') || {}).value) || 1;
    const services = chosenServices();
    const unit = product.price + services.reduce((s, sv) => s + sv.price, 0);
    const total = unit * qty;

    const totalLine = document.querySelector('[data-total-line]');
    const totalEl = document.querySelector('[data-line-total]');
    if (totalEl) totalEl.textContent = formatMoney(total);
    if (totalLine) totalLine.hidden = services.length === 0 && qty === 1;

    const sticky = document.querySelector('[data-sticky-price]');
    if (sticky) sticky.textContent = formatMoney(total);

    // Delivery window moves with the longest service lead time.
    if (data) {
      const leadDays = services.reduce((max, s) => Math.max(max, s.leadDays), 0);
      const box = document.querySelector('[data-delivery-box]');
      const windowEl = document.querySelector('[data-delivery-window]');
      const detailEl = document.querySelector('[data-delivery-detail]');
      const optionsEl = document.querySelector('[data-delivery-options]');
      if (box && windowEl) {
        const standard = data.shipping[0];
        const est = estimateDelivery({
          stock: product.stock,
          serviceLeadDays: leadDays,
          shipping: standard,
          handling: data.handling,
          now: new Date()
        });
        if (est) {
          windowEl.textContent = formatWindow(est.earliest, est.latest);
          if (detailEl) {
            detailEl.textContent = leadDays
              ? `Dispatched by ${formatDate(est.dispatch)} — including ${leadDays} extra working ${
                  leadDays === 1 ? 'day' : 'days'
                } for the finishing you have chosen — then ${standard.minDays}–${standard.maxDays} working days with ${standard.carrier}.`
              : `Dispatched by ${formatDate(est.dispatch)}, then ${standard.minDays}–${standard.maxDays} working days with ${standard.carrier}.`;
          }
          if (optionsEl) {
            optionsEl.innerHTML = data.shipping
              .map((s) => {
                const e = estimateDelivery({
                  stock: product.stock,
                  serviceLeadDays: leadDays,
                  shipping: s,
                  handling: data.handling,
                  now: new Date()
                });
                const price = s.freeOver
                  ? `${formatMoney(s.price)}, free over ${formatMoney(s.freeOver)}`
                  : formatMoney(s.price);
                return `<li><span>${s.label}</span><span class="nowrap"><strong>${formatWindow(
                  e.earliest,
                  e.latest
                )}</strong> · ${price}</span></li>`;
              })
              .join('');
          }
        }
      }
    }

    // Returns wording changes the moment a customisation is chosen.
    const caveat = document.querySelector('[data-returns-caveat]');
    if (caveat) {
      caveat.textContent = services.length
        ? 'One line in your bag is made to your measurements and cannot be returned.'
        : '';
    }
  }

  /* -------------------------- Add to bag -------------------------- */
  function onSubmit(e) {
    e.preventDefault();
    const btn = document.querySelector('[data-add-to-bag]');
    const errorEl = document.querySelector('[data-buy-error]');
    if (btn && btn.disabled) return;

    let ok = true;
    const problems = [];

    // Size, where the product has one.
    const sizeGroup = document.querySelector('[data-size-group]');
    let size = null;
    if (sizeGroup) {
      const chosen = sizeGroup.querySelector('input[name="size"]:checked');
      const sizeError = document.querySelector('[data-size-error]');
      if (!chosen) {
        ok = false;
        problems.push('choose a size');
        if (sizeError) sizeError.hidden = false;
        sizeGroup.querySelector('input:not([disabled])').focus();
      } else {
        size = chosen.value;
        if (sizeError) sizeError.hidden = true;
      }
    }

    // Service sub-options and measurements.
    const services = chosenServices();
    const measurements = {};
    const blouseOptions = {};

    for (const service of services) {
      const wrap = document.querySelector(`[data-service-wrap="${service.id}"]`);
      if (!wrap) continue;

      wrap.querySelectorAll(`[data-required-when="${service.id}"]`).forEach((select) => {
        if (!select.value) {
          setFieldError(select, 'Choose an option before adding to your bag.');
          ok = false;
        } else {
          setFieldError(select, null);
          const label = select.options[select.selectedIndex].textContent.split(' — ')[0];
          if (select.name === 'blouseNeckline') blouseOptions.neckline = label;
          if (select.name === 'blouseSleeve') blouseOptions.sleeve = label;
        }
      });

      if (service.requiresMeasurements) {
        const inputs = wrap.querySelectorAll('[data-measurement]');
        for (const input of inputs) {
          const result = validateField(input);
          if (!result.ok) ok = false;
          else {
            const label = input
              .closest('.field')
              .querySelector('.field__label')
              .textContent.trim()
              .replace(/\s*\(.*\)$/, '');
            measurements[label] = result.cm;
          }
        }
        if (inputs.length && !ok) problems.push('check your measurements');
      }
    }

    if (!ok) {
      // Inputs are never cleared on error — everything typed stays put.
      if (errorEl) {
        errorEl.textContent = `Before we can add this: ${problems.length ? problems.join(', ') : 'fix the highlighted fields'}. Nothing you have entered has been lost.`;
        errorEl.hidden = false;
      }
      announce('There is a problem with your choices. Details are next to the fields highlighted.');
      focusFirstError(form);
      return;
    }
    if (errorEl) errorEl.hidden = true;

    const colourInput = document.querySelector('input[name="colour"]:checked');
    const colour = colourInput ? colourInput.value : product.defaultColour;
    const colourName = colourInput ? colourInput.dataset.colourName : null;
    const qty = Number((document.querySelector('[data-qty]') || {}).value) || 1;

    if (btn) btn.classList.add('btn--busy');

    store.addToBag({
      id: product.id,
      name: product.name,
      price: product.price,
      image: `${product.imageBase}${product.id}__${colour}__drape.svg`,
      href: product.href,
      stock: product.stock,
      colour,
      colourName,
      size,
      services,
      measurements: Object.keys(measurements).length ? measurements : null,
      blouseOptions: Object.keys(blouseOptions).length ? blouseOptions : null,
      quantity: qty
    });

    setTimeout(() => {
      if (btn) btn.classList.remove('btn--busy');
      toast(
        `${product.name}${size ? `, ${size}` : ''}${services.length ? ` with ${services.length} finishing ${services.length === 1 ? 'service' : 'services'}` : ''} added.`,
        {
          title: 'Added to your bag',
          action: { label: 'View bag', onClick: () => openDrawer('bag-drawer', btn) }
        }
      );
    }, 220);
  }

  /* ------------------------- Sticky buy bar ----------------------- */
  function initSticky() {
    const bar = document.querySelector('[data-sticky-buy]');
    const anchor = document.querySelector('[data-add-to-bag]');
    if (!bar || !anchor || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          bar.dataset.visible = String(show);
          document.body.dataset.stickyBuy = String(show);
        }
      },
      { rootMargin: '0px 0px -100% 0px', threshold: 0 }
    );
    observer.observe(anchor);
  }
}
