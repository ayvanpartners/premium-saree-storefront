/* ------------------------------------------------------------------ *
 * HTML helpers and the icon set.
 * ------------------------------------------------------------------ */

let BASE = '';

/** Set once by the build. GitHub Pages serves from /<repo>/, a custom
 * domain serves from /, and every internal href goes through url(). */
export function setBase(base) {
  BASE = base.replace(/\/$/, '');
}
export function getBase() {
  return BASE;
}

/** Resolve an internal path against the deploy base. */
export function url(path) {
  if (!path) return BASE + '/';
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const [p, q] = path.split(/(?=\?)/);
  return BASE + p + (q || '');
}

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Markup that is already safe to emit.
 *
 * It behaves as a string everywhere (template literals call toString),
 * but `render` recognises it and does not escape it a second time.
 * This is what stops nested html`` templates being escaped into
 * visible tag soup — a mistake that is silent until you look at the
 * page, so the type system has to catch it instead.
 */
class Safe {
  constructor(value) {
    this.value = value == null ? '' : String(value);
    this.__raw = true;
  }
  toString() {
    return this.value;
  }
}

/** Template tag that escapes interpolations by default.
 * Anything produced by html() or raw() passes through untouched. */
export function html(strings, ...values) {
  return raw(
    strings.reduce((out, s, i) => {
      if (i === 0) return s;
      return out + render(values[i - 1]) + s;
    }, '')
  );
}

function render(v) {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(render).join('');
  if (typeof v === 'object' && v.__raw) return v.value;
  return esc(v);
}

export function raw(value) {
  return value instanceof Safe ? value : new Safe(value);
}

export { Safe };

/** Build an attribute string, dropping null/undefined/false. */
export function attrs(map) {
  return Object.entries(map)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
}

export function cls(...parts) {
  return parts
    .flat()
    .filter((p) => p && typeof p === 'string')
    .join(' ');
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/* --------------------------- Icon set ----------------------------- *
 * Stroke icons at 24x24, inheriting currentcolor. Inlined rather than
 * sprited: the whole set is under 2KB and avoids an extra request.
 * ------------------------------------------------------------------ */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  heart:
    '<path d="M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 8.2a4.3 4.3 0 0 1 7.5 2.6c0 5.1-7.5 9.7-7.5 9.7Z"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m4 8 6 6 6-6" transform="translate(2 2)"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  truck: '<path d="M2 7h11v9H2zM13 11h4l3 3v2h-7z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4h-4"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21M11 8.5v5M8.5 11h5"/>',
  ruler: '<path d="M3 9h18v6H3z"/><path d="M7 9v3M11 9v3M15 9v3M19 9v3"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 20 18M8 16.5 20 6"/>',
  spool: '<path d="M7 3h10v18H7z"/><path d="M7 8h10M7 16h10"/>',
  lock: '<path d="M5 11h14v10H5z"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  mail: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2.2 2A16 16 0 0 1 4 5.2 2 2 0 0 1 6 3Z"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.4"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/>',
  bagEmpty: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 13.5h5"/>',
  heartEmpty: '<path d="M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0 1 12 8.2a4.3 4.3 0 0 1 7.5 2.6c0 5.1-7.5 9.7-7.5 9.7Z"/><path d="M9 11h6"/>',
  searchEmpty: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21M8.5 11h5"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v5M12 17.5v.5"/>',
  drape: '<path d="M6 3c0 6-3 9-3 13a4 4 0 0 0 8 0c0-4-3-7-3-13"/><path d="M15 3c0 6 3 9 3 13a4 4 0 0 1-8 0"/>'
};

export function icon(name, { size = 24, label = null, cls: klass = null } = {}) {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const a = label
    ? ` role="img" aria-label="${esc(label)}"`
    : ' aria-hidden="true" focusable="false"';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"${klass ? ` class="${esc(klass)}"` : ''}${a} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
