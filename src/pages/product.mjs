import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import {
  breadcrumb,
  notice,
  badge,
  term,
  sampleTag,
  specList,
  accordion,
  easeMeter,
  productCard,
  imgPath,
  galleryViews,
  stockBadge,
  sectionHead,
  defaultColour
} from '../lib/components.mjs';
import { products, productById } from '../data/products.mjs';
import {
  fabricById,
  weaveById,
  occasionById,
  stockStates,
  drapeDifficulty,
  sizeChart,
  blouseNecklines,
  blouseSleeves,
  measurementFields,
  rtwMeasurementFields
} from '../data/taxonomy.mjs';
import { services, fulfilment, returnsPolicy, site, BRAND } from '../data/site.mjs';
import { formatMoney, estimateDelivery, formatWindow, formatDate } from '../lib/commerce.mjs';

const cmToIn = (cm) => Math.round((cm / 2.54) * 10) / 10;

/* Essentials we genuinely recommend alongside a given saree, chosen
 * from what the product actually needs rather than by margin. */
function relevantEssentials(product) {
  const ids = [];
  if (product.type !== 'saree') return [];
  if (product.petticoat.required) {
    ids.push(product.attributes.weightGsm >= 400 ? 'petticoat-satin' : 'petticoat-cotton');
  }
  if (product.blousePiece.included && !product.blousePiece.stitched) ids.push('blouse-cotton-silk-elbow');
  if (!product.blousePiece.included && !product.readyToWear) ids.push('blouse-raw-silk-sleeveless');
  if (product.attributes.drapeDifficulty >= 3) ids.push('saree-pins-set');
  if (product.care && /dry clean only/i.test(product.care)) ids.push('muslin-storage-bags');
  else ids.push('delicate-fabric-wash');
  return [...new Set(ids)].slice(0, 3).map((id) => productById[id]).filter(Boolean);
}

function alsoLike(product) {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.type === 'saree' &&
        (p.occasions.some((o) => product.occasions.includes(o)) || p.fabric === product.fabric)
    )
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, 4);
}

function gallery(product) {
  const views = galleryViews(product);
  const col = defaultColour(product);
  return html`
    <div class="gallery" data-gallery>
      <div class="gallery__thumbs" role="tablist" aria-label="Product images">
        ${views.map(
          (v, i) => raw(`
          <button class="gallery__thumb" type="button" role="tab"
                  id="thumb-${v.id}" aria-controls="gallery-main"
                  aria-selected="${i === 0 ? 'true' : 'false'}"
                  aria-current="${i === 0 ? 'true' : 'false'}"
                  data-view="${v.id}" data-label="${esc(v.label)}"
                  tabindex="${i === 0 ? '0' : '-1'}">
            <img src="${imgPath(product.id, v.id, col)}" alt="" width="900" height="1200" loading="${
              i === 0 ? 'eager' : 'lazy'
            }" decoding="async">
            <span class="visually-hidden">${esc(v.label)}</span>
          </button>`)
        )}
      </div>

      <div class="gallery__main" id="gallery-main" role="tabpanel" aria-labelledby="thumb-${views[0].id}">
        <img
          src="${imgPath(product.id, views[0].id, col)}"
          alt="${esc(product.name)}, ${esc(views[0].label.toLowerCase())}. Illustration."
          width="900"
          height="1200"
          fetchpriority="high"
          decoding="async"
          data-gallery-image
        />
        <button class="gallery__zoom" type="button" data-zoom aria-label="Open larger image">
          <span class="visually-hidden">Open larger image</span>
        </button>
        <span class="gallery__zoom-hint">${raw(icon('zoom', { size: 13 }))} Tap to enlarge</span>
      </div>

      <p class="gallery__caption">
        <span data-gallery-caption>${views[0].label}</span>
        <span class="nowrap">${raw(sampleTag('Illustration, not a photograph'))}</span>
      </p>
    </div>

    <dialog class="modal--zoom" id="zoom-dialog" aria-label="Enlarged product image">
      <div class="modal__head">
        <p class="small" data-zoom-caption style="color:inherit">${views[0].label}</p>
        <button class="icon-btn" type="button" data-close-dialog style="color:inherit">
          ${raw(icon('close'))}<span class="visually-hidden">Close</span>
        </button>
      </div>
      <div class="modal__body">
        <img src="${imgPath(product.id, views[0].id, col)}" alt="" width="900" height="1200" data-zoom-image />
      </div>
    </dialog>
  `;
}

function colourSelector(product) {
  if (product.colours.length <= 1) {
    return html`<p class="small"><strong>Colour:</strong> ${product.colour.name}</p>`;
  }
  const firstAvailable = product.colours.find((c) => c.stock !== 'out-of-stock');
  return html`
    <div class="pdp__block">
      <div class="option-label">
        <span id="colour-label">Colour: <span class="option-label__value" data-colour-name>${
          (firstAvailable || product.colours[0]).name
        }</span></span>
      </div>
      <div class="swatch-group" role="radiogroup" aria-labelledby="colour-label">
        ${product.colours.map((c, i) => {
          const out = c.stock === 'out-of-stock';
          const checked = firstAvailable ? c.slug === firstAvailable.slug : i === 0;
          return raw(`
            <label class="swatch-option">
              <input type="radio" name="colour" value="${esc(c.slug)}"
                     data-colour-stock="${esc(c.stock)}" data-colour-name="${esc(c.name)}"
                     ${checked ? 'checked' : ''} ${out ? 'disabled' : ''}>
              <span class="swatch-option__box">
                <span class="swatch-option__dot" style="--swatch-colour:${esc(c.hex)}"></span>
                <span>${esc(c.name)}${out ? ' <span class="swatch-option__note">(out of stock)</span>' : ''}</span>
              </span>
            </label>`);
        })}
      </div>
      ${raw(
        product.colours.some((c) => c.stock === 'out-of-stock')
          ? `<p class="small muted mt-2">Greyed-out colours are out of stock. <a class="link" href="${url(
              '/contact/'
            )}">Ask us</a> when one is due back and we will tell you what we actually know.</p>`
          : ''
      )}
    </div>
  `;
}

function sizeSelector(product) {
  if (!product.sizes) return '';
  const firstAvailable = product.sizes.find((s) => product.sizeStock[s] !== 'out-of-stock');
  return html`
    <div class="pdp__block">
      <div class="option-label">
        <span id="size-label">Size <span class="option-label__value" data-size-required>— required</span></span>
        <a class="link" href="${url('/saree-guide/measurements/')}">${raw(icon('ruler', { size: 14 }))} Size &amp; measurement guide</a>
      </div>
      <div class="size-group" role="radiogroup" aria-labelledby="size-label" data-size-group>
        ${product.sizes.map((s) => {
          const st = product.sizeStock[s];
          const out = st === 'out-of-stock';
          return raw(`
            <label class="size-option">
              <input type="radio" name="size" value="${esc(s)}" data-size-stock="${esc(st)}" ${out ? 'disabled' : ''}>
              <span class="size-option__box">${esc(s.replace('UK ', ''))}</span>
              <span class="visually-hidden">${esc(s)}${out ? ', out of stock' : st === 'low-stock' ? ', low stock' : ''}</span>
            </label>`);
        })}
      </div>
      <p class="small muted mt-2">
        Sizes shown are UK sizes, matched to body measurements. ${product.sizeGuideNote || ''}
      </p>
      ${raw(
        product.sizes.some((s) => product.sizeStock[s] === 'out-of-stock')
          ? `<p class="small mt-2">Crossed-out sizes are out of stock in ${esc(
              product.colour.name.toLowerCase()
            )}. <a class="link" href="${url('/contact/')}">Email us</a> and we will tell you if it is coming back.</p>`
          : ''
      )}
      <p class="field__error" data-size-error hidden>Choose a size before adding to your bag.</p>
    </div>

    <details class="accordion__item mt-4" style="border-top:1px solid var(--rule)">
      <summary class="accordion__summary">Size chart, centimetres and inches</summary>
      <div class="accordion__body">
        ${raw(sizeTable(product))}
      </div>
    </details>
  `;
}

function sizeTable(product) {
  const rows = sizeChart.filter((r) => !product.sizes || product.sizes.some((s) => s.startsWith(r.size)));
  const use = rows.length ? rows : sizeChart;
  return `<div class="table-scroll">
    <table class="table">
      <caption>Body measurements, not garment measurements. Measure over light clothing, tape level and not pulled tight.</caption>
      <thead>
        <tr>
          <th scope="col">Size</th>
          <th scope="col" class="numeric">Bust</th>
          <th scope="col" class="numeric">Waist</th>
          <th scope="col" class="numeric">Hip</th>
        </tr>
      </thead>
      <tbody>
        ${use
          .map(
            (r) => `<tr>
          <th scope="row">${esc(r.size)}</th>
          <td class="numeric">${r.bustCm}cm / ${r.bustIn}in</td>
          <td class="numeric">${r.waistCm}cm / ${r.waistIn}in</td>
          <td class="numeric">${r.hipCm}cm / ${r.hipIn}in</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>
  <p class="small muted mt-3">
    Between two sizes? Take the larger one. There is seam allowance inside to take a garment in,
    but far less to let one out.
  </p>`;
}

function includedBlock(product) {
  return html`
    <div class="includes pdp__block">
      <h3>In the parcel</h3>
      <ul class="includes--in">
        ${product.included.map((i) => raw(`<li>${esc(i)}</li>`))}
      </ul>
      ${product.excluded.length
        ? html`<h3>Not included</h3>
            <ul class="includes--out">
              ${product.excluded.map((i) => raw(`<li>${esc(i)}</li>`))}
            </ul>`
        : ''}
    </div>
  `;
}

function serviceBlock(product) {
  if (!product.services.length) return '';
  const list = product.services.map((id) => services[id]);
  return html`
    <div class="pdp__block">
      <div class="option-label">
        <span>Optional finishing</span>
        <a class="link" href="${url('/saree-guide/tailoring/')}">How tailoring works</a>
      </div>
      <p class="small muted mb-4">
        Nothing here is added unless you choose it. Each one adds to the price, adds working days
        before dispatch, and changes what can be returned — all shown before you tick it.
      </p>

      ${list.map(
        (s) => html`
          <div class="service-option" data-service-wrap="${s.id}">
            <label class="service-option__head">
              <input
                type="checkbox"
                name="service"
                value="${s.id}"
                data-service="${s.id}"
                data-price="${s.price}"
                data-lead="${s.leadDays}"
                data-measurements="${s.requiresMeasurements ? 'yes' : 'no'}"
              />
              <span class="service-option__label">
                <span>${s.label}</span>
                <span class="service-option__price">+ ${raw(formatMoney(s.price))}</span>
                <span class="service-option__meta">
                  Adds ${s.leadDays} working ${s.leadDays === 1 ? 'day' : 'days'} before dispatch${
                    s.requiresMeasurements ? ' · needs your measurements' : ''
                  }
                </span>
              </span>
            </label>
            <div class="service-option__detail">
              <p class="small">${s.blurb}</p>
              <p class="small" style="color:var(--warn)">
                <strong>Returns:</strong> ${s.returnsImpact}
              </p>
              ${raw(s.id === 'blouseStitching' ? blouseOptionsMarkup() : '')}
              ${raw(
                s.requiresMeasurements
                  ? measurementFieldsMarkup(s.id, s.id === 'readyToWearConversion' ? rtwMeasurementFields : measurementFields)
                  : ''
              )}
            </div>
          </div>
        `
      )}
    </div>
  `;
}

function blouseOptionsMarkup() {
  return `<div class="field-row field-row--2" data-service-fields="blouseStitching" hidden>
    <div class="field">
      <label class="field__label" for="blouse-neckline">Neckline</label>
      <select class="select" id="blouse-neckline" name="blouseNeckline" data-required-when="blouseStitching">
        <option value="">Choose a neckline</option>
        ${blouseNecklines.map((n) => `<option value="${n.id}">${esc(n.label)} — ${esc(n.plain)}</option>`).join('')}
      </select>
      <p class="field__error" data-error-for="blouse-neckline" hidden></p>
    </div>
    <div class="field">
      <label class="field__label" for="blouse-sleeve">Sleeve length</label>
      <select class="select" id="blouse-sleeve" name="blouseSleeve" data-required-when="blouseStitching">
        <option value="">Choose a sleeve</option>
        ${blouseSleeves.map((s) => `<option value="${s.id}">${esc(s.label)}${s.plain ? ` — ${esc(s.plain)}` : ''}</option>`).join('')}
      </select>
      <p class="field__error" data-error-for="blouse-sleeve" hidden></p>
    </div>
  </div>`;
}

function measurementFieldsMarkup(serviceId, fields) {
  return `<div data-service-fields="${serviceId}" hidden>
    <fieldset class="fieldset mt-4">
      <legend class="fieldset__legend">Your measurements</legend>
      <div class="cluster" style="margin-bottom:var(--sp-4)">
        <span class="small">Measure in</span>
        <span class="segmented" role="group" aria-label="Measurement unit">
          <label>
            <input type="radio" name="unit-${serviceId}" value="cm" checked data-unit-toggle="${serviceId}">
            <span>cm</span>
          </label>
          <label>
            <input type="radio" name="unit-${serviceId}" value="in" data-unit-toggle="${serviceId}">
            <span>inches</span>
          </label>
        </span>
      </div>
      <div class="field-row field-row--2">
        ${fields
          .map(
            (f) => `<div class="field">
          <label class="field__label" for="m-${serviceId}-${f.id}">${esc(f.label)}
            <span class="field__optional" data-unit-label="${serviceId}">(cm)</span>
          </label>
          <span class="field__hint" id="hint-${serviceId}-${f.id}">${esc(f.help)}</span>
          <input class="input" type="text" inputmode="decimal" autocomplete="off"
                 id="m-${serviceId}-${f.id}" name="m-${serviceId}-${f.id}"
                 data-measurement="${f.id}" data-service-owner="${serviceId}"
                 data-min="${f.minCm}" data-max="${f.maxCm}"
                 aria-describedby="hint-${serviceId}-${f.id}">
          <p class="field__error" data-error-for="m-${serviceId}-${f.id}" hidden></p>
        </div>`
          )
          .join('')}
      </div>
      <p class="small muted mt-3">
        Not sure how to measure? The <a class="link" href="${url(
          '/saree-guide/measurements/'
        )}">measurement guide</a> shows exactly where the tape goes, with a diagram for each one.
        If a number looks like a unit mix-up we will say so rather than quietly stitching it.
      </p>
    </fieldset>
  </div>`;
}

function deliveryBlock(product) {
  const buyable = stockStates[product.stock].buyable;
  const standard = fulfilment.shipping[0];
  const est = buyable
    ? estimateDelivery({
        stock: product.stock,
        shipping: standard,
        handling: fulfilment.handling,
        now: new Date()
      })
    : null;

  if (!est) {
    return html`
      <div class="delivery-box delivery-box--off pdp__block">
        <p><strong>Not available to order at the moment</strong></p>
        <p class="mt-2">
          We cannot give you a delivery date for something we do not have, so we are not going to
          invent one. Similar pieces are below, or we will email you when this returns.
        </p>
      </div>
    `;
  }

  return html`
    <div class="delivery-box pdp__block" data-delivery-box>
      <p>
        ${raw(icon('truck', { size: 16 }))}
        <strong>Estimated delivery</strong>
      </p>
      <p class="delivery-box__date mt-2" data-delivery-window>${formatWindow(est.earliest, est.latest)}</p>
      <p class="small mt-2" data-delivery-detail>
        Dispatched by ${formatDate(est.dispatch)} from ${site.dispatch.from}, then
        ${standard.minDays}–${standard.maxDays} working days with ${standard.carrier}.
      </p>
      <ul class="delivery-box__list small" data-delivery-options>
        ${fulfilment.shipping.map((s) => {
          const e = estimateDelivery({
            stock: product.stock,
            shipping: s,
            handling: fulfilment.handling,
            now: new Date()
          });
          return raw(`<li>
            <span>${esc(s.label)}</span>
            <span class="nowrap"><strong>${esc(formatWindow(e.earliest, e.latest))}</strong> · ${
              s.freeOver ? `${formatMoney(s.price)}, free over ${formatMoney(s.freeOver)}` : formatMoney(s.price)
            }</span>
          </li>`);
        })}
      </ul>
      <p class="xs mt-3" style="color:var(--ink-3)">
        Working days only, ${site.dispatch.workingDays.toLowerCase()}. Adding a tailoring service
        above moves these dates and the figures update as you choose.
        ${raw(sampleTag('Sample fulfilment data'))}
      </p>
    </div>
  `;
}

function returnsSummary(product) {
  const hasCustomisation = product.services.length > 0;
  return html`
    <div class="pdp__block small">
      <p>
        ${raw(icon('refresh', { size: 15 }))}
        <strong>${returnsPolicy.summary}</strong> Unworn with tags attached, using the prepaid label in the box.
      </p>
      ${hasCustomisation
        ? html`<p class="mt-2" style="color:var(--warn)">
            One exception: anything we cut or stitch for you — fall and pico, a stitched blouse, a
            ready-to-wear conversion — cannot be returned, because it has been made to your
            measurements. We repeat this next to each service before you tick it.
          </p>`
        : ''}
      <p class="mt-2">
        <a class="link link--arrow" href="${url('/returns/')}">Full returns policy</a>
      </p>
    </div>
  `;
}

function unstitchedDimensions(product) {
  if (product.readyToWear || product.type !== 'saree') return '';
  return html`
    <div class="pdp__block">
      ${raw(
        notice(
          `<p><strong>This is an unstitched saree, so there is no dress size.</strong></p>
           <p>
             It arrives as a single length of cloth — ${product.dimensions.lengthM} metres long and
             ${product.dimensions.widthCm}cm wide — that you pleat and drape to your own height. One
             length fits everybody; what changes is how many pleats you make and where the
             ${term('pallu', 'The decorated end of the saree, the part that falls over your shoulder.')}
             falls.
           </p>
           ${
             product.blousePiece.included
               ? `<p>
                    The attached blouse piece is ${product.blousePiece.lengthCm}cm of flat fabric
                    (${cmToIn(product.blousePiece.lengthCm)} inches), cut from the same run so the
                    colour matches. It is <strong>not</strong> a made-up blouse — the blouse on the
                    illustration is a styling suggestion, not what you receive.
                  </p>`
               : ''
           }`,
          { tone: 'info', iconName: 'ruler' }
        )
      )}
    </div>
  `;
}

function detailAccordion(product) {
  const fabric = fabricById[product.fabric];
  const weave = weaveById[product.weave];
  const diff = product.attributes.drapeDifficulty ? drapeDifficulty[product.attributes.drapeDifficulty] : null;

  const specRows = [
    { label: 'Fabric', value: esc(product.fabricLabel), note: fabric ? fabric.plain : null },
    { label: 'Composition', value: esc(product.composition) },
    weave && weave.id !== 'none'
      ? {
          term: term('Weave or technique', weave.plain, weave.marker ? `How to spot it: ${weave.marker}` : null),
          value: `${esc(weave.label)}${weave.region ? ` — ${esc(weave.region)}` : ''}`,
          note: weave.marker ? `How to spot it: ${weave.marker}` : null
        }
      : { label: 'Weave or technique', value: 'Not a named regional weave', note: weaveById.none.plain },
    {
      label: 'Provenance',
      value: `<strong>${esc(product.provenance.short)}</strong>`,
      note: product.provenance.full
    },
    product.dimensions.lengthM
      ? {
          label: 'Saree length',
          value: `${product.dimensions.lengthM} metres (${Math.round(product.dimensions.lengthM * 39.37)} inches)`
        }
      : null,
    product.dimensions.widthCm
      ? { label: 'Saree width', value: `${product.dimensions.widthCm}cm (${cmToIn(product.dimensions.widthCm)} inches)` }
      : null,
    {
      term: term(
        'Blouse piece',
        'A length of matching fabric attached to the end of the saree, meant to be made up into a blouse by a tailor.'
      ),
      value: product.blousePiece.included
        ? product.blousePiece.stitched
          ? 'Included, stitched to the size you select'
          : `Included, ${product.blousePiece.lengthCm}cm, <strong>unstitched</strong>`
        : 'Not included',
      note: product.blousePiece.included && !product.blousePiece.stitched
        ? 'Arrives as flat fabric. Add stitching above, or take it to any tailor.'
        : null
    },
    {
      term: term('Petticoat', 'An A-line underskirt worn beneath the saree. The pleats are tucked into its waistband.'),
      value: product.petticoat.included
        ? 'Included'
        : product.petticoat.required
          ? '<strong>Required, not included</strong>'
          : 'Not needed with this piece',
      note: product.petticoat.required && !product.petticoat.included ? 'We sell cotton and satin petticoats from £22.' : null
    },
    product.attributes.sheerness ? { label: 'Sheerness', value: esc(product.attributes.sheerness) } : null,
    product.attributes.texture ? { label: 'Texture', value: esc(product.attributes.texture) } : null,
    product.attributes.weightLabel ? { label: 'Weight', value: esc(product.attributes.weightLabel) } : null,
    diff
      ? {
          term: term('Ease of draping', 'Our own rating of how hard this fabric is to pleat and pin, from 1 (very easy) to 5 (advanced).'),
          value: easeMeter(product.attributes.drapeDifficulty),
          note: diff.plain
        }
      : null,
    product.lining ? { label: 'Lining', value: esc(product.lining) } : null,
    { label: 'Care', value: esc(product.care) },
    { label: 'Country of origin', value: esc(product.origin) },
    {
      term: term(
        'Fall and pico',
        'Fall is a cotton tape sewn inside the bottom edge so the pleats hang straight. Pico is a narrow rolled hem finishing the raw edges.'
      ),
      value: product.services.includes('fallPico')
        ? `Available, ${formatMoney(services.fallPico.price)}, adds ${services.fallPico.leadDays} working days`
        : 'Not offered on this piece',
      note: product.services.includes('fallPico') ? 'Not returnable once stitched.' : null
    }
  ];

  const items = [
    {
      title: 'Full specification',
      open: true,
      body: specList(specRows)
    },
    {
      title: 'What we would tell you in the shop',
      body: `<p>${esc(product.honest)}</p>${
        product.styling ? `<p class="mt-3"><strong>Styling:</strong> ${esc(product.styling)}</p>` : ''
      }`
    },
    {
      title: 'Care and storage',
      body: `<p>${esc(product.care)}</p>
        <ul class="mt-3 small stack-2">
          <li>Store folded in a breathable cotton or muslin bag, never in plastic — trapped damp is what yellows silk.</li>
          <li>Refold along different lines once a year so permanent creases do not set into the same place.</li>
          <li>Blot spills, never rub. Rubbing lifts the surface fibres and leaves a dull patch.</li>
        </ul>
        <p class="mt-3"><a class="link link--arrow" href="${url('/saree-guide/care/')}">Full care guide</a></p>`
    },
    {
      title: 'Delivery and returns',
      body: `<p>Dispatched from ${esc(site.dispatch.from)}. Standard tracked delivery ${formatMoney(
        fulfilment.shipping[0].price
      )}, free over ${formatMoney(fulfilment.shipping[0].freeOver)}. Express and named-day delivery are available at checkout.</p>
        <p class="mt-3">${esc(returnsPolicy.detail)}</p>
        <p class="mt-3"><strong>Cannot be returned:</strong></p>
        <ul class="small mt-2 stack-2">${returnsPolicy.exclusions.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
        <p class="mt-3 small">${esc(returnsPolicy.faultyNote)}</p>
        <p class="mt-3">${sampleTag('Sample policy — for business and legal review')}</p>`
    }
  ];

  if (product.sizes) {
    items.splice(1, 0, { title: 'Size chart and fit', body: sizeTable(product) });
  }

  return accordion(items);
}

export function productPage(product) {
  const fabric = fabricById[product.fabric];
  const weave = weaveById[product.weave];
  const buyable = stockStates[product.stock].buyable;
  const essentials = relevantEssentials(product);
  const similar = alsoLike(product);
  const views = galleryViews(product);

  // Data the browser needs to recompute totals and delivery locally.
  const clientData = {
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    type: product.type,
    readyToWear: product.readyToWear,
    colours: product.colours,
    sizes: product.sizes,
    sizeStock: product.sizeStock || null,
    services: product.services.map((id) => ({
      id,
      label: services[id].label,
      price: services[id].price,
      leadDays: services[id].leadDays,
      requiresMeasurements: services[id].requiresMeasurements
    })),
    defaultColour: defaultColour(product),
    image: imgPath(product.id, 'drape', defaultColour(product)),
    views: views.map((v) => ({ ...v, src: imgPath(product.id, v.id, defaultColour(product)) })),
    imageBase: url('/assets/img/products/'),
    href: url(`/products/${product.id}/`)
  };

  const body = html`
    <div class="container">
      ${raw(
        breadcrumb([
          { label: 'Home', href: '/' },
          { label: product.type === 'saree' ? 'Shop Sarees' : 'Blouses & Essentials', href: product.type === 'saree' ? '/collections/sarees/' : '/collections/blouses-essentials/' },
          { label: product.name }
        ])
      )}

      <div class="pdp">
        <div>${raw(gallery(product))}</div>

        <div class="pdp__buy">
          <form data-buy-form novalidate>
            <div class="pdp__eyebrow">
              ${raw(product.isNew ? badge('New in', 'new') : '')}
              ${raw(stockBadge(product))}
              ${raw(
                weave && weave.id !== 'none'
                  ? `<span class="badge">${esc(weave.label)}</span>`
                  : ''
              )}
              ${raw(product.readyToWear && product.type === 'saree' ? badge('Ready to wear', 'accent') : '')}
            </div>

            <h1 class="pdp__title">${product.name}</h1>
            <p class="pdp__sub">
              ${product.fabricLabel}${raw(weave && weave.region ? ` · ${esc(weave.region)}` : '')}
            </p>
            <p class="small muted mt-2">${product.editorial}</p>

            <div class="pdp__price-row">
              <span class="pdp__price" data-base-price="${product.price}">${raw(formatMoney(product.price))}</span>
              <span class="pdp__tax">${site.vat.note} Free UK delivery over £150.</span>
            </div>

            <p class="small mt-3">
              <strong>${stockStates[product.stock].label}.</strong> ${stockStates[product.stock].plain}
            </p>

            ${raw(colourSelector(product))}
            ${raw(sizeSelector(product))}
            ${raw(unstitchedDimensions(product))}
            ${raw(includedBlock(product))}
            ${raw(serviceBlock(product))}
            ${raw(deliveryBlock(product))}

            <div class="buy-row">
              <div class="buy-row__line" data-total-line hidden>
                <span>Total for this item</span>
                <span class="buy-row__total" data-line-total>${raw(formatMoney(product.price))}</span>
              </div>

              <div class="cluster" style="gap:var(--sp-3)">
                <div class="qty">
                  <button type="button" data-qty-down aria-label="Reduce quantity" disabled>−</button>
                  <label class="visually-hidden" for="qty">Quantity</label>
                  <input id="qty" name="quantity" type="number" value="1" min="1" max="10" inputmode="numeric" data-qty />
                  <button type="button" data-qty-up aria-label="Increase quantity">+</button>
                </div>
                <button
                  class="btn btn--accent btn--lg"
                  type="submit"
                  style="flex:1;min-width:12rem"
                  data-add-to-bag
                  ${raw(buyable ? '' : 'disabled aria-disabled="true"')}
                >
                  ${buyable ? 'Add to bag' : 'Out of stock'}
                </button>
              </div>

              <p class="field__error" data-buy-error hidden></p>

              ${raw(
                buyable
                  ? ''
                  : `<div class="cluster mt-2">
                       <a class="btn btn--quiet btn--block" href="${url('/contact/')}">Ask when it is back</a>
                     </div>`
              )}

              <button class="btn btn--quiet btn--block" type="button" data-wishlist-toggle="${product.id}" aria-pressed="false">
                ${raw(icon('heart', { size: 16 }))} <span data-wishlist-label>Save to wishlist</span>
              </button>
            </div>

            ${raw(returnsSummary(product))}
          </form>
        </div>
      </div>
    </div>

    <div class="container" style="padding-bottom:var(--sp-8)">
      <div class="grid" style="grid-template-columns:minmax(0,1fr);gap:var(--sp-7)">
        <div style="max-width:60rem">
          <h2 class="h3 mb-5">About this saree</h2>
          <p class="lede">${product.description}</p>
          ${raw(detailAccordion(product))}
        </div>
      </div>
    </div>

    ${product.type === 'saree'
      ? html`
          <section class="section section--sand">
            <div class="container">
              ${raw(
                sectionHead({
                  eyebrow: 'Never draped one before',
                  title: 'How you would actually put this on',
                  body: `Five steps, in the order you do them. ${
                    product.attributes.drapeDifficulty >= 4
                      ? 'This fabric is one of the harder ones, so give yourself twenty minutes the first time — or have us convert it to ready to wear.'
                      : 'This fabric is forgiving, so the first attempt usually takes about ten minutes.'
                  }`,
                  link: { label: 'Full draping guide', href: '/saree-guide/draping/' }
                })
              )}
              <div class="step-list step-list--4">
                <div class="step">
                  <h3>Petticoat and blouse first</h3>
                  <p>Put on the fitted blouse and the petticoat, tied at the height you want the saree hem to sit — just off the floor in the shoes you will wear.</p>
                </div>
                <div class="step">
                  <h3>Tuck and go round once</h3>
                  <p>Tuck the plain end into the petticoat at your right hip and wrap the whole saree once around yourself.</p>
                </div>
                <div class="step">
                  <h3>Make five to seven pleats</h3>
                  <p>Gather even pleats at the front, hold them together, and tuck the whole bundle into the waistband facing left.</p>
                </div>
                <div class="step">
                  <h3>Pallu over the shoulder, pin</h3>
                  <p>Take the remaining length across your front, up over the left shoulder, and pin it at the shoulder seam of the blouse — not through the saree alone.</p>
                </div>
              </div>
            </div>
          </section>
        `
      : ''}

    ${essentials.length
      ? html`
          <section class="section">
            <div class="container">
              ${raw(
                sectionHead({
                  eyebrow: 'You will need',
                  title: 'What goes with it',
                  body: 'Chosen from what this piece actually needs — not everything we sell.'
                })
              )}
              <div class="product-grid product-grid--4">
                ${essentials.map((p, i) => raw(productCard(p, { index: i })))}
              </div>
            </div>
          </section>
        `
      : ''}

    ${similar.length
      ? html`
          <section class="section section--sand">
            <div class="container">
              ${raw(
                sectionHead({
                  eyebrow: 'Close to this',
                  title: buyable ? 'You might also consider' : 'Available instead',
                  body: buyable
                    ? 'Similar occasion or similar fabric, at a similar price.'
                    : 'Since this one is out of stock, these are the nearest pieces we do have.'
                })
              )}
              <div class="product-grid product-grid--4">
                ${similar.map((p, i) => raw(productCard(p, { index: i })))}
              </div>
            </div>
          </section>
        `
      : ''}

    <!-- Compact sticky purchase bar for narrow screens. -->
    <div class="sticky-buy" data-sticky-buy>
      <div class="sticky-buy__inner">
        <div class="sticky-buy__meta">
          <p class="sticky-buy__name">${product.name}</p>
          <p class="sticky-buy__price"><span data-sticky-price>${raw(formatMoney(product.price))}</span></p>
        </div>
        <button class="btn btn--accent" type="button" data-sticky-add ${raw(buyable ? '' : 'disabled aria-disabled="true"')}>
          ${buyable ? 'Add to bag' : 'Out of stock'}
        </button>
      </div>
    </div>

    <script type="application/json" data-product-json>${raw(JSON.stringify(clientData))}</script>
  `;

  return page({
    title: product.name,
    description: `${product.editorial} ${product.fabricLabel}. ${formatMoney(product.price)}, free UK delivery over £150.`,
    path: `/products/${product.id}/`,
    activeKey: product.type === 'saree' ? 'sarees' : 'blouses-essentials',
    body,
    pageData: 'product',
    scripts: ['/assets/js/product.mjs'],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      material: product.composition,
      countryOfOrigin: product.origin,
      brand: { '@type': 'Brand', name: BRAND },
      color: product.colour.name,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'GBP',
        price: (product.price / 100).toFixed(2),
        availability: buyable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: url(`/products/${product.id}/`)
      }
    }
  });
}
