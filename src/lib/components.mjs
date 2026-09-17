/* ------------------------------------------------------------------ *
 * Reusable UI pieces shared across pages.
 * ------------------------------------------------------------------ */

import { html, raw, esc, url, icon, attrs, cls } from './html.mjs';
import { formatMoney } from './commerce.mjs';
import { fabricById, weaveById, occasionById, stockStates, drapeDifficulty } from '../data/taxonomy.mjs';

/* ------------------------------ Images ---------------------------- */
export function imgPath(productId, view, colourSlug) {
  return url(`/assets/img/products/${productId}__${colourSlug}__${view}.svg`);
}

/** The colourway a card or gallery opens on: the first one that is
 * actually buyable, so we never lead with something out of stock. */
export function defaultColour(product) {
  const first = product.colours.find((c) => c.stock !== 'out-of-stock');
  return (first || product.colours[0]).slug;
}

/** Views we generate, in gallery order. `blouse` is skipped when there
 * is no blouse piece to show — a gallery slot promising something not
 * in the parcel is exactly the confusion we are trying to remove. */
export function galleryViews(product) {
  const views = [
    { id: 'drape', label: 'Full-length drape' },
    { id: 'front', label: 'Laid flat, front' },
    { id: 'pallu', label: 'Pallu detail' },
    { id: 'border', label: 'Border detail' },
    { id: 'macro', label: 'Fabric close-up' },
    { id: 'back', label: 'Reverse face' }
  ];
  if (product.type === 'saree' && product.blousePiece.included) {
    views.push({ id: 'blouse', label: 'The included blouse piece' });
  } else if (product.type === 'blouse') {
    return [
      { id: 'blouse', label: 'The blouse, flat' },
      { id: 'front', label: 'Fabric, full width' },
      { id: 'macro', label: 'Fabric close-up' },
      { id: 'border', label: 'Finish detail' }
    ];
  } else if (product.type !== 'saree') {
    return [
      { id: 'front', label: 'Product' },
      { id: 'macro', label: 'Material close-up' }
    ];
  }
  return views;
}

/* ------------------------------ Labels ---------------------------- */

/** Factual, useful card labels. Nothing promotional, no scarcity. */
export function productLabels(product) {
  const out = [];
  if (product.readyToWear && product.type === 'saree') out.push({ text: 'Ready to wear', tone: 'accent' });
  if (product.type === 'saree' && product.blousePiece.included) {
    out.push({ text: 'Blouse piece included', tone: 'plain' });
  }
  if (product.type === 'saree' && !product.blousePiece.included && !product.readyToWear) {
    out.push({ text: 'No blouse piece', tone: 'off' });
  }
  if (product.petticoat && product.petticoat.included) out.push({ text: 'Petticoat included', tone: 'plain' });
  if (product.type === 'saree' && product.attributes.drapeDifficulty === 1) {
    out.push({ text: 'Easiest to drape', tone: 'ok' });
  }
  if (product.services && product.services.length) {
    out.push({ text: 'Stitching available', tone: 'plain' });
  }
  return out;
}

export function stockBadge(product) {
  const st = stockStates[product.stock];
  const toneClass = { ok: 'badge--ok', warn: 'badge--warn', info: 'badge--info', off: 'badge--off' }[st.tone];
  return `<span class="badge ${toneClass}">${esc(st.label)}</span>`;
}

export function badge(text, tone = 'plain') {
  const toneClass =
    { ok: 'badge--ok', warn: 'badge--warn', info: 'badge--info', off: 'badge--off', accent: 'badge--accent', new: 'badge--new' }[
      tone
    ] || '';
  return `<span class="badge ${toneClass}">${esc(text)}</span>`;
}

/** A term with an on-demand plain-English definition. */
export function term(label, definition, extra = null) {
  return `<button class="term" type="button" data-term="${esc(label)}" data-term-def="${esc(definition)}"${
    extra ? ` data-term-extra="${esc(extra)}"` : ''
  }>${esc(label)}</button>`;
}

export function sampleTag(text = 'Sample content') {
  return `<span class="sample-tag" title="Illustrative content created for this demonstration, not a real business fact.">${esc(
    text
  )}</span>`;
}

/* --------------------------- Product card ------------------------- */
export function productCard(product, { eager = false, index = 0 } = {}) {
  const fabric = fabricById[product.fabric];
  const weave = weaveById[product.weave];
  const labels = productLabels(product).slice(0, 2);
  const buyable = stockStates[product.stock].buyable;
  const attr =
    product.type === 'saree'
      ? weave && weave.id !== 'none'
        ? `${weave.label} · ${product.fabricLabel}`
        : product.fabricLabel
      : product.fabricLabel;

  // Products with a required size or tailoring choice never get a
  // quick-add: "Choose options" takes you where the decision is made.
  const needsChoice = Boolean(product.sizes) || (product.services && product.services.length > 0) || product.colours.length > 1;

  const shownSwatches = product.colours.slice(0, 4);
  const extraSwatches = product.colours.length - shownSwatches.length;

  return html`
    <article
      class="card${buyable ? '' : ' card--out'}"
      data-product-card
      data-id="${product.id}"
      data-fabric="${product.fabric}"
      data-weave="${product.weave}"
      data-occasions="${product.occasions.join(' ')}"
      data-colour="${product.colour.family}"
      data-price="${product.price}"
      data-stock="${product.stock}"
      data-rtw="${product.readyToWear ? 'yes' : 'no'}"
      data-new="${product.isNew ? 'yes' : 'no'}"
      data-blouse="${product.blousePiece.included ? 'included' : 'no'}"
      data-ease="${product.attributes.drapeDifficulty || 3}"
      data-name="${product.name}"
      data-index="${index}"
    >
      <div class="card__media">
        <div class="card__flags">
          ${raw(product.isNew ? badge('New in', 'new') : '')}
          ${raw(!buyable ? badge('Out of stock', 'off') : '')}
        </div>
        <img
          src="${imgPath(product.id, 'drape', defaultColour(product))}"
          alt="${esc(product.name)} shown draped on a figure. Illustration."
          width="900"
          height="1200"
          ${raw(eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"')}
          decoding="async"
        />
        <img
          src="${imgPath(product.id, 'front', defaultColour(product))}"
          alt=""
          width="900"
          height="1200"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
        <button
          class="icon-btn card__wish"
          type="button"
          data-wishlist-toggle="${product.id}"
          aria-pressed="false"
        >
          ${raw(icon('heart'))}
          <span class="visually-hidden">Save ${esc(product.name)} to wishlist</span>
        </button>
      </div>

      <h3 class="card__title"><a href="${url(`/products/${product.id}/`)}">${product.name}</a></h3>
      <p class="card__attr">${attr}</p>
      <p class="card__price">
        ${raw(formatMoney(product.price))}
        <span class="visually-hidden">, ${product.colour.name}</span>
      </p>

      ${labels.length
        ? raw(`<div class="card__labels">${labels.map((l) => badge(l.text, l.tone)).join('')}</div>`)
        : ''}

      ${product.colours.length > 1
        ? html`<div class="card__swatches" role="group" aria-label="Colours available for ${product.name}">
            ${shownSwatches.map(
              (c) => raw(`<a class="swatch${c.stock === 'out-of-stock' ? ' swatch--out' : ''}"
                   style="--swatch-colour:${esc(c.hex)}"
                   href="${url(`/products/${product.id}/?colour=${c.slug}`)}"
                   title="${esc(c.name)}${c.stock === 'out-of-stock' ? ' — out of stock' : ''}">
                   <span class="visually-hidden">${esc(c.name)}${
                     c.stock === 'out-of-stock' ? ', out of stock' : ''
                   }</span></a>`)
            )}
            ${raw(
              extraSwatches > 0
                ? `<a class="swatch swatch--more" href="${url(`/products/${product.id}/`)}" title="${extraSwatches} more colours">+${extraSwatches}<span class="visually-hidden"> more colours</span></a>`
                : ''
            )}
          </div>`
        : ''}

      <div class="card__cta">
        ${raw(
          !buyable
            ? `<a class="btn btn--quiet btn--sm" href="${url(`/products/${product.id}/`)}">See alternatives</a>`
            : needsChoice
              ? `<a class="btn btn--quiet btn--sm" href="${url(`/products/${product.id}/`)}">Choose options</a>`
              : `<button class="btn btn--quiet btn--sm" type="button" data-quick-add="${product.id}">Add to bag</button>`
        )}
      </div>
    </article>
  `;
}

/* --------------------------- Breadcrumb --------------------------- */
export function breadcrumb(items) {
  return html`
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        ${items.map((it, i) =>
          raw(
            i === items.length - 1
              ? `<li><span aria-current="page">${esc(it.label)}</span></li>`
              : `<li><a href="${url(it.href)}">${esc(it.label)}</a></li>`
          )
        )}
      </ol>
    </nav>
  `;
}

/* ----------------------------- Notice ----------------------------- */
export function notice(body, { tone = 'info', iconName = 'info', heading = null } = {}) {
  const toneClass = { ok: 'notice--ok', warn: 'notice--warn', err: 'notice--err', info: 'notice--info', accent: 'notice--accent' }[
    tone
  ] || '';
  return `<div class="notice ${toneClass}">
    <span class="notice__icon">${icon(iconName)}</span>
    <div class="notice__body">${heading ? `<p><strong>${esc(heading)}</strong></p>` : ''}${body}</div>
  </div>`;
}

/* --------------------------- Section head ------------------------- */
export function sectionHead({ eyebrow, title, body, link, level = 2 }) {
  const H = `h${level}`;
  return html`
    <div class="section-head">
      <div>
        ${raw(eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : '')}
        ${raw(`<${H} class="h${level === 2 ? 2 : 3}">${esc(title)}</${H}>`)}
        ${raw(body ? `<p>${body}</p>` : '')}
      </div>
      ${raw(link ? `<a class="link link--arrow nowrap" href="${url(link.href)}">${esc(link.label)}</a>` : '')}
    </div>
  `;
}

/* ------------------------- Empty state ---------------------------- */
export function emptyState({ iconName = 'searchEmpty', title, body, actions = [], suggest = null }) {
  return html`
    <div class="empty-state">
      <div class="empty-state__icon">${raw(icon(iconName, { size: 48 }))}</div>
      <h2>${title}</h2>
      <p>${raw(body)}</p>
      ${actions.length
        ? raw(
            `<div class="empty-state__actions">${actions
              .map(
                (a, i) =>
                  `<a class="btn ${i === 0 ? '' : 'btn--quiet'}" href="${url(a.href)}">${esc(a.label)}</a>`
              )
              .join('')}</div>`
          )
        : ''}
      ${raw(suggest ? `<div class="empty-state__suggest">${suggest}</div>` : '')}
    </div>
  `;
}

/* ------------------------ Ease-of-draping meter -------------------- */
export function easeMeter(level) {
  if (!level) return '';
  const d = drapeDifficulty[level];
  return `<span class="ease-meter" role="img" aria-label="Ease of draping: ${esc(d.label)}, ${level} out of 5">
    ${Array.from({ length: 5 }, (_, i) => `<span${i < level ? ' data-on' : ''}></span>`).join('')}
  </span> <span class="small">${esc(d.label)}</span>`;
}

/* ------------------------- Spec definition list -------------------- */
export function specList(rows) {
  return `<dl class="spec-list">${rows
    .filter((r) => r && r.value != null && r.value !== '')
    .map(
      (r) =>
        `<div><dt>${r.term || esc(r.label)}</dt><dd>${r.value}${
          r.note ? `<em>${esc(r.note)}</em>` : ''
        }</dd></div>`
    )
    .join('')}</dl>`;
}

/* --------------------------- Accordion ---------------------------- */
export function accordion(items) {
  return `<div class="accordion">${items
    .map(
      (it) => `<details class="accordion__item"${it.open ? ' open' : ''}>
      <summary class="accordion__summary">${esc(it.title)}</summary>
      <div class="accordion__body">${it.body}</div>
    </details>`
    )
    .join('')}</div>`;
}

export { formatMoney };
