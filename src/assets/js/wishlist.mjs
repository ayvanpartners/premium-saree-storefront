/* ------------------------------------------------------------------ *
 * Wishlist page. Cards are rebuilt from the catalogue index rather
 * than stored, so a saved item always shows its current price and
 * stock rather than whatever was true when it was saved.
 * ------------------------------------------------------------------ */

import { catalogue } from './catalogue.mjs';
import * as store from './store.mjs';
import { announce, toast, el } from './ui.mjs';
import { formatMoney } from './commerce.mjs';

const grid = document.querySelector('[data-wishlist-grid]');
const empty = document.querySelector('[data-wishlist-empty]');
const suggest = document.querySelector('[data-wishlist-suggest]');
const clearBtn = document.querySelector('[data-clear-wishlist]');

let data = null;

async function render() {
  const ids = store.getWishlist();
  const hasItems = ids.length > 0;
  if (empty) empty.hidden = hasItems;
  if (suggest) suggest.hidden = !hasItems;
  if (clearBtn) clearBtn.hidden = !hasItems;
  if (!grid) return;

  if (!hasItems) {
    grid.textContent = '';
    return;
  }

  // Skeletons while the index loads, so the layout does not jump.
  if (!data) {
    grid.innerHTML = ids
      .map(
        () => `<div><div class="skeleton skeleton--media"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>`
      )
      .join('');
    try {
      data = await catalogue();
    } catch {
      grid.innerHTML = `<p class="small">We could not load your saved pieces just now. <a class="link" href="../collections/sarees/">Browse all sarees</a>.</p>`;
      return;
    }
  }

  const products = ids.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  const missing = ids.length - products.length;

  grid.textContent = '';
  for (const p of products) grid.append(card(p));

  if (missing > 0) {
    grid.append(
      el('p', {
        class: 'small muted',
        style: 'grid-column:1/-1',
        text: `${missing} saved ${missing === 1 ? 'piece is' : 'pieces are'} no longer in our catalogue and have been left out.`
      })
    );
  }
}

function card(p) {
  const buyable = p.stock !== 'out-of-stock';
  const article = el('article', { class: `card${buyable ? '' : ' card--out'}`, dataset: { productCard: '', id: p.id, name: p.name } });

  const media = el('div', { class: 'card__media' });
  if (!buyable) {
    media.append(el('div', { class: 'card__flags' }, el('span', { class: 'badge badge--off', text: 'Out of stock' })));
  }
  media.append(
    el('img', {
      src: p.image,
      alt: `${p.name} shown draped on a figure. Illustration.`,
      width: 900,
      height: 1200,
      loading: 'lazy',
      decoding: 'async'
    })
  );

  const remove = el('button', {
    class: 'icon-btn card__wish',
    type: 'button',
    'aria-pressed': 'true',
    title: 'Remove from wishlist',
    html: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.6"><path d="M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 8.2a4.3 4.3 0 0 1 7.5 2.6c0 5.1-7.5 9.7-7.5 9.7Z"/></svg><span class="visually-hidden">Remove ${p.name} from wishlist</span>`
  });
  remove.addEventListener('click', () => {
    store.toggleWishlist(p.id);
    announce(`${p.name} removed from wishlist`);
    toast(`${p.name} removed from your wishlist.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          store.toggleWishlist(p.id);
          toast('Saved again.');
        }
      }
    });
  });
  media.append(remove);

  article.append(
    media,
    el('h3', { class: 'card__title' }, el('a', { href: p.href, text: p.name })),
    el('p', { class: 'card__attr', text: p.fabricLabel }),
    el('p', { class: 'card__price numeric', text: formatMoney(p.price) })
  );

  const labels = el('div', { class: 'card__labels' });
  if (p.readyToWear && p.type === 'saree') labels.append(el('span', { class: 'badge badge--accent', text: 'Ready to wear' }));
  if (p.stock === 'low-stock') labels.append(el('span', { class: 'badge badge--warn', text: 'Low stock' }));
  if (p.stock === 'made-to-order') labels.append(el('span', { class: 'badge badge--info', text: 'Made to order' }));
  if (labels.children.length) article.append(labels);

  article.append(
    el(
      'div',
      { class: 'card__cta' },
      el('a', {
        class: 'btn btn--quiet btn--sm',
        href: p.href,
        text: buyable ? 'Choose options' : 'See alternatives'
      })
    )
  );

  return article;
}

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    const ids = store.getWishlist();
    store.clearWishlist();
    announce('Wishlist cleared');
    toast(`${ids.length} ${ids.length === 1 ? 'piece' : 'pieces'} removed.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          ids.forEach((id) => store.toggleWishlist(id));
          toast('Wishlist restored.');
        }
      }
    });
  });
}

store.on('wishlist:change', render);
render();
