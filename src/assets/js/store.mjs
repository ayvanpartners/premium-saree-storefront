/* ------------------------------------------------------------------ *
 * Bag and wishlist state.
 *
 * Persisted in localStorage on the customer's own device. Nothing is
 * transmitted anywhere — there is no server in this build. Every write
 * publishes an event so the header count, the drawer, the bag page and
 * the checkout stay in step without any of them polling.
 * ------------------------------------------------------------------ */

const BAG_KEY = 'bag';
const WISH_KEY = 'wishlist';
const ORDER_KEY = 'lastOrder';

/* localStorage throws in private modes and when storage is disabled.
 * A shop that breaks because storage is off is a broken shop, so every
 * access degrades to an in-memory fallback instead. */
const memory = new Map();
let storageWorks = null;

function canStore() {
  if (storageWorks !== null) return storageWorks;
  try {
    const probe = '__probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
  return storageWorks;
}

function readRaw(key, fallback) {
  try {
    const raw = canStore() ? localStorage.getItem(key) : memory.get(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeRaw(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (canStore()) localStorage.setItem(key, raw);
    else memory.set(key, raw);
  } catch {
    memory.set(key, raw);
  }
}

export function storageAvailable() {
  return canStore();
}

/* ------------------------------- Events --------------------------- */
const bus = new EventTarget();

export function on(type, handler) {
  bus.addEventListener(type, handler);
  return () => bus.removeEventListener(type, handler);
}

function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

/* Another tab changed the bag — reflect it rather than overwriting. */
window.addEventListener('storage', (e) => {
  if (e.key === BAG_KEY) emit('bag:change', { lines: getBag(), external: true });
  if (e.key === WISH_KEY) emit('wishlist:change', { ids: getWishlist(), external: true });
});

/* -------------------------------- Bag ----------------------------- */

/** A line is uniquely identified by the product plus every choice made
 * about it, so adding the same saree with different tailoring creates
 * two lines rather than silently merging them. */
export function lineKey(line) {
  const svc = (line.services || [])
    .map((s) => s.id)
    .sort()
    .join('+');
  const meas = line.measurements ? JSON.stringify(line.measurements) : '';
  const opts = line.blouseOptions ? JSON.stringify(line.blouseOptions) : '';
  return [line.id, line.colour || '', line.size || '', svc, meas, opts].join('|');
}

export function getBag() {
  const lines = readRaw(BAG_KEY, []);
  return Array.isArray(lines) ? lines.filter((l) => l && l.id) : [];
}

function saveBag(lines) {
  writeRaw(BAG_KEY, lines);
  emit('bag:change', { lines });
}

export function bagCount() {
  return getBag().reduce((n, l) => n + (Number(l.quantity) || 0), 0);
}

export function addToBag(line) {
  const lines = getBag();
  const key = lineKey(line);
  const existing = lines.find((l) => lineKey(l) === key);
  if (existing) {
    existing.quantity = Math.min(10, (Number(existing.quantity) || 1) + (Number(line.quantity) || 1));
  } else {
    lines.push({ ...line, key, quantity: Math.min(10, Number(line.quantity) || 1) });
  }
  saveBag(lines);
  emit('bag:added', { line });
  return lines;
}

export function updateQuantity(key, quantity) {
  const lines = getBag();
  const line = lines.find((l) => lineKey(l) === key);
  if (!line) return lines;
  const q = Number(quantity);
  if (!Number.isFinite(q) || q < 1) return removeLine(key);
  line.quantity = Math.min(10, Math.floor(q));
  saveBag(lines);
  return lines;
}

export function removeLine(key) {
  const lines = getBag();
  const idx = lines.findIndex((l) => lineKey(l) === key);
  if (idx === -1) return lines;
  const [removed] = lines.splice(idx, 1);
  saveBag(lines);
  emit('bag:removed', { line: removed });
  return lines;
}

export function replaceLine(key, next) {
  const lines = getBag();
  const idx = lines.findIndex((l) => lineKey(l) === key);
  if (idx === -1) return lines;
  lines[idx] = { ...next, key: lineKey(next) };
  saveBag(lines);
  return lines;
}

export function clearBag() {
  saveBag([]);
}

/* Undo support for removals: keep the last removed line in memory only,
 * so "undo" works within the session but nothing lingers on disk. */
let lastRemoved = null;
export function rememberRemoved(line) {
  lastRemoved = line;
}
export function restoreRemoved() {
  if (!lastRemoved) return null;
  const line = lastRemoved;
  lastRemoved = null;
  addToBag(line);
  return line;
}

/* ----------------------------- Discount --------------------------- */
const DISCOUNT_KEY = 'discountCode';
export function getDiscount() {
  return readRaw(DISCOUNT_KEY, null);
}
export function setDiscount(code) {
  writeRaw(DISCOUNT_KEY, code || null);
  emit('bag:change', { lines: getBag() });
}

/* ----------------------------- Shipping --------------------------- */
const SHIPPING_KEY = 'shippingId';
export function getShippingId() {
  return readRaw(SHIPPING_KEY, 'standard');
}
export function setShippingId(id) {
  writeRaw(SHIPPING_KEY, id);
  emit('bag:change', { lines: getBag() });
}

/* ----------------------------- Wishlist --------------------------- */
export function getWishlist() {
  const ids = readRaw(WISH_KEY, []);
  return Array.isArray(ids) ? ids.filter((i) => typeof i === 'string') : [];
}

export function isWished(id) {
  return getWishlist().includes(id);
}

export function toggleWishlist(id) {
  const ids = getWishlist();
  const idx = ids.indexOf(id);
  const added = idx === -1;
  if (added) ids.push(id);
  else ids.splice(idx, 1);
  writeRaw(WISH_KEY, ids);
  emit('wishlist:change', { ids, added, id });
  return added;
}

export function clearWishlist() {
  writeRaw(WISH_KEY, []);
  emit('wishlist:change', { ids: [] });
}

/* ------------------------------ Orders ---------------------------- */
export function saveOrder(order) {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    memory.set(ORDER_KEY, JSON.stringify(order));
  }
  // Also keep a small index so the tracking page can find it later.
  const index = readRaw('orderIndex', []);
  index.unshift({ number: order.number, postcode: order.address.postcode, at: order.placedAt });
  writeRaw('orderIndex', index.slice(0, 10));
}

export function getLastOrder() {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY) || memory.get(ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function findOrder(number, postcode) {
  const last = getLastOrder();
  const norm = (s) => String(s || '').toUpperCase().replace(/\s+/g, '');
  if (
    last &&
    norm(last.number) === norm(number) &&
    norm(last.address && last.address.postcode) === norm(postcode)
  ) {
    return last;
  }
  return null;
}
