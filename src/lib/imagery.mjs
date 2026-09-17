/* ------------------------------------------------------------------ *
 * Procedural textile imagery.
 *
 * WHY THIS EXISTS, AND WHAT IT IS NOT
 * A real storefront ships photography. This build cannot: there is no
 * licensed photo library for a brand that does not exist, and putting
 * stock photographs of real people behind invented product claims
 * would be dishonest. So every image here is original vector artwork
 * generated from the product record — woven grounds, borders, pallu
 * motifs and stylised drape illustrations.
 *
 * It is deliberately, visibly illustration. Each file carries a
 * <title>/<desc> pair for screen readers, the gallery labels them as
 * illustrations, and /demo-notice/ says so plainly. Swap this module
 * for a real image pipeline before launch.
 *
 * Practical upside: every asset is 2-14KB of gzip-friendly text, sharp
 * at any zoom, and needs no image CDN — which is most of why the Core
 * Web Vitals numbers in the README look the way they do.
 * ------------------------------------------------------------------ */

const W = 900;
const H = 1200;

/* Deterministic PRNG so a given product always renders identically
 * between builds (stable caching, no visual churn in diffs). */
function makeRng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amt * 255);
  const g = clamp(((n >> 8) & 255) + amt * 255);
  const b = clamp((n & 255) + amt * 255);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/* A readable ink colour for motifs sitting on a given ground. */
function inkOn(hex, palette) {
  const light = luminance(hex) > 0.45;
  const candidates = palette.filter((c) => (light ? luminance(c) < 0.3 : luminance(c) > 0.55));
  return candidates[0] || (light ? shade(hex, -0.45) : shade(hex, 0.45));
}

/* ------------------------------------------------------------------ *
 * Motif vocabulary. Each returns SVG markup drawn in a 0..s box.
 * ------------------------------------------------------------------ */

const motifs = {
  buta(s, fill, accent) {
    // A small paisley-ish woven dot motif.
    const c = s / 2;
    return `<path d="M${r2(c)} ${r2(s * 0.18)}
      C${r2(s * 0.78)} ${r2(s * 0.3)} ${r2(s * 0.74)} ${r2(s * 0.66)} ${r2(c)} ${r2(s * 0.84)}
      C${r2(s * 0.26)} ${r2(s * 0.66)} ${r2(s * 0.22)} ${r2(s * 0.3)} ${r2(c)} ${r2(s * 0.18)} Z"
      fill="${fill}" opacity=".92"/>
      <circle cx="${r2(c)}" cy="${r2(s * 0.5)}" r="${r2(s * 0.08)}" fill="${accent}" opacity=".9"/>`;
  },
  diamond(s, fill, accent) {
    const c = s / 2;
    return `<path d="M${r2(c)} ${r2(s * 0.12)} L${r2(s * 0.88)} ${r2(c)} L${r2(c)} ${r2(s * 0.88)} L${r2(s * 0.12)} ${r2(c)} Z" fill="${fill}" opacity=".9"/>
      <path d="M${r2(c)} ${r2(s * 0.32)} L${r2(s * 0.68)} ${r2(c)} L${r2(c)} ${r2(s * 0.68)} L${r2(s * 0.32)} ${r2(c)} Z" fill="${accent}" opacity=".85"/>`;
  },
  flower(s, fill, accent) {
    const c = s / 2;
    let petals = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const px = c + Math.cos(a) * s * 0.26;
      const py = c + Math.sin(a) * s * 0.26;
      petals += `<ellipse cx="${r2(px)}" cy="${r2(py)}" rx="${r2(s * 0.115)}" ry="${r2(s * 0.07)}"
        transform="rotate(${r2((a * 180) / Math.PI)} ${r2(px)} ${r2(py)})" fill="${fill}" opacity=".85"/>`;
    }
    return petals + `<circle cx="${r2(c)}" cy="${r2(c)}" r="${r2(s * 0.1)}" fill="${accent}"/>`;
  },
  temple(s, fill) {
    return `<path d="M0 ${s} L${r2(s / 2)} 0 L${s} ${s} Z" fill="${fill}" opacity=".92"/>`;
  },
  leaf(s, fill, accent) {
    return `<path d="M${r2(s * 0.5)} ${r2(s * 0.12)} C${r2(s * 0.88)} ${r2(s * 0.34)} ${r2(s * 0.88)} ${r2(s * 0.66)} ${r2(s * 0.5)} ${r2(s * 0.88)}
      C${r2(s * 0.12)} ${r2(s * 0.66)} ${r2(s * 0.12)} ${r2(s * 0.34)} ${r2(s * 0.5)} ${r2(s * 0.12)} Z" fill="${fill}" opacity=".9"/>
      <path d="M${r2(s * 0.5)} ${r2(s * 0.16)} L${r2(s * 0.5)} ${r2(s * 0.84)}" stroke="${accent}" stroke-width="${r2(s * 0.035)}" opacity=".8"/>`;
  },
  peacock(s, fill, accent, ink) {
    const c = s / 2;
    let eyes = '';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7;
      const px = c + Math.cos(a) * s * 0.3;
      const py = c * 1.15 + Math.sin(a) * s * 0.3;
      eyes += `<circle cx="${r2(px)}" cy="${r2(py)}" r="${r2(s * 0.065)}" fill="${accent}"/>
        <circle cx="${r2(px)}" cy="${r2(py)}" r="${r2(s * 0.028)}" fill="${ink}"/>`;
    }
    return `<path d="M${r2(c)} ${r2(s * 0.92)} C${r2(s * 0.16)} ${r2(s * 0.7)} ${r2(s * 0.14)} ${r2(s * 0.3)} ${r2(c)} ${r2(s * 0.2)}
      C${r2(s * 0.86)} ${r2(s * 0.3)} ${r2(s * 0.84)} ${r2(s * 0.7)} ${r2(c)} ${r2(s * 0.92)} Z" fill="${fill}" opacity=".85"/>${eyes}
      <path d="M${r2(c)} ${r2(s * 0.92)} L${r2(c)} ${r2(s * 0.62)}" stroke="${ink}" stroke-width="${r2(s * 0.03)}" opacity=".7"/>`;
  }
};

/* ------------------------------------------------------------------ *
 * Pattern families -> reusable <pattern> definitions.
 * Each family returns { defs, groundFill, borderFill, palluFill }.
 * ------------------------------------------------------------------ */

function weaveTexture(id, base, rng) {
  // A faint thread grid that reads as woven cloth rather than flat fill.
  const warp = shade(base, luminance(base) > 0.5 ? -0.05 : 0.06);
  const weft = shade(base, luminance(base) > 0.5 ? -0.02 : 0.03);
  return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="${base}"/>
    <rect width="6" height="3" fill="${weft}" opacity=".5"/>
    <rect width="3" height="6" fill="${warp}" opacity=".35"/>
  </pattern>`;
}

function slubTexture(id, base, rng) {
  let lines = '';
  for (let i = 0; i < 26; i++) {
    const y = rng() * 120;
    const len = 8 + rng() * 34;
    const x = rng() * 120;
    lines += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(len)}" height="1.6" fill="${shade(base, 0.1)}" opacity="${r2(0.25 + rng() * 0.3)}"/>`;
  }
  return `<pattern id="${id}" width="120" height="120" patternUnits="userSpaceOnUse">
    <rect width="120" height="120" fill="${base}"/>${lines}</pattern>`;
}

/** Palette for a colourway. The named colour drives the ground; the
 * accent and highlight tones carry over from the product so a border
 * still reads as a border in every variant. */
export function paletteFor(product, colourSlug) {
  const colour = product.colours.find((c) => c.slug === colourSlug);
  if (!colour || colour.slug === product.colours[0].slug) return product.palette;
  const base = colour.hex;
  return [base, shade(base, 0.14), product.palette[2], product.palette[3], shade(base, -0.26)];
}

function buildPattern(product, rng, palette = product.palette, uidSuffix = '') {
  const pal = palette;
  const [c0, c1, c2, c3, c4] = pal;
  const family = product.patternFamily;
  const uid = (product.id + uidSuffix).replace(/[^a-z0-9]/gi, '');
  const ink = inkOn(c0, pal);
  const defs = [];
  let ground = `url(#g${uid})`;
  let border = c2;
  let pallu = `url(#g${uid})`;
  let palluMotif = 'buta';
  let sheer = 0;

  defs.push(weaveTexture(`g${uid}`, c0, rng));

  const scatter = (pid, base, motif, size, step, colA, colB, jitter = 0.18) => {
    let cells = '';
    for (let ry = 0; ry < 2; ry++) {
      for (let rx = 0; rx < 2; rx++) {
        const jx = (rng() - 0.5) * step * jitter;
        const jy = (rng() - 0.5) * step * jitter;
        const x = rx * step + (ry % 2 ? step / 2 : 0) + jx;
        const y = ry * step + jy;
        cells += `<g transform="translate(${r2(x)} ${r2(y)})">${motifs[motif](size, colA, colB, ink)}</g>`;
      }
    }
    defs.push(`<pattern id="${pid}" width="${step * 2}" height="${step * 2}" patternUnits="userSpaceOnUse">
      <rect width="${step * 2}" height="${step * 2}" fill="${base}"/>${cells}</pattern>`);
    return `url(#${pid})`;
  };

  switch (family) {
    case 'kanjivaram': {
      ground = scatter(`b${uid}`, c0, 'buta', 34, 74, c2, c3, 0.06);
      border = c2;
      pallu = scatter(`p${uid}`, c2, 'flower', 52, 92, c3, c0, 0.05);
      palluMotif = 'temple';
      break;
    }
    case 'brocade': {
      ground = scatter(`b${uid}`, c0, 'flower', 46, 68, c2, c3, 0.04);
      border = c3;
      pallu = scatter(`p${uid}`, c1, 'flower', 60, 82, c2, c4, 0.03);
      break;
    }
    case 'paithani': {
      ground = scatter(`b${uid}`, c0, 'buta', 26, 88, c2, c3, 0.08);
      border = c2;
      pallu = scatter(`p${uid}`, c1, 'peacock', 92, 120, c2, c3, 0.02);
      break;
    }
    case 'chanderi': {
      ground = scatter(`b${uid}`, c0, 'diamond', 16, 78, c2, c2, 0.1);
      border = c2;
      pallu = scatter(`p${uid}`, c0, 'diamond', 22, 60, c2, c3, 0.08);
      sheer = 0.28;
      break;
    }
    case 'jamdani': {
      ground = scatter(`b${uid}`, c0, 'leaf', 26, 66, c2, c2, 0.05);
      border = c2;
      pallu = scatter(`p${uid}`, c3, 'leaf', 38, 72, c0, c2, 0.04);
      sheer = 0.14;
      break;
    }
    case 'ikat':
    case 'ikat-silk':
    case 'patola': {
      // Blurred-edge geometry: the defining ikat characteristic.
      defs.push(`<filter id="f${uid}" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.6"/></filter>`);
      let cells = '';
      const step = 60;
      for (let i = 0; i < 4; i++) {
        const x = (i % 2) * step;
        const y = Math.floor(i / 2) * step;
        const col = i % 2 ? c2 : c3;
        cells += `<g filter="url(#f${uid})" transform="translate(${x} ${y})">${motifs.diamond(step, col, c0)}</g>`;
      }
      defs.push(`<pattern id="b${uid}" width="${step * 2}" height="${step * 2}" patternUnits="userSpaceOnUse">
        <rect width="${step * 2}" height="${step * 2}" fill="${c0}"/>${cells}</pattern>`);
      ground = `url(#b${uid})`;
      border = c3;
      pallu = `url(#b${uid})`;
      break;
    }
    case 'bandhani': {
      let dots = '';
      for (let i = 0; i < 80; i++) {
        const x = rng() * 100;
        const y = rng() * 100;
        dots += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(2.1 + rng() * 1.5)}" fill="${c3}" opacity="${r2(0.7 + rng() * 0.3)}"/>`;
      }
      defs.push(`<pattern id="b${uid}" width="100" height="100" patternUnits="userSpaceOnUse">
        <rect width="100" height="100" fill="${c0}"/>${dots}</pattern>`);
      ground = `url(#b${uid})`;
      border = c2;
      pallu = `url(#b${uid})`;
      break;
    }
    case 'block-print': {
      // Hand-stamped: deliberate misregistration between repeats.
      let stamps = '';
      const step = 62;
      for (let i = 0; i < 4; i++) {
        const x = (i % 2) * step + (rng() - 0.5) * 7;
        const y = Math.floor(i / 2) * step + (rng() - 0.5) * 7;
        stamps += `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2((rng() - 0.5) * 5)} ${step / 2} ${step / 2})">
          ${motifs.flower(step * 0.82, c2, c3)}</g>`;
      }
      defs.push(`<pattern id="b${uid}" width="${step * 2}" height="${step * 2}" patternUnits="userSpaceOnUse">
        <rect width="${step * 2}" height="${step * 2}" fill="${c0}"/>${stamps}</pattern>`);
      ground = `url(#b${uid})`;
      border = c3;
      pallu = `url(#b${uid})`;
      break;
    }
    case 'kota': {
      defs.push(`<pattern id="b${uid}" width="26" height="26" patternUnits="userSpaceOnUse">
        <rect width="26" height="26" fill="${c0}"/>
        <rect width="26" height="2.4" fill="${shade(c0, -0.14)}" opacity=".7"/>
        <rect width="2.4" height="26" fill="${shade(c0, -0.14)}" opacity=".7"/>
        <rect x="12" y="12" width="1.4" height="1.4" fill="${c2}" opacity=".8"/>
      </pattern>`);
      ground = `url(#b${uid})`;
      border = c2;
      pallu = `url(#b${uid})`;
      sheer = 0.34;
      break;
    }
    case 'maheshwari':
    case 'stripe': {
      const stripes =
        family === 'stripe'
          ? `<rect width="4" height="40" x="0" fill="${c2}" opacity=".85"/><rect width="1.5" height="40" x="9" fill="${c3}" opacity=".5"/>`
          : `<rect width="3" height="40" x="0" fill="${c2}" opacity=".7"/><rect width="3" height="40" x="20" fill="${c3}" opacity=".55"/>`;
      defs.push(`<pattern id="b${uid}" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="${c0}"/>${stripes}</pattern>`);
      ground = `url(#b${uid})`;
      border = c2;
      pallu = `url(#b${uid})`;
      break;
    }
    case 'tussar': {
      defs.push(slubTexture(`b${uid}`, c0, rng));
      ground = `url(#b${uid})`;
      border = c2;
      pallu = `url(#b${uid})`;
      break;
    }
    case 'organza':
    case 'organza-embroidered': {
      let flowers = '';
      const step = 88;
      for (let i = 0; i < 4; i++) {
        const x = (i % 2) * step + (rng() - 0.5) * 18;
        const y = Math.floor(i / 2) * step + (rng() - 0.5) * 18;
        flowers += `<g transform="translate(${r2(x)} ${r2(y)})">${motifs.flower(34, c2, c3)}</g>`;
      }
      defs.push(`<pattern id="b${uid}" width="${step * 2}" height="${step * 2}" patternUnits="userSpaceOnUse">
        <rect width="${step * 2}" height="${step * 2}" fill="${c0}"/>${flowers}</pattern>`);
      ground = `url(#b${uid})`;
      border = c2;
      pallu = scatter(`p${uid}`, c0, 'flower', 44, 62, c2, c3, 0.1);
      sheer = 0.42;
      break;
    }
    case 'sequin': {
      let sq = '';
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          sq += `<circle cx="${x * 12 + 6}" cy="${y * 12 + 6}" r="3.6" fill="${c2}" opacity="${r2(0.5 + rng() * 0.5)}"/>`;
        }
      }
      defs.push(`<pattern id="b${uid}" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="${c0}"/>${sq}</pattern>`);
      ground = `url(#b${uid})`;
      border = c2;
      pallu = `url(#b${uid})`;
      sheer = 0.2;
      break;
    }
    case 'ombre':
    case 'rtw-ombre': {
      defs.push(`<linearGradient id="b${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c0}"/><stop offset="0.55" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient>`);
      ground = `url(#b${uid})`;
      border = c3;
      pallu = `url(#b${uid})`;
      sheer = 0.3;
      break;
    }
    case 'satin': {
      defs.push(`<linearGradient id="b${uid}" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0" stop-color="${shade(c0, -0.12)}"/><stop offset="0.42" stop-color="${shade(c1, 0.16)}"/>
        <stop offset="0.6" stop-color="${c0}"/><stop offset="1" stop-color="${shade(c0, -0.14)}"/>
      </linearGradient>`);
      ground = `url(#b${uid})`;
      border = c4;
      pallu = `url(#b${uid})`;
      break;
    }
    case 'plain-border':
    case 'plain-fluid':
    case 'rtw-plain':
    case 'rtw-border':
    default: {
      ground = `url(#g${uid})`;
      border = c2;
      pallu = `url(#g${uid})`;
      break;
    }
  }

  return { defs: defs.join('\n'), ground, border, pallu, ink, sheer, palluMotif };
}

/* ------------------------------------------------------------------ *
 * Shared document wrapper.
 * ------------------------------------------------------------------ */
function svgDoc({ title, desc, body, defs = '', bg = '#F3EEE6', w = W, h = H }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<defs>${defs}</defs>
<rect width="${w}" height="${h}" fill="${bg}"/>
${body}
</svg>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Figure variation, so the range of people we show is not one body.
 * Chosen deterministically per product, then spread across the
 * catalogue by index so the grid is visibly mixed. */
const SKIN = ['#8D5A3B', '#6B4229', '#C08E63', '#A5703F', '#4E3222', '#D5A87C'];
const HAIR = ['#211A16', '#2E2218', '#171312', '#5A5350', '#8A8480', '#3A2A20'];
const BODIES = [
  { key: 'a', shoulder: 104, waist: 92, hip: 128, height: 1.0, label: 'a slim figure' },
  { key: 'b', shoulder: 118, waist: 112, hip: 150, height: 0.97, label: 'a mid-size figure' },
  { key: 'c', shoulder: 132, waist: 136, hip: 176, height: 0.95, label: 'a fuller figure' },
  { key: 'd', shoulder: 110, waist: 100, hip: 138, height: 1.05, label: 'a tall figure' },
  { key: 'e', shoulder: 124, waist: 124, hip: 162, height: 0.92, label: 'a shorter, fuller figure' }
];

/* ---------------------------- View: drape -------------------------- *
 * A stylised standing figure wearing the saree, built from the real
 * geometry of a Nivi drape: pleats gathered at the front of the waist,
 * the remaining length carried across the body from the right hip and
 * over the left shoulder, with the pallu falling down the back.
 *
 * No facial features. This is an illustration of cloth and drape, not
 * a portrait of anybody.
 * ------------------------------------------------------------------ */
export function drapeView(product, variantIndex = 0, colour = null) {
  const rng = makeRng(product.id + 'drape' + (colour || ''));
  const pat = buildPattern(product, rng, paletteFor(product, colour), colour || '');
  const pick = hashIndex(product.id) + variantIndex;
  const body = BODIES[pick % BODIES.length];
  const skin = SKIN[(pick * 3 + 1) % SKIN.length];
  const hairTone = HAIR[(pick * 2) % HAIR.length];
  const style = HAIRSTYLES[pick % HAIRSTYLES.length];

  const cx = 450;
  const headR = 46;
  const headY = 170;
  const shoulderY = 256;
  const torso = 232 * body.height;
  const blouseHem = shoulderY + torso * 0.62;
  const waistY = shoulderY + torso;
  const hemY = 1104;

  const sh = body.shoulder;
  const wa = body.waist * 0.92;
  const hp = body.hip;
  const hemHalf = Math.min(hp * 1.45, 400);

  // Pleated skirt: a fan of panels from waist to hem.
  const panels = 12;
  let pleats = '';
  for (let i = 0; i < panels; i++) {
    const t0 = i / panels;
    const t1 = (i + 1) / panels;
    const xw0 = cx - wa + t0 * wa * 2;
    const xw1 = cx - wa + t1 * wa * 2;
    const xh0 = cx - hemHalf + t0 * hemHalf * 2;
    const xh1 = cx - hemHalf + t1 * hemHalf * 2;
    const sag0 = Math.sin(t0 * Math.PI) * 18;
    const sag1 = Math.sin(t1 * Math.PI) * 18;
    pleats += '<path d="M' + r2(xw0) + ' ' + r2(waistY) + ' L' + r2(xw1) + ' ' + r2(waistY) +
      ' L' + r2(xh1) + ' ' + r2(hemY + sag1) + ' L' + r2(xh0) + ' ' + r2(hemY + sag0) + ' Z" fill="' +
      pat.ground + '" opacity="' + (i % 2 ? 0.94 : 1) + '"/>';
    if (i > 0) {
      pleats += '<path d="M' + r2(xw0) + ' ' + r2(waistY) + ' L' + r2(xh0) + ' ' + r2(hemY + sag0) +
        '" stroke="' + pat.ink + '" stroke-width="1.2" opacity=".14" fill="none"/>';
    }
  }

  const hemBorder =
    '<path d="M' + r2(cx - hemHalf) + ' ' + r2(hemY) + ' Q' + cx + ' ' + r2(hemY + 36) + ' ' + r2(cx + hemHalf) + ' ' + r2(hemY) +
    ' L' + r2(cx + hemHalf) + ' ' + r2(hemY + 34) + ' Q' + cx + ' ' + r2(hemY + 70) + ' ' + r2(cx - hemHalf) + ' ' + r2(hemY + 34) +
    ' Z" fill="' + pat.border + '"/>';

  // Pallu falling down the back, past the left shoulder.
  const pallu =
    '<path d="M' + r2(cx - sh * 0.98) + ' ' + r2(shoulderY + 4) +
    ' C' + r2(cx - sh * 1.5) + ' ' + r2(shoulderY + 260) + ' ' + r2(cx - sh * 1.66) + ' ' + r2(waistY + 330) + ' ' + r2(cx - sh * 1.42) + ' ' + r2(hemY - 96) +
    ' L' + r2(cx - sh * 0.38) + ' ' + r2(hemY - 56) +
    ' C' + r2(cx - sh * 0.52) + ' ' + r2(waistY + 220) + ' ' + r2(cx - sh * 0.48) + ' ' + r2(shoulderY + 250) + ' ' + r2(cx - sh * 0.28) + ' ' + r2(shoulderY + 84) +
    ' Z" fill="' + pat.pallu + '"/>' +
    '<path d="M' + r2(cx - sh * 1.42) + ' ' + r2(hemY - 96) + ' L' + r2(cx - sh * 0.38) + ' ' + r2(hemY - 56) +
    ' L' + r2(cx - sh * 0.4) + ' ' + r2(hemY - 12) + ' L' + r2(cx - sh * 1.44) + ' ' + r2(hemY - 52) + ' Z" fill="' + pat.border + '"/>';

  // The length carried across the front, right hip to left shoulder.
  // This is a broad swathe of cloth, not a sash: it covers most of the
  // left side of the chest and gathers at the right waist.
  const sash =
    '<path d="M' + r2(cx + wa * 1.02) + ' ' + r2(waistY - 18) +
    ' C' + r2(cx + sh * 0.5) + ' ' + r2(waistY - 96) + ' ' + r2(cx - sh * 0.36) + ' ' + r2(shoulderY + 86) + ' ' + r2(cx - sh * 1.02) + ' ' + r2(shoulderY - 10) +
    ' L' + r2(cx - sh * 0.24) + ' ' + r2(shoulderY + 30) +
    ' C' + r2(cx - sh * 0.02) + ' ' + r2(shoulderY + 150) + ' ' + r2(cx + sh * 0.46) + ' ' + r2(waistY - 40) + ' ' + r2(cx + wa * 1.0) + ' ' + r2(waistY + 52) +
    ' Z" fill="' + pat.ground + '"/>' +
    // Selvedge running along the leading edge of the drape.
    '<path d="M' + r2(cx - sh * 1.02) + ' ' + r2(shoulderY - 10) +
    ' C' + r2(cx - sh * 0.36) + ' ' + r2(shoulderY + 86) + ' ' + r2(cx + sh * 0.5) + ' ' + r2(waistY - 96) + ' ' + r2(cx + wa * 1.02) + ' ' + r2(waistY - 18) +
    '" stroke="' + pat.border + '" stroke-width="13" fill="none" stroke-linecap="round"/>';

  const hair = hairMarkup(style, cx, headY, headR, hairTone);

  // Arms taper from shoulder to wrist, with a hand at the end, so they
  // read as limbs rather than bars.
  const arm = (side) => {
    const x0 = cx + side * sh * 0.82;
    const x1 = cx + side * sh * 1.04;
    const x2 = cx + side * sh * 0.78;
    const y2 = waistY + 128;
    return (
      '<path d="M' + r2(x0) + ' ' + r2(shoulderY + 10) +
      ' C' + r2(x1) + ' ' + r2(shoulderY + 150) + ' ' + r2(x1) + ' ' + r2(waistY + 30) + ' ' + r2(x2) + ' ' + r2(y2) +
      '" stroke="' + skin + '" stroke-width="30" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + r2(x0) + ' ' + r2(shoulderY + 10) +
      ' C' + r2(x1) + ' ' + r2(shoulderY + 150) + ' ' + r2(x1) + ' ' + r2(waistY + 30) + ' ' + r2(x2) + ' ' + r2(y2) +
      '" stroke="' + shade(skin, -0.08) + '" stroke-width="30" fill="none" stroke-linecap="round" opacity=".0"/>' +
      '<ellipse cx="' + r2(x2) + '" cy="' + r2(y2 + 16) + '" rx="13" ry="18" fill="' + skin + '"/>'
    );
  };

  const markup = [
    '<ellipse cx="' + cx + '" cy="' + r2(hemY + 88) + '" rx="' + r2(hemHalf * 0.98) + '" ry="22" fill="#1C1A19" opacity=".07"/>',
    hair.behind,
    pallu,
    pleats,
    hemBorder,
    // Arms first, so the blouse covers the shoulder joint cleanly.
    arm(1),
    arm(-1),
    // Midriff, then the blouse over it.
    '<rect x="' + r2(cx - wa * 0.86) + '" y="' + r2(blouseHem - 6) + '" width="' + r2(wa * 1.72) + '" height="' + r2(waistY - blouseHem + 14) + '" fill="' + skin + '"/>',
    '<path d="M' + r2(cx - sh * 0.9) + ' ' + r2(shoulderY) + ' Q' + cx + ' ' + r2(shoulderY - 30) + ' ' + r2(cx + sh * 0.9) + ' ' + r2(shoulderY) +
      ' L' + r2(cx + wa * 0.9) + ' ' + r2(blouseHem) + ' L' + r2(cx - wa * 0.9) + ' ' + r2(blouseHem) + ' Z" fill="' + pat.border + '"/>',
    '<path d="M' + r2(cx - 32) + ' ' + r2(shoulderY - 10) + ' a32 27 0 0 0 64 0" fill="' + skin + '"/>',
    // Neck and head.
    '<rect x="' + r2(cx - 20) + '" y="' + r2(headY + headR - 14) + '" width="40" height="' + r2(shoulderY - headY - headR + 20) + '" rx="17" fill="' + skin + '"/>',
    hair.front,
    // Face drawn back over the hair disc, so the hair reads as a crown
    // and side framing rather than a mask.
    '<ellipse cx="' + cx + '" cy="' + r2(headY + 7) + '" rx="' + r2(headR * 0.83) + '" ry="' + r2(headR * 0.93) + '" fill="' + skin + '"/>',
    // Arms hanging at the sides.
    arm(1),
    arm(-1),
    sash,
    hair.plait
  ].join('\n  ');

  return svgDoc({
    title: product.name + ', illustrated drape',
    desc:
      'Vector illustration of ' + body.label + ' wearing the ' + product.name + ' in ' + colourName(product, colour) +
      '. The saree is shown draped in the common Nivi style: pleats gathered at the front of the waist, the remaining length carried across the body from the right hip and over the left shoulder, and the pallu falling down the back. Original artwork, not a photograph.',
    defs: pat.defs,
    body: markup,
    bg: '#F3EEE6'
  });
}

/* Hairstyles, so the figures are not one person repeated. Returned as
 * layers because a low bun sits behind the head and a plait in front. */
const HAIRSTYLES = ['bun', 'plait', 'short', 'grey-bun', 'plait'];

function hairMarkup(style, cx, headY, headR, tone) {
  const colour = style === 'grey-bun' ? '#9A938C' : tone;
  // The reliable flat-illustration trick: a hair disc slightly larger
  // than the head, with the face drawn back over it. The hair then
  // frames the face instead of masking it, at any size.
  const cap =
    '<circle cx="' + cx + '" cy="' + r2(headY - 5) + '" r="' + r2(headR + 6) + '" fill="' + colour + '"/>';
  const face = (skinless) => skinless;

  if (style === 'short') {
    return {
      behind: '',
      front:
        cap +
        '<path d="M' + r2(cx - headR - 6) + ' ' + r2(headY - 2) +
        ' q-4 ' + r2(headR * 0.85) + ' 10 ' + r2(headR * 1.0) + ' l14 -10 q-12 ' + r2(-headR * 0.5) + ' -6 ' + r2(-headR * 0.66) + ' Z" fill="' + colour + '"/>' +
        '<path d="M' + r2(cx + headR + 6) + ' ' + r2(headY - 2) +
        ' q4 ' + r2(headR * 0.85) + ' -10 ' + r2(headR * 1.0) + ' l-14 -10 q12 ' + r2(-headR * 0.5) + ' 6 ' + r2(-headR * 0.66) + ' Z" fill="' + colour + '"/>',
      plait: ''
    };
  }

  if (style === 'plait') {
    const px = cx + headR * 0.78;
    const py = headY + headR * 0.85;
    let knots = '';
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      knots +=
        '<ellipse cx="' + r2(px + t * 26) + '" cy="' + r2(py + 52 + t * 150) + '" rx="' + r2(16 - t * 5) +
        '" ry="' + r2(22 - t * 6) + '" fill="' + colour + '" opacity="' + (i % 2 ? 0.88 : 1) + '"/>';
    }
    return {
      behind: '',
      front: cap,
      plait: knots + '<path d="M' + r2(px + 26) + ' ' + r2(py + 208) + ' l8 26 l-18 -4 Z" fill="' + colour + '"/>'
    };
  }

  // Low bun at the nape, sitting behind the head and shoulders.
  return {
    behind:
      '<circle cx="' + r2(cx + headR * 0.92) + '" cy="' + r2(headY + headR * 1.0) + '" r="' + r2(headR * 0.46) + '" fill="' + colour + '"/>',
    front: cap,
    plait: ''
  };
}

/* ---------------------- View: flat (front / back) ------------------ */
export function flatView(product, side = 'front', colour = null) {
  const rng = makeRng(product.id + 'flat' + side + (colour || ''));
  const pat = buildPattern(product, rng, paletteFor(product, colour), side + (colour || ''));
  const m = 74;
  const x = m;
  const w = W - m * 2;
  const y = 96;
  const h = H - 192;
  const borderW = 46;
  const palluH = side === 'front' ? 300 : 236;

  const body = `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pat.ground}"/>
  ${
    pat.sheer
      ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F3EEE6" opacity="${pat.sheer}"/>`
      : ''
  }
  <!-- pallu block at one end -->
  <rect x="${x}" y="${side === 'front' ? y : y + h - palluH}" width="${w}" height="${palluH}" fill="${pat.pallu}"/>
  <!-- selvedge borders down both long edges -->
  <rect x="${x}" y="${y}" width="${borderW}" height="${h}" fill="${pat.border}"/>
  <rect x="${r2(x + w - borderW)}" y="${y}" width="${borderW}" height="${h}" fill="${pat.border}"/>
  <rect x="${r2(x + borderW)}" y="${y}" width="6" height="${h}" fill="${shade(pat.border, -0.18)}" opacity=".6"/>
  <rect x="${r2(x + w - borderW - 6)}" y="${y}" width="6" height="${h}" fill="${shade(pat.border, -0.18)}" opacity=".6"/>
  <!-- soft fold shadows so it reads as cloth, not a swatch -->
  <g opacity=".1">
    <rect x="${r2(x + w * 0.3)}" y="${y}" width="34" height="${h}" fill="#1C1A19"/>
    <rect x="${r2(x + w * 0.66)}" y="${y}" width="22" height="${h}" fill="#1C1A19"/>
  </g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#1C1A19" stroke-opacity=".1"/>`;

  return svgDoc({
    title: `${product.name}, ${side === 'front' ? 'laid flat' : 'reverse face'}`,
    desc:
      side === 'front'
        ? `The ${product.name} laid flat, showing the full width of the cloth: the woven border down both long edges, the patterned body, and the pallu block at one end. Original vector artwork, not a photograph.`
        : `The reverse face of the ${product.name}, showing how the pattern reads from the back. Original vector artwork, not a photograph.`,
    defs: pat.defs,
    body
  });
}

/* --------------------- View: border / pallu detail ----------------- */
export function detailView(product, kind = 'border', colour = null) {
  const rng = makeRng(product.id + kind + (colour || ''));
  const pat = buildPattern(product, rng, paletteFor(product, colour), kind + (colour || ''));
  const isBorder = kind === 'border';

  const body = isBorder
    ? `<rect width="${W}" height="${H}" fill="${pat.ground}"/>
       ${pat.sheer ? `<rect width="${W}" height="${H}" fill="#F3EEE6" opacity="${pat.sheer}"/>` : ''}
       <rect y="${H * 0.42}" width="${W}" height="${H * 0.3}" fill="${pat.border}"/>
       <rect y="${H * 0.42}" width="${W}" height="10" fill="${shade(pat.border, -0.22)}" opacity=".7"/>
       <rect y="${r2(H * 0.72 - 10)}" width="${W}" height="10" fill="${shade(pat.border, -0.22)}" opacity=".7"/>
       ${Array.from({ length: 10 }, (_, i) => {
         const s = 78;
         return `<g transform="translate(${r2(i * (W / 10) + 8)} ${r2(H * 0.72 + 6)})">${motifs.temple(s, pat.border)}</g>`;
       }).join('')}
       <g opacity=".14"><rect x="${W * 0.22}" width="40" height="${H}" fill="#1C1A19"/></g>`
    : `<rect width="${W}" height="${H}" fill="${pat.pallu}"/>
       ${pat.sheer ? `<rect width="${W}" height="${H}" fill="#F3EEE6" opacity="${r2(pat.sheer * 0.6)}"/>` : ''}
       <rect y="${H - 150}" width="${W}" height="150" fill="${pat.border}"/>
       ${Array.from({ length: 12 }, (_, i) =>
         `<circle cx="${r2(i * (W / 12) + W / 24)}" cy="${H - 34}" r="11" fill="${pat.ground}" opacity=".7"/>`
       ).join('')}
       <g opacity=".12"><rect x="${W * 0.58}" width="52" height="${H}" fill="#1C1A19"/></g>`;

  return svgDoc({
    title: `${product.name}, ${isBorder ? 'border detail' : 'pallu detail'}`,
    desc: isBorder
      ? `Close view of the woven border on the ${product.name}, showing the ${product.colour.name} border against the body of the saree and the temple-point edge. Original vector artwork, not a photograph.`
      : `Close view of the pallu on the ${product.name} — the decorated end of the saree that falls over the shoulder. Original vector artwork, not a photograph.`,
    defs: pat.defs,
    body
  });
}

/* ------------------------- View: fabric macro ---------------------- *
 * Threads are drawn as one small tiled <pattern> rather than thousands
 * of individual rects: visually identical, about fifty times smaller.
 * ------------------------------------------------------------------ */
export function macroView(product, colour = null) {
  const rng = makeRng(product.id + 'macro' + (colour || ''));
  const palette = paletteFor(product, colour);
  const pat = buildPattern(product, rng, palette, 'macro' + (colour || ''));
  const [c0] = palette;
  const pitch = 22;
  const half = r2(pitch * 0.52);

  const defs =
    pat.defs +
    `<pattern id="thread" width="${pitch * 2}" height="${pitch * 2}" patternUnits="userSpaceOnUse">
      <rect width="${pitch * 2}" height="${pitch * 2}" fill="${c0}"/>
      <rect y="0" width="${pitch * 2}" height="${half}" fill="${shade(c0, -0.09)}" opacity=".55"/>
      <rect y="${pitch}" width="${pitch * 2}" height="${half}" fill="${shade(c0, -0.09)}" opacity=".55"/>
      <rect x="0" y="0" width="${half}" height="${half}" rx="2" fill="${shade(c0, 0.09)}" opacity=".6"/>
      <rect x="${pitch}" y="${pitch}" width="${half}" height="${half}" rx="2" fill="${shade(c0, 0.09)}" opacity=".6"/>
    </pattern>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.5" stop-color="#1C1A19" stop-opacity="0"/><stop offset="1" stop-color="#1C1A19" stop-opacity=".3"/>
    </radialGradient>`;

  const body = `<rect width="${W}" height="${H}" fill="${pat.ground}"/>
    <rect width="${W}" height="${H}" fill="url(#thread)" opacity=".92"/>
    <rect width="${W}" height="${H}" fill="url(#vig)" opacity=".5"/>`;

  return svgDoc({
    title: `${product.name}, fabric at magnification`,
    desc: `Magnified view of the weave structure of ${product.fabricLabel}: ${product.attributes.texture || 'the surface texture of the cloth'}. Original vector artwork, not a photograph.`,
    defs,
    body
  });
}

/* ------------------------ View: blouse piece ----------------------- */
export function blouseView(product, colour = null) {
  const rng = makeRng(product.id + 'blouse' + (colour || ''));
  const pat = buildPattern(product, rng, paletteFor(product, colour), 'blouse' + (colour || ''));
  const stitched = product.type === 'blouse' || product.blousePiece.stitched;

  const body = stitched
    ? `<path d="M300 250 Q450 210 600 250 L648 420 L618 440 L612 830 L288 830 L282 440 L252 420 Z" fill="${pat.ground}"/>
       <path d="M300 250 Q450 210 600 250 L590 262 Q450 228 310 262 Z" fill="${shade(pat.border, -0.1)}"/>
       <path d="M402 246 a48 42 0 0 0 96 0" fill="#F3EEE6"/>
       <path d="M288 830 L612 830 L612 848 L288 848 Z" fill="${pat.border}" opacity=".9"/>
       <path d="M366 268 L358 830 M534 268 L542 830" stroke="${pat.ink}" stroke-width="1.4" opacity=".2" fill="none"/>`
    : `<rect x="180" y="330" width="540" height="540" fill="${pat.ground}"/>
       <rect x="180" y="330" width="540" height="62" fill="${pat.border}"/>
       <rect x="180" y="808" width="540" height="62" fill="${pat.border}"/>
       <g opacity=".12"><rect x="392" y="330" width="30" height="540" fill="#1C1A19"/></g>
       <rect x="180" y="330" width="540" height="540" fill="none" stroke="#1C1A19" stroke-opacity=".12"/>
       <g font-family="system-ui, sans-serif" font-size="26" fill="#6B655E" text-anchor="middle">
         <text x="450" y="920">Unstitched blouse piece</text>
         <text x="450" y="956">${product.blousePiece.lengthCm ? product.blousePiece.lengthCm + 'cm of flat fabric' : 'flat fabric'}</text>
       </g>`;

  return svgDoc({
    title: stitched ? `${product.name}, stitched blouse` : `${product.name}, the included blouse piece`,
    desc: stitched
      ? `The stitched blouse, shown flat: ${product.name}. Original vector artwork, not a photograph.`
      : `The unstitched blouse piece included with the ${product.name}, shown as the flat panel of fabric it arrives as — not made up into a blouse. Original vector artwork, not a photograph.`,
    defs: pat.defs,
    body
  });
}

/* ------------------------- Editorial artwork ----------------------- *
 * Wide-format pieces for the homepage and guide pages. Same visual
 * language, different crop.
 * ------------------------------------------------------------------ */
export function editorialView(seed, palette, opts = {}) {
  const rng = makeRng(seed);
  const w = opts.w || 1600;
  const h = opts.h || 1000;
  const [c0, c1, c2, c3, c4] = palette;
  const bands = [];
  // Overlapping soft bands of cloth, as though several sarees are
  // folded across each other.
  for (let i = 0; i < 6; i++) {
    const yy = (i / 6) * h * 1.1 - h * 0.05;
    const hh = h * (0.14 + rng() * 0.12);
    const col = [c0, c1, c2, c3, c4][i % 5];
    const skew = (rng() - 0.5) * h * 0.14;
    bands.push(
      `<path d="M0 ${r2(yy)} L${w} ${r2(yy + skew)} L${w} ${r2(yy + skew + hh)} L0 ${r2(yy + hh)} Z" fill="${col}" opacity="${r2(0.82 + rng() * 0.18)}"/>`
    );
  }
  let threads = '';
  for (let i = 0; i < 90; i++) {
    const yy = rng() * h;
    threads += `<rect y="${r2(yy)}" width="${w}" height="1.6" fill="#FAF7F2" opacity="${r2(0.05 + rng() * 0.12)}"/>`;
  }
  const body = `<g>${bands.join('')}</g><g>${threads}</g>
    <rect width="${w}" height="${h}" fill="url(#eg)" opacity=".55"/>`;
  const defs = `<linearGradient id="eg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#1C1A19" stop-opacity=".28"/><stop offset="0.6" stop-color="#1C1A19" stop-opacity="0"/>
  </linearGradient>`;

  return svgDoc({
    title: opts.title || 'Folded textiles',
    desc: opts.desc || 'Abstract vector artwork of folded lengths of saree fabric layered across each other. Original artwork, not a photograph.',
    defs,
    body,
    bg: c0,
    w,
    h
  });
}

/* Occasion tiles: a square crop with a single dominant textile. */
export function occasionTile(occasionId, palette, label) {
  const rng = makeRng('occ' + occasionId);
  const [c0, c1, c2, c3] = palette;
  const s = 800;
  let pleats = '';
  for (let i = 0; i < 9; i++) {
    const x = (i / 9) * s;
    pleats += `<path d="M${r2(x)} 0 L${r2(x + s / 9)} 0 L${r2(x + s / 9 + 26)} ${s} L${r2(x + 26)} ${s} Z"
      fill="${i % 2 ? c1 : c0}" opacity="${r2(0.9 + rng() * 0.1)}"/>`;
  }
  const body = `<g>${pleats}</g>
    <rect y="${s * 0.74}" width="${s}" height="${s * 0.1}" fill="${c2}" opacity=".95"/>
    <rect width="${s}" height="${s}" fill="url(#og)" opacity=".6"/>`;
  const defs = `<linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.35" stop-color="#1C1A19" stop-opacity="0"/><stop offset="1" stop-color="#1C1A19" stop-opacity=".55"/>
  </linearGradient>`;
  return svgDoc({
    title: `${label} sarees`,
    desc: `Abstract vector artwork of pleated saree fabric in the palette we associate with ${label.toLowerCase()} sarees. Original artwork, not a photograph.`,
    defs,
    body,
    bg: c0,
    w: s,
    h: s
  });
}

/* Draping step diagrams for the guide — line art, not textile. */
export function drapeStep(step, total, title, desc) {
  const w = 640;
  const h = 800;
  const cx = w / 2;
  const ink = '#1C1A19';
  const accent = '#6E1B2B';
  const ghost = '#CFC6B8';

  const figure = `
    <circle cx="${cx}" cy="120" r="44" fill="none" stroke="${ghost}" stroke-width="3"/>
    <path d="M${cx - 86} 200 Q${cx} 178 ${cx + 86} 200 L${cx + 70} 400 L${cx - 70} 400 Z" fill="none" stroke="${ghost}" stroke-width="3"/>
    <path d="M${cx - 96} 400 L${cx + 96} 400 L${cx + 150} 730 L${cx - 150} 730 Z" fill="none" stroke="${ghost}" stroke-width="3"/>`;

  const steps = {
    1: `<path d="M${cx - 96} 400 L${cx + 96} 400" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>
        <path d="M${cx + 96} 400 C${cx + 200} 430 ${cx + 210} 560 ${cx + 150} 700" stroke="${accent}" stroke-width="7" fill="none"/>`,
    2: `<g stroke="${accent}" stroke-width="6" fill="none">
        ${Array.from({ length: 6 }, (_, i) => `<path d="M${cx - 60 + i * 24} 400 L${cx - 90 + i * 30} 730"/>`).join('')}
        </g><path d="M${cx - 96} 400 L${cx + 60} 400" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`,
    3: `<path d="M${cx + 90} 396 C${cx + 40} 330 ${cx - 40} 300 ${cx - 86} 208" stroke="${accent}" stroke-width="10" fill="none" stroke-linecap="round"/>
        <circle cx="${cx - 84}" cy="205" r="9" fill="${accent}"/>`,
    4: `<path d="M${cx - 86} 208 C${cx - 150} 320 ${cx - 160} 520 ${cx - 140} 700" stroke="${accent}" stroke-width="9" fill="none"/>
        <path d="M${cx - 140} 700 L${cx - 60} 690" stroke="${accent}" stroke-width="9"/>`,
    5: `<g fill="${accent}"><circle cx="${cx - 84}" cy="205" r="9"/><circle cx="${cx - 40}" cy="400" r="9"/><circle cx="${cx + 60}" cy="400" r="9"/></g>
        <path d="M${cx - 86} 208 C${cx - 150} 320 ${cx - 160} 520 ${cx - 140} 700" stroke="${accent}" stroke-width="9" fill="none"/>
        <g stroke="${accent}" stroke-width="6" fill="none">
        ${Array.from({ length: 6 }, (_, i) => `<path d="M${cx - 60 + i * 24} 400 L${cx - 90 + i * 30} 730"/>`).join('')}</g>`
  };

  const body = `${figure}${steps[step] || ''}
    <g font-family="system-ui, sans-serif" fill="${ink}">
      <text x="32" y="60" font-size="22" fill="#6B655E">Step ${step} of ${total}</text>
    </g>`;

  return svgDoc({ title, desc, body, bg: '#FAF7F2', w, h });
}

/* Anatomy diagram: names the parts of a saree. */
export function anatomyDiagram() {
  const w = 1200;
  const h = 640;
  const ink = '#1C1A19';
  const accent = '#6E1B2B';
  const body = `
  <rect x="60" y="120" width="1080" height="400" fill="#E3D9C6"/>
  <rect x="60" y="120" width="1080" height="34" fill="#6E1B2B"/>
  <rect x="60" y="486" width="1080" height="34" fill="#6E1B2B"/>
  <rect x="60" y="120" width="300" height="400" fill="#C89A3C" opacity=".55"/>
  <rect x="960" y="120" width="180" height="400" fill="#D8CDB6"/>
  <g stroke="${accent}" stroke-width="2" fill="none" stroke-dasharray="6 5">
    <path d="M210 120 L210 74"/><path d="M660 154 L660 74"/><path d="M660 486 L660 566"/><path d="M1050 120 L1050 74"/><path d="M40 320 L18 320"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="21" fill="${ink}">
    <text x="210" y="60" text-anchor="middle" font-weight="600">Pallu</text>
    <text x="210" y="88" text-anchor="middle" font-size="17" fill="#6B655E">the decorated end</text>
    <text x="660" y="60" text-anchor="middle" font-weight="600">Border</text>
    <text x="660" y="88" text-anchor="middle" font-size="17" fill="#6B655E">runs the full length</text>
    <text x="660" y="600" text-anchor="middle" font-weight="600">Lower border and fall</text>
    <text x="1050" y="60" text-anchor="middle" font-weight="600">Blouse piece</text>
    <text x="1050" y="88" text-anchor="middle" font-size="17" fill="#6B655E">attached, unstitched</text>
    <text x="600" y="330" text-anchor="middle" font-size="19" fill="#4A443E">Body — the plain or patterned field you pleat</text>
  </g>
  <g font-family="system-ui, sans-serif" font-size="17" fill="#6B655E">
    <text x="600" y="612" text-anchor="middle">Total length 5.5 to 6.3 metres, width 105 to 120 centimetres</text>
  </g>`;
  return svgDoc({
    title: 'The parts of a saree',
    desc:
      'Labelled diagram of an unstitched saree laid flat. From left to right: the pallu, the decorated end that falls over the shoulder; the body, the plain or patterned field that is pleated at the waist; the border running the full length of both long edges; the lower border where the fall is stitched; and the blouse piece attached at the far end, which arrives as flat unstitched fabric.',
    body,
    bg: '#FAF7F2',
    w,
    h
  });
}

export { makeRng, shade, buildPattern };

/* Stable index from a product id, so a product always draws the same
 * figure between builds. */
function hashIndex(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973;
  return n;
}

function colourName(product, slug) {
  const c = product.colours.find((x) => x.slug === slug);
  return c ? c.name : product.colour.name;
}
