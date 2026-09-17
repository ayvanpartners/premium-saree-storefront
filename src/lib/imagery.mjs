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

function buildPattern(product, rng) {
  const pal = product.palette;
  const [c0, c1, c2, c3, c4] = pal;
  const family = product.patternFamily;
  const uid = product.id.replace(/[^a-z0-9]/gi, '');
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
 * A stylised standing figure wearing the saree. No facial features:
 * this is an illustration of drape and cloth, not a portrait.
 * ------------------------------------------------------------------ */
export function drapeView(product, variantIndex = 0) {
  const rng = makeRng(product.id + 'drape');
  const pat = buildPattern(product, rng);
  const body = BODIES[(hashIndex(product.id) + variantIndex) % BODIES.length];
  const skin = SKIN[(hashIndex(product.id) + variantIndex * 2) % SKIN.length];
  const hair = HAIR[(hashIndex(product.id) + variantIndex) % HAIR.length];
  const grey = hair === '#8A8480' || hair === '#5A5350';

  const cx = 450;
  const headR = 52;
  const topY = 150;
  const shoulderY = topY + headR * 2 + 36;
  const waistY = shoulderY + 210 * body.height;
  const hemY = 1104;
  const sh = body.shoulder;
  const wa = body.waist;
  const hp = body.hip;

  // Pleated skirt: a fan of panels from waist to hem.
  const pleats = [];
  const panels = 11;
  const hemHalf = hp * 1.34;
  for (let i = 0; i < panels; i++) {
    const t0 = i / panels;
    const t1 = (i + 1) / panels;
    const xw0 = cx - wa + t0 * wa * 2;
    const xw1 = cx - wa + t1 * wa * 2;
    const xh0 = cx - hemHalf + t0 * hemHalf * 2;
    const xh1 = cx - hemHalf + t1 * hemHalf * 2;
    const sag = Math.sin(t0 * Math.PI) * 16;
    pleats.push(
      `<path d="M${r2(xw0)} ${r2(waistY)} L${r2(xw1)} ${r2(waistY)} L${r2(xh1)} ${r2(hemY + sag)} L${r2(xh0)} ${r2(hemY + sag)} Z"
        fill="${pat.ground}" ${i % 2 ? `opacity=".93"` : ''}/>
       <path d="M${r2(xw0)} ${r2(waistY)} L${r2(xh0)} ${r2(hemY + sag)}" stroke="${pat.ink}" stroke-width="1.1" opacity=".16"/>`
    );
  }

  // Pallu: over the left shoulder, falling behind the arm.
  const pallu = `
    <path d="M${r2(cx - sh * 0.86)} ${r2(shoulderY + 6)}
      C${r2(cx - sh * 1.18)} ${r2(shoulderY + 250)} ${r2(cx - sh * 1.3)} ${r2(waistY + 300)} ${r2(cx - sh * 1.04)} ${r2(hemY - 40)}
      L${r2(cx - sh * 0.42)} ${r2(hemY - 66)}
      C${r2(cx - sh * 0.6)} ${r2(waistY + 190)} ${r2(cx - sh * 0.52)} ${r2(shoulderY + 210)} ${r2(cx - sh * 0.2)} ${r2(shoulderY + 30)} Z"
      fill="${pat.pallu}"/>
    <path d="M${r2(cx - sh * 1.04)} ${r2(hemY - 40)} L${r2(cx - sh * 0.42)} ${r2(hemY - 66)}"
      stroke="${pat.border}" stroke-width="26" opacity=".95" stroke-linecap="square"/>`;

  // Upper drape crossing the torso from right hip to left shoulder.
  const upper = `
    <path d="M${r2(cx + wa * 0.9)} ${r2(waistY - 8)}
      C${r2(cx + sh * 0.5)} ${r2(waistY - 90)} ${r2(cx - sh * 0.1)} ${r2(shoulderY + 70)} ${r2(cx - sh * 0.78)} ${r2(shoulderY + 4)}
      L${r2(cx - sh * 0.62)} ${r2(shoulderY + 62)}
      C${r2(cx - sh * 0.1)} ${r2(shoulderY + 132)} ${r2(cx + sh * 0.36)} ${r2(waistY - 22)} ${r2(cx + wa * 0.86)} ${r2(waistY + 34)} Z"
      fill="${pat.ground}" opacity=".97"/>`;

  const hairShape = grey
    ? `<path d="M${cx - headR - 6} ${topY + headR * 0.7} a${headR + 6} ${headR + 6} 0 0 1 ${(headR + 6) * 2} 0 v-6 a${headR + 6} ${headR + 10} 0 0 0 -${(headR + 6) * 2} 0 Z" fill="${hair}"/>
       <ellipse cx="${cx}" cy="${topY + headR * 0.34}" rx="${headR + 4}" ry="${headR * 0.66}" fill="${hair}"/>`
    : `<ellipse cx="${cx}" cy="${topY + headR * 0.3}" rx="${headR + 5}" ry="${headR * 0.74}" fill="${hair}"/>
       <circle cx="${cx + headR * 0.94}" cy="${topY + headR * 1.24}" r="${r2(headR * 0.42)}" fill="${hair}"/>`;

  const bodyMarkup = `
  <ellipse cx="${cx}" cy="${hemY + 44}" rx="${r2(hemHalf * 1.02)}" ry="26" fill="#1C1A19" opacity=".07"/>
  <!-- neck, head -->
  <rect x="${r2(cx - 19)}" y="${r2(topY + headR * 1.5)}" width="38" height="58" rx="16" fill="${skin}"/>
  <circle cx="${cx}" cy="${topY + headR}" r="${headR}" fill="${skin}"/>
  ${hairShape}
  <!-- arms -->
  <path d="M${r2(cx + sh * 0.82)} ${r2(shoulderY + 18)} C${r2(cx + sh * 1.05)} ${r2(shoulderY + 150)} ${r2(cx + sh * 0.96)} ${r2(waistY + 60)} ${r2(cx + sh * 0.72)} ${r2(waistY + 118)}"
    stroke="${skin}" stroke-width="34" fill="none" stroke-linecap="round"/>
  <path d="M${r2(cx - sh * 0.82)} ${r2(shoulderY + 18)} C${r2(cx - sh * 1.0)} ${r2(shoulderY + 150)} ${r2(cx - sh * 0.9)} ${r2(waistY + 60)} ${r2(cx - sh * 0.66)} ${r2(waistY + 110)}"
    stroke="${skin}" stroke-width="34" fill="none" stroke-linecap="round"/>
  <!-- blouse -->
  <path d="M${r2(cx - sh * 0.84)} ${r2(shoulderY)} Q${cx} ${r2(shoulderY - 26)} ${r2(cx + sh * 0.84)} ${r2(shoulderY)}
    L${r2(cx + wa * 0.94)} ${r2(waistY - 46)} L${r2(cx - wa * 0.94)} ${r2(waistY - 46)} Z" fill="${pat.border}"/>
  <path d="M${r2(cx - 30)} ${r2(shoulderY - 6)} a30 26 0 0 0 60 0" fill="${skin}" opacity=".95"/>
  <!-- midriff -->
  <rect x="${r2(cx - wa * 0.9)}" y="${r2(waistY - 48)}" width="${r2(wa * 1.8)}" height="52" fill="${skin}"/>
  ${pleats.join('')}
  ${upper}
  ${pallu}
  <!-- hem border -->
  <path d="M${r2(cx - hemHalf)} ${r2(hemY + 8)} Q${cx} ${r2(hemY + 30)} ${r2(cx + hemHalf)} ${r2(hemY + 8)}"
    stroke="${pat.border}" stroke-width="30" fill="none" opacity=".95"/>`;

  return svgDoc({
    title: `${product.name}, illustrated drape`,
    desc: `Vector illustration of ${body.label} wearing the ${product.name}. The saree is shown in ${product.colour.name}, draped with pleats at the front and the pallu over the left shoulder. This is original artwork, not a photograph.`,
    defs: pat.defs,
    body: bodyMarkup,
    bg: '#F3EEE6'
  });
}

function hashIndex(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973;
  return n;
}

/* ---------------------- View: flat (front / back) ------------------ */
export function flatView(product, side = 'front') {
  const rng = makeRng(product.id + 'flat' + side);
  const pat = buildPattern(product, rng);
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
export function detailView(product, kind = 'border') {
  const rng = makeRng(product.id + kind);
  const pat = buildPattern(product, rng);
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

/* ------------------------- View: fabric macro ---------------------- */
export function macroView(product) {
  const rng = makeRng(product.id + 'macro');
  const pat = buildPattern(product, rng);
  const [c0] = product.palette;
  // Individual threads at high magnification.
  let threads = '';
  const pitch = 22;
  for (let y = 0; y < H / pitch + 1; y++) {
    threads += `<rect y="${r2(y * pitch)}" width="${W}" height="${r2(pitch * 0.52)}" fill="${shade(c0, -0.09)}" opacity=".55"/>`;
  }
  for (let x = 0; x < W / pitch + 1; x++) {
    for (let y = 0; y < H / pitch + 1; y++) {
      if ((x + y) % 2 === 0) {
        threads += `<rect x="${r2(x * pitch)}" y="${r2(y * pitch)}" width="${r2(pitch * 0.52)}" height="${r2(pitch * 0.52)}" fill="${shade(c0, 0.09)}" opacity=".6" rx="2"/>`;
      }
    }
  }
  const body = `<rect width="${W}" height="${H}" fill="${pat.ground}"/>
    <g>${threads}</g>
    <rect width="${W}" height="${H}" fill="url(#vig)" opacity=".5"/>`;
  const defs =
    pat.defs +
    `<radialGradient id="vig" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.5" stop-color="#1C1A19" stop-opacity="0"/><stop offset="1" stop-color="#1C1A19" stop-opacity=".3"/>
    </radialGradient>`;

  return svgDoc({
    title: `${product.name}, fabric at magnification`,
    desc: `Magnified view of the weave structure of ${product.fabricLabel}: ${product.attributes.texture || 'the surface texture of the cloth'}. Original vector artwork, not a photograph.`,
    defs,
    body
  });
}

/* ------------------------ View: blouse piece ----------------------- */
export function blouseView(product) {
  const rng = makeRng(product.id + 'blouse');
  const pat = buildPattern(product, rng);
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
