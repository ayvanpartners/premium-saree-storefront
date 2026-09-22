/* ------------------------------------------------------------------ *
 * Catalogue access and search.
 *
 * The product index is fetched once, lazily, the first time anything
 * needs it — so the homepage does not pay for search it may never use.
 * The URL is resolved relative to this module, which keeps it correct
 * whether the site is served from the domain root or a sub-path.
 * ------------------------------------------------------------------ */

const DATA_URL = new URL('../data/products.json', import.meta.url);

let cache = null;
let inflight = null;

export async function catalogue() {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Catalogue request failed: ${r.status}`);
      return r.json();
    })
    .then((data) => {
      cache = data;
      inflight = null;
      return data;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

export function cached() {
  return cache;
}

export async function getProduct(id) {
  const data = await catalogue();
  return data.products.find((p) => p.id === id) || null;
}

/* --------------------------- Search index ------------------------- *
 * Deliberately small and readable rather than a full search library.
 * Three behaviours matter for this shop:
 *   1. "saree" and "sari" must be the same word, in both directions.
 *   2. Regional weave names have several common English spellings.
 *   3. A single-character typo should still find the product.
 * ------------------------------------------------------------------ */

const SYNONYMS = {
  saree: ['sari', 'sarees', 'saris', 'sarie', 'seree'],
  sari: ['saree', 'sarees', 'saris'],
  kanjivaram: ['kanchipuram', 'kanjeevaram', 'kancheepuram', 'kanjivram', 'kanchi'],
  banarasi: ['benarasi', 'banaras', 'benares', 'varanasi', 'banarsi'],
  chanderi: ['chandheri'],
  jamdani: ['jamdhani'],
  ikat: ['ikkat', 'pochampally', 'pochampalli'],
  patola: ['patan patola', 'pattola'],
  paithani: ['paithni'],
  bandhani: ['bandhej', 'bandhni'],
  maheshwari: ['maheshwar'],
  tussar: ['tussah', 'tasar', 'kosa'],
  georgette: ['jorjet'],
  organza: ['organdy'],
  blouse: ['choli', 'top'],
  petticoat: ['underskirt', 'inskirt', 'pavadai'],
  pallu: ['palla', 'pallav'],
  zari: ['jari', 'gold thread'],
  'ready to wear': ['readymade', 'ready-made', 'pre-pleated', 'prestitched', 'pre-stitched', 'one minute'],
  wedding: ['shaadi', 'shadi', 'marriage', 'bridal', 'reception'],
  festive: ['diwali', 'deepavali', 'navratri', 'eid', 'pongal', 'onam', 'puja', 'pooja'],
  cotton: ['khadi', 'handloom cotton'],
  silk: ['pattu', 'resham']
};

/* Reverse map: any alias -> its canonical term(s). */
const ALIAS = new Map();
for (const [canon, aliases] of Object.entries(SYNONYMS)) {
  for (const a of aliases) {
    if (!ALIAS.has(a)) ALIAS.set(a, new Set());
    ALIAS.get(a).add(canon);
  }
  if (!ALIAS.has(canon)) ALIAS.set(canon, new Set());
  ALIAS.get(canon).add(canon);
}

function normalise(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9₹\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expand(token) {
  const out = new Set([token]);
  // Crude but effective stemming for plurals.
  if (token.endsWith('s') && token.length > 3) out.add(token.slice(0, -1));
  const aliases = ALIAS.get(token);
  if (aliases) for (const a of aliases) out.add(a);
  for (const [canon, list] of Object.entries(SYNONYMS)) {
    if (canon === token || list.includes(token)) {
      out.add(canon);
      for (const a of list) out.add(a);
    }
  }
  return out;
}

/** Levenshtein distance, capped so long strings exit early. */
function editDistance(a, b, max = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/* Words that mean the customer is asking for an essential rather than
 * a saree. Without this, "sari for a wedding" ranks the pin set above
 * the wedding sarees, because every accessory has "Saree" in its name. */
const TYPE_WORDS = {
  blouse: ['blouse', 'blouses', 'choli', 'top'],
  petticoat: ['petticoat', 'petticoats', 'underskirt', 'inskirt'],
  accessory: ['pin', 'pins', 'shapewear', 'safety'],
  care: ['wash', 'detergent', 'storage', 'muslin', 'care', 'bag', 'bags']
};

function productHaystack(p) {
  return {
    name: normalise(p.name),
    strong: normalise([p.fabricLabel, p.weaveLabel, p.colour.name].join(' ')),
    // Occasion is a strong signal of intent, so it scores above the
    // general description it used to sit in.
    occasion: normalise(p.occasionLabels.join(' ')),
    weak: normalise([p.editorial, p.colours.map((c) => c.name).join(' '), (p.tags || []).join(' ')].join(' '))
  };
}

let haystacks = null;

function buildHaystacks(productList) {
  if (haystacks) return haystacks;
  haystacks = new Map(productList.map((p) => [p.id, productHaystack(p)]));
  return haystacks;
}

/** Parse "under ₹5000", "₹2500-5000" and similar out of a query. */
function parsePrice(query) {
  const under = query.match(/(?:under|below|less than|up to)\s*₹?\s*(\d+)/);
  if (under) return { max: Number(under[1]) };
  const over = query.match(/(?:over|above|more than)\s*₹?\s*(\d+)/);
  if (over) return { min: Number(over[1]) };
  const range = query.match(/₹?\s*(\d+)\s*(?:-|to)\s*₹?\s*(\d+)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  return null;
}

export function search(data, rawQuery, { limit = 24 } = {}) {
  const query = normalise(rawQuery);
  if (!query) return { query: rawQuery, tokens: [], results: [], categories: [], corrected: null, priceFilter: null };

  const priceFilter = parsePrice(query);
  const tokens = query.split(' ').filter((t) => t.length > 1 && !['for', 'and', 'the', 'a', 'in', 'to', 'my'].includes(t));
  const hs = buildHaystacks(data.products);

  let corrected = null;
  const scored = [];

  for (const p of data.products) {
    const h = hs.get(p.id);
    let score = 0;
    let matchedAll = true;

    for (const token of tokens) {
      const variants = expand(token);
      let best = 0;
      for (const v of variants) {
        if (h.name.includes(v)) best = Math.max(best, h.name.startsWith(v) ? 14 : 10);
        else if (h.strong.includes(v)) best = Math.max(best, 8);
        else if (h.occasion.includes(v)) best = Math.max(best, 6);
        else if (h.weak.includes(v)) best = Math.max(best, 3);
      }
      // Typo tolerance: compare against individual words, not the whole
      // haystack, so "banarsi" still reaches "banarasi".
      if (best === 0) {
        const words = new Set([...h.name.split(' '), ...h.strong.split(' ')]);
        for (const w of words) {
          if (w.length < 4) continue;
          const d = editDistance(token, w, token.length > 6 ? 2 : 1);
          if (d <= (token.length > 6 ? 2 : 1)) {
            best = Math.max(best, 6 - d);
            if (!corrected) corrected = w;
            break;
          }
        }
      }
      if (best === 0) matchedAll = false;
      score += best;
    }

    if (priceFilter) {
      const okMin = priceFilter.min == null || p.price >= priceFilter.min;
      const okMax = priceFilter.max == null || p.price <= priceFilter.max;
      if (!okMin || !okMax) continue;
      if (tokens.length === 0 || !matchedAll) score += 4;
      matchedAll = true;
    }

    if (score > 0 && matchedAll) {
      // Did the customer actually ask for an essential? If so surface
      // it; if not, a saree is almost always what they meant.
      const typeWords = TYPE_WORDS[p.type] || [];
      const askedForThisType = tokens.some((t) => typeWords.includes(t));
      if (askedForThisType) score += 9;
      else if (p.type !== 'saree') score -= 6;

      if (p.stock === 'out-of-stock') score -= 3;
      if (p.isNew) score += 1;
      scored.push({ product: p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  // Matching categories, so a search for a fabric offers the collection
  // as well as individual products.
  const categories = [];
  for (const token of tokens) {
    const variants = expand(token);
    for (const f of data.fabrics) {
      if (variants.has(normalise(f.label)) || normalise(f.label).includes(token)) {
        categories.push({ label: `${f.label} sarees`, href: `${data.base}/collections/sarees/?fabric=${f.id}`, kind: 'Fabric' });
      }
    }
    for (const w of data.weaves) {
      if (variants.has(normalise(w.label)) || normalise(w.label).includes(token)) {
        categories.push({ label: `${w.label} sarees`, href: `${data.base}/collections/sarees/?weave=${w.id}`, kind: 'Weave' });
      }
    }
    for (const o of data.occasions) {
      if (normalise(o.label).includes(token) || (SYNONYMS[o.id] || []).includes(token)) {
        categories.push({ label: `${o.label} sarees`, href: `${data.base}/collections/${o.id}/`, kind: 'Occasion' });
      }
    }
    if (['ready', 'readymade', 'prepleated', 'pre-pleated', 'stitched'].includes(token)) {
      categories.push({ label: 'Ready-to-wear sarees', href: `${data.base}/collections/ready-to-wear/`, kind: 'Collection' });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const c of categories) {
    if (seen.has(c.href)) continue;
    seen.add(c.href);
    unique.push(c);
  }

  return {
    query: rawQuery,
    tokens,
    priceFilter,
    corrected: scored.length === 0 ? corrected : null,
    results: scored.slice(0, limit).map((s) => s.product),
    total: scored.length,
    categories: unique.slice(0, 4)
  };
}

/** Suggestions for an empty-result state: closest single tokens plus
 * broad entry points that will definitely return something. */
export function recover(data, rawQuery) {
  const query = normalise(rawQuery);
  const tokens = query.split(' ').filter((t) => t.length > 2);
  const vocabulary = new Set();
  for (const p of data.products) {
    normalise(`${p.name} ${p.fabricLabel} ${p.weaveLabel || ''}`)
      .split(' ')
      .forEach((w) => {
        if (w.length > 3) vocabulary.add(w);
      });
  }
  const suggestions = [];
  for (const token of tokens) {
    let best = null;
    let bestD = 99;
    for (const w of vocabulary) {
      const d = editDistance(token, w, 3);
      if (d < bestD && d <= 3) {
        bestD = d;
        best = w;
      }
    }
    if (best && best !== token) suggestions.push({ from: token, to: best });
  }
  return suggestions;
}

export { normalise };
