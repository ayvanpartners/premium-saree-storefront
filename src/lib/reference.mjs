/* ------------------------------------------------------------------ *
 * Photographic reference library.
 *
 * `src/assets/img/reference/` holds openly licensed photographs from
 * Wikimedia Commons, one per catalogue record plus the occasion tiles
 * and editorial slots, described by `sources.json`. They show a
 * comparable weave, garment or styling direction — they are NOT
 * photographs of the catalogue stock, and every place that renders
 * one says so and credits the photographer.
 *
 * If the folder or manifest is absent, every lookup returns null and
 * the site falls back to its generated illustrations, so a build never
 * breaks on a missing photo.
 * ------------------------------------------------------------------ */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { url, esc } from './html.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'img', 'reference');
const MANIFEST = join(ROOT, 'sources.json');

/** WebP dimensions from the container header, without a decoder.
 * Handles the three container layouts (VP8, VP8L, VP8X). */
function webpSize(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (chunk === 'VP8L') {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    return { w: 1 + (((b1 & 0x3f) << 8) | b0), h: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
  }
  if (chunk === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  return null;
}

/* ------------------------------------------------------------------ *
 * Editorial review of the library.
 *
 * An open licence makes an image legal to use. It does not make it the
 * right image. Each file below was looked at; anything listed in
 * REJECTED is withheld and its slot falls back to the generated
 * illustration. Reasons are kept in the code because they are the
 * argument for the decision, and because re-sourcing a better photo
 * should start from knowing what was wrong with this one.
 *
 * To reinstate an image, delete its line. To reject one, add it.
 * ------------------------------------------------------------------ */
const REJECTED = {
  // Another retailer's branding or price burned into the pixels.
  'products/anaya-banarasi-brocade': 'Seller\'s price "Rs.4000" overlaid on the image.',
  'products/bela-bandhani': 'Seller watermark in the lower-left corner.',
  'editorial/home-hero': "Carries Pachaiyappa's Silks logo watermark.",

  // Not a photograph of the kind of thing the record describes.
  'products/veda-rtw-silk-blend': 'A conference panel photograph, not a saree product shot.',
  'products/blouse-raw-silk-sleeveless': 'Sepia studio portrait from the colonial era, not a blouse for sale.',
  'products/petticoat-cotton': 'A Victorian European underskirt from a museum, not a saree petticoat.',
  'products/petticoat-satin': 'An 18th-century French court dress, nothing to do with a saree petticoat.',
  'products/saree-shapewear': 'A Victorian European underskirt, not stretch shapewear.',
  'products/saree-pins-set': 'A single decorative treble-clef brooch, not a set of saree pins.',
  'products/muslin-storage-bags': 'An antique embroidered drawstring bag, not plain muslin storage.',
  'products/delicate-fabric-wash': 'A branded supermarket detergent bottle — wrong product and another brand on our page.',
  'products/uma-handloom-cotton': 'A loom in use, not the cotton saree. Reads as craft, not product.',
  'products/aruna-kota-doria': 'Out-of-focus shop interior with bystanders; the Kota weave is not legible.',
  'products/sitara-sequin-net': 'A plain red saree on a hanger; no sequins and no net visible.',
  'products/shalini-sambalpuri': 'Trade-stand mannequin with event signage across the frame.',

  // The garment is wrong enough to mislead about what is being sold.
  'products/padma-tussar': 'A red saree held up in a shop; the record is natural wheat tussar.',
  'products/mira-rtw-georgette': 'A couple posing; the saree is draped conventionally, not ready to wear.',
  'products/anjali-rtw-chiffon': 'Not a ready-to-wear saree, and the same photo is already the festive tile.',
  'products/charu-block-print-linen': 'A yellow silk-look saree; the record is terracotta block-printed linen.',
  'occasions/party': 'A TEDx panel photograph — reads as a conference, not an evening occasion.',
  'editorial/ready-to-wear': 'A conventionally draped cotton saree; the section is specifically about pre-pleated sarees.'
};

let entries = null;

function load() {
  if (entries) return entries;
  entries = [];
  if (!existsSync(MANIFEST)) return entries;

  const list = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  for (const e of list) {
    const file = join(ROOT, e.file);
    if (!existsSync(file)) throw new Error(`Reference manifest lists ${e.file} but the file is missing`);
    const size = webpSize(readFileSync(file));
    if (!size) throw new Error(`Could not read WebP dimensions for ${e.file}`);

    // products/<id>/<id>--reference-01.webp
    // occasions/<id>--reference-01.webp, editorial/<slot>--reference-01.webp
    const [kind, ...rest] = e.file.split('/');
    const key = kind === 'products' ? rest[0] : rest[0].replace(/--reference-\d+\.webp$/, '');

    entries.push({
      kind,
      key,
      rejected: REJECTED[`${kind}/${key}`] || null,
      file: e.file,
      src: url(`/assets/img/reference/${e.file}`),
      width: size.w,
      height: size.h,
      bytes: readFileSync(file).length,
      creator: String(e.creator || 'Unknown').trim(),
      licence: e.licence,
      licenceUrl: e.licenceUrl,
      sourcePage: e.sourcePage,
      title: String(e.title || '').replace(/^File:/, ''),
      intendedUse: e.intendedUse,
      description: e.sourceDescription || ''
    });
  }
  return entries;
}

/** Only images that passed review are offered to the page. */
export function referenceFor(kind, key) {
  const e = load().find((x) => x.kind === kind && x.key === key);
  return e && !e.rejected ? e : null;
}
export const productReference = (id) => referenceFor('products', id);
export const occasionReference = (id) => referenceFor('occasions', id);
export const editorialReference = (slot) => referenceFor('editorial', slot);

/** Everything actually used on the site — what /image-credits/ lists. */
export const allReferences = () => load().filter((e) => !e.rejected);
/** Everything withheld, with the reason. Shown on /image-credits/ so
 * the gap is visible rather than silent. */
export const rejectedReferences = () => load().filter((e) => e.rejected);
export const referenceAvailable = () => allReferences().length > 0;

/** Attribution wording that satisfies CC BY / BY-SA: creator, licence
 * with a link, and a link back to the source. Public-domain and CC0
 * images get the same treatment because it costs nothing. */
function shortCreator(name) {
  return name.length > 48 ? `${name.slice(0, 46).trim()}…` : name;
}

export function creditHtml(ref, { full = false } = {}) {
  const who = full ? ref.creator : shortCreator(ref.creator);
  return `Photo: ${esc(who)} · <a href="${esc(ref.licenceUrl)}" rel="license noopener">${esc(
    ref.licence
  )}</a> · <a href="${esc(ref.sourcePage)}" rel="noopener">Source</a>`;
}

export function creditText(ref) {
  return `Photo: ${shortCreator(ref.creator)}, ${ref.licence}.`;
}
