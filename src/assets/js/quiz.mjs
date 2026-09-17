/* ------------------------------------------------------------------ *
 * "Find your first saree": a filter with a friendly face.
 *
 * It does not score, rank by margin, or pretend to be clever. It
 * narrows the catalogue by four answers and explains, for each result,
 * exactly why it is there — so the customer can disagree with it.
 * ------------------------------------------------------------------ */

import { catalogue } from './catalogue.mjs';
import { announce, el } from './ui.mjs';
import { formatMoney } from './commerce.mjs';
import * as store from './store.mjs';

const form = document.querySelector('[data-quiz]');
const results = document.querySelector('[data-quiz-results]');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const answers = Object.fromEntries(new FormData(form).entries());
    const missing = ['occasion', 'skill', 'warmth', 'budget'].filter((k) => !answers[k]);
    if (missing.length) {
      results.hidden = false;
      results.innerHTML = `
        <div class="notice notice--warn">
          <div class="notice__body">
            <p><strong>Answer all four and we will narrow it down.</strong></p>
            <p>Still to answer: ${missing
              .map((m) => ({ occasion: 'where you are wearing it', skill: 'how you feel about draping', warmth: 'whether the room will be warm', budget: 'your budget' }[m]))
              .join(', ')}.</p>
          </div>
        </div>`;
      announce('Please answer all four questions.');
      results.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    let data;
    try {
      data = await catalogue();
    } catch {
      results.hidden = false;
      results.innerHTML = `<div class="notice notice--err"><div class="notice__body"><p><strong>We could not load the catalogue.</strong></p><p>Use the <a class="link" href="../../collections/sarees/">filters on the collection page</a> instead — the same choices are available there.</p></div></div>`;
      return;
    }

    render(pick(data, answers), answers);
  });

  const reset = form.querySelector('[data-quiz-reset]');
  if (reset) {
    reset.addEventListener('click', () => {
      results.hidden = true;
      results.innerHTML = '';
    });
  }
}

function pick(data, a) {
  const maxPrice = Number(a.budget.split('-')[1]);
  const easyFabrics = ['cotton', 'georgette', 'linen', 'silk-blend'];
  const lightFabrics = ['cotton', 'chiffon', 'georgette', 'linen', 'silk-blend', 'organza'];

  return data.products
    .filter((p) => p.type === 'saree')
    .filter((p) => p.stock !== 'out-of-stock')
    .filter((p) => p.price <= maxPrice)
    .filter((p) => p.occasions.includes(a.occasion))
    .filter((p) => {
      if (a.skill === 'rtw') return p.readyToWear;
      if (a.skill === 'easy') return p.drapeDifficulty <= 2 || p.readyToWear;
      return true;
    })
    .filter((p) => {
      if (a.warmth !== 'warm') return true;
      return lightFabrics.includes(p.fabric) && (p.weightGsm == null || p.weightGsm <= 220);
    })
    .map((p) => ({ product: p, reasons: reasonsFor(p, a, easyFabrics) }))
    .sort((x, y) => {
      // Easiest first when the customer said they wanted forgiving,
      // otherwise cheapest first — neither is a margin decision.
      if (a.skill === 'easy' || a.skill === 'rtw') {
        return (x.product.drapeDifficulty || 3) - (y.product.drapeDifficulty || 3) || x.product.price - y.product.price;
      }
      return x.product.price - y.product.price;
    })
    .slice(0, 6);
}

function reasonsFor(p, a, easyFabrics) {
  const out = [];
  if (p.readyToWear) out.push('Ready to wear, so there is no draping to learn');
  else if (p.drapeDifficulty === 1) out.push('The easiest kind of fabric to drape — it grips itself');
  else if (p.drapeDifficulty === 2) out.push('Forgiving to drape, a handful of pins is enough');
  if (a.warmth === 'warm' && p.weightGsm && p.weightGsm <= 150) out.push('Light and breathable for a warm room');
  if (p.occasionLabels.length) out.push(`Suits ${p.occasionLabels.join(' and ').toLowerCase()}`);
  if (p.blousePieceIncluded) out.push('Blouse piece included');
  if (p.stock === 'in-stock') out.push('In stock, so it ships next working day');
  return out.slice(0, 4);
}

function render(picks, a) {
  results.hidden = false;
  const wishlist = store.getWishlist();

  if (!picks.length) {
    results.innerHTML = `
      <div class="empty-state">
        <h2>Nothing matches all four answers</h2>
        <p>
          That combination is a little too tight for what we have in stock right now — most often it is
          the budget together with the occasion.
        </p>
        <div class="empty-state__suggest">
          <h3 class="h4 mb-4">What we would change</h3>
          <ul class="stack-2 small">
            <li><strong>Raise the budget by one step.</strong> Most occasions have something between £95 and £195.</li>
            <li><strong>Reconsider ready to wear.</strong> If you ticked "would rather not learn", the pre-pleated range is small but it is the quickest route.</li>
            <li><strong>Try "happy to try, but forgiving"</strong> instead — cotton and georgette are genuinely easy, and it opens up a lot more.</li>
          </ul>
          <div class="cluster mt-5">
            <a class="btn btn--quiet" href="../../collections/sarees/">Browse everything with filters</a>
            <a class="btn btn--quiet" href="../../contact/">Ask us directly</a>
          </div>
        </div>
      </div>`;
    announce('No sarees match all four answers. Suggestions are shown.');
    results.scrollIntoView({ block: 'start', behavior: 'smooth' });
    return;
  }

  const heading = el('div', { class: 'mb-6' });
  heading.append(
    el('h2', { class: 'h2', text: picks.length === 1 ? 'One saree fits' : `${picks.length} sarees fit` }),
    el('p', {
      class: 'lede mt-3',
      text: 'Each one says why it is here. If a reason does not matter to you, ignore it and change your answers above.'
    })
  );

  const grid = el('div', { class: 'stack-5' });
  for (const { product: p, reasons } of picks) {
    const row = el('article', {
      class: 'guide-card',
      style: 'flex-direction:row;gap:var(--sp-5);align-items:flex-start;cursor:default;flex-wrap:wrap'
    });
    const media = el('a', { href: p.href, style: 'flex:0 0 7rem;display:block' });
    media.append(
      el('img', {
        src: p.image,
        alt: `${p.name}, illustrated drape`,
        width: 900,
        height: 1200,
        loading: 'lazy',
        decoding: 'async',
        style: 'aspect-ratio:3/4;object-fit:cover;background:var(--sand-2)'
      })
    );

    const body = el('div', { style: 'flex:1;min-width:14rem' });
    body.append(
      el('h3', { style: 'font-size:var(--step-2)' }, el('a', { href: p.href, text: p.name, style: 'text-decoration:none' })),
      el('p', { class: 'small muted', style: 'margin-top:var(--sp-1)', text: p.fabricLabel }),
      el('p', { class: 'card__price numeric', text: formatMoney(p.price) })
    );

    const why = el('ul', { class: 'stack-2 small', style: 'margin-top:var(--sp-3)' });
    for (const r of reasons) {
      why.append(el('li', { style: 'display:flex;gap:var(--sp-2);max-width:none' }, el('span', { style: 'color:var(--ok);font-weight:700', text: '✓' }), el('span', { text: r })));
    }
    body.append(why);

    body.append(
      el(
        'div',
        { class: 'cluster', style: 'margin-top:var(--sp-4)' },
        el('a', { class: 'btn btn--sm', href: p.href, text: 'See the detail' }),
        el('a', { class: 'link small', href: '../draping/', text: 'How to drape it' })
      )
    );

    row.append(media, body);
    grid.append(row);
  }

  const footer = el('div', { class: 'mt-7' });
  footer.append(
    el('div', { class: 'notice notice--info' },
      el('div', { class: 'notice__body' },
        el('p', {}, el('strong', { text: 'Still want a person to check?' })),
        el('p', { html: `Email us the occasion and date and we will confirm the choice and the timing before you order. <a class="link" href="../../contact/">Contact us</a>.` })
      )
    )
  );

  results.textContent = '';
  results.append(heading, grid, footer);
  announce(`${picks.length} sarees match your answers.`);
  results.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
