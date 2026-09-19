/* ------------------------------------------------------------------ *
 * Static build.
 *
 *   node build.mjs                 -> dist/, served from /
 *   BASE_PATH=/repo node build.mjs -> dist/, served from /repo/
 *
 * No dependencies, no bundler, no cache. The whole site is small
 * enough that a clean build takes a couple of seconds, and having one
 * obvious code path is worth more than incremental cleverness.
 * ------------------------------------------------------------------ */

import { mkdir, rm, writeFile, readFile, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, 'src');
const DIST = join(__dirname, 'dist');
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');

/* The base path has to be set before any page module is imported,
 * because url() is resolved at render time from module state. */
const { setBase, url } = await import('./src/lib/html.mjs');
setBase(BASE);

const { products, productById, collections } = await import('./src/data/products.mjs');
const { fabrics, weaves, occasions, colourFamilies } = await import('./src/data/taxonomy.mjs');
const { fulfilment, services, returnsPolicy, site, BRAND } = await import('./src/data/site.mjs');
const imagery = await import('./src/lib/imagery.mjs');
const { galleryViews, defaultColour, imgPath } = await import('./src/lib/components.mjs');

const { homePage } = await import('./src/pages/home.mjs');
const { collectionPage, occasionLandingPage } = await import('./src/pages/collection.mjs');
const { productPage } = await import('./src/pages/product.mjs');
const shop = await import('./src/pages/shop-pages.mjs');
const checkout = await import('./src/pages/checkout-pages.mjs');
const guide = await import('./src/pages/guide-pages.mjs');
const info = await import('./src/pages/info-pages.mjs');

const started = performance.now();
const stats = { pages: 0, images: 0, bytes: 0 };

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

/* ----------------------------- Helpers ---------------------------- */
async function write(routePath, contents) {
  const file =
    routePath.endsWith('.html') || routePath.endsWith('.json') || routePath.endsWith('.xml') || routePath.endsWith('.txt')
      ? join(DIST, routePath)
      : join(DIST, routePath, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents, 'utf8');
  stats.bytes += Buffer.byteLength(contents);
  if (file.endsWith('.html')) stats.pages += 1;
  return file;
}

async function writeImage(relPath, svg) {
  const file = join(DIST, 'assets', 'img', relPath);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, svg, 'utf8');
  stats.images += 1;
  stats.bytes += Buffer.byteLength(svg);
}

/* --------------------------- 1. Static assets --------------------- */
await cp(join(SRC, 'assets', 'css'), join(DIST, 'assets', 'css'), { recursive: true });
await cp(join(SRC, 'assets', 'fonts'), join(DIST, 'assets', 'fonts'), { recursive: true });
await cp(join(SRC, 'assets', 'js'), join(DIST, 'assets', 'js'), { recursive: true });

/* commerce.mjs is the one module shared between the build and the
 * browser. Copying it rather than duplicating it is the whole point:
 * delivery dates and totals are computed by identical code. */
await cp(join(SRC, 'lib', 'commerce.mjs'), join(DIST, 'assets', 'js', 'commerce.mjs'));

/* Photographic reference library, when present: the WebP files plus
 * the attribution and manifest files, which must travel with them. */
const REFERENCE = join(SRC, 'assets', 'img', 'reference');
if (existsSync(REFERENCE)) {
  await cp(REFERENCE, join(DIST, 'assets', 'img', 'reference'), { recursive: true });
}

/* ----------------------------- 2. Imagery ------------------------- */
function viewSvg(product, view, colour) {
  switch (view) {
    case 'drape':
      return imagery.drapeView(product, 0, colour);
    case 'front':
      return imagery.flatView(product, 'front', colour);
    case 'back':
      return imagery.flatView(product, 'back', colour);
    case 'border':
      return imagery.detailView(product, 'border', colour);
    case 'pallu':
      return imagery.detailView(product, 'pallu', colour);
    case 'macro':
      return imagery.macroView(product, colour);
    case 'blouse':
      return imagery.blouseView(product, colour);
    default:
      throw new Error(`Unknown view: ${view}`);
  }
}

for (const product of products) {
  const views = galleryViews(product);
  // Cards need the drape and front views for every colourway; the
  // gallery needs every view, because switching colour swaps the lot.
  for (const colour of product.colours) {
    for (const view of views) {
      // Reference photographs are copied, not generated.
      if (view.kind === 'photo') continue;
      await writeImage(`products/${product.id}__${colour.slug}__${view.id}.svg`, viewSvg(product, view.id, colour.slug));
    }
    // Cards hover-swap to `front`, which some types do not list.
    if (!views.some((v) => v.id === 'front')) {
      await writeImage(`products/${product.id}__${colour.slug}__front.svg`, viewSvg(product, 'front', colour.slug));
    }
  }
}

/* Editorial artwork. */
await writeImage(
  'editorial/hero.svg',
  imagery.editorialView('hero-folded-silks', ['#3A1720', '#6E1B2B', '#8A3A2E', '#C89A3C', '#E3C878'], {
    w: 1600,
    h: 1000,
    title: 'Folded lengths of saree silk',
    desc: 'Abstract vector artwork of folded lengths of saree fabric layered across each other in burgundy, rust and antique gold. Original artwork, not a photograph.'
  })
);
await writeImage(
  'editorial/ready-to-wear.svg',
  imagery.editorialView('rtw-pleats', ['#2B2725', '#4A4442', '#8A8C90', '#C6CBD6', '#E8E0D2'], {
    w: 1600,
    h: 1200,
    title: 'Pre-pleated saree, illustrated',
    desc: 'Abstract vector artwork of evenly pleated fabric fanning from a waistband, in charcoal and silver. Original artwork, not a photograph.'
  })
);
await writeImage(
  'editorial/craft.svg',
  imagery.editorialView('craft-ikat', ['#1F3A44', '#C08A2E', '#DDAE52', '#4A2340', '#E8E0D2'], {
    w: 1600,
    h: 1200,
    title: 'Ikat patterning, illustrated',
    desc: 'Abstract vector artwork of ikat-style bands with deliberately blurred edges, in teal, ochre and aubergine. Original artwork, not a photograph.'
  })
);

/* Occasion tiles. */
const OCCASION_PALETTES = {
  'wedding-guest': ['#7A1F2E', '#9C3040', '#C89A3C', '#E3C878'],
  bridal: ['#6E1B2B', '#8A2438', '#C89A3C', '#E3C878'],
  festive: ['#C08A2E', '#D89A2E', '#B5342A', '#F1E9DA'],
  party: ['#20263C', '#39415E', '#C6CBD6', '#E8E0D2'],
  everyday: ['#C9B295', '#DCCBB2', '#7C7F4E', '#F5EFE5']
};
for (const occasion of occasions) {
  await writeImage(
    `occasions/${occasion.id}.svg`,
    imagery.occasionTile(occasion.id, OCCASION_PALETTES[occasion.id], occasion.label)
  );
}

/* Guide diagrams. */
await writeImage('guide/anatomy.svg', imagery.anatomyDiagram());
const DRAPE_STEPS = [
  ['Blouse and petticoat first', 'Diagram of a figure in a blouse and petticoat, with the petticoat waistband highlighted at the natural waist and the hem just clear of the floor.'],
  ['Tuck the plain end and go round once', 'Diagram showing the plain end of the saree tucked into the petticoat at the right hip, with the fabric wrapping once around the body.'],
  ['Make five to seven pleats', 'Diagram showing evenly spaced pleats gathered at the front of the body, all facing left, held together at the waistband.'],
  ['Wrap again, then pallu over the shoulder', 'Diagram showing the remaining fabric taken across the front from the right hip up over the left shoulder, falling down the back.'],
  ['Pin it in two places', 'Diagram marking two pin positions: one at the left shoulder through the blouse seam, and one at the waist holding the pleats.']
];
for (let i = 0; i < DRAPE_STEPS.length; i++) {
  await writeImage(`guide/drape-${i + 1}.svg`, imagery.drapeStep(i + 1, 5, DRAPE_STEPS[i][0], DRAPE_STEPS[i][1]));
}

/* --------------------- 3. Client catalogue index ------------------ */
const weaveLabel = (id) => (weaves.find((w) => w.id === id) || {}).label || null;

const index = {
  base: BASE,
  generatedAt: new Date().toISOString(),
  sample: true,
  handling: fulfilment.handling,
  shipping: fulfilment.shipping,
  international: fulfilment.international,
  services: Object.values(services).map((s) => ({
    id: s.id,
    label: s.label,
    price: s.price,
    leadDays: s.leadDays,
    requiresMeasurements: s.requiresMeasurements
  })),
  returns: { windowDays: returnsPolicy.windowDays, summary: returnsPolicy.summary },
  fabrics: fabrics.map((f) => ({ id: f.id, label: f.label })),
  weaves: weaves.filter((w) => w.id !== 'none').map((w) => ({ id: w.id, label: w.label })),
  occasions: occasions.map((o) => ({ id: o.id, label: o.label })),
  colourFamilies: colourFamilies.map((c) => ({ id: c.id, label: c.label })),
  products: products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    price: p.price,
    fabric: p.fabric,
    fabricLabel: p.fabricLabel,
    weave: p.weave,
    weaveLabel: weaveLabel(p.weave),
    occasions: p.occasions,
    occasionLabels: p.occasions.map((o) => (occasions.find((x) => x.id === o) || {}).label).filter(Boolean),
    colour: p.colour,
    colours: p.colours,
    readyToWear: p.readyToWear,
    stock: p.stock,
    isNew: p.isNew,
    sizes: p.sizes,
    sizeStock: p.sizeStock || null,
    drapeDifficulty: p.attributes.drapeDifficulty || null,
    weightGsm: p.attributes.weightGsm || null,
    blousePieceIncluded: Boolean(p.blousePiece.included),
    petticoatRequired: Boolean(p.petticoat.required),
    services: p.services,
    editorial: p.editorial,
    tags: [p.composition, p.provenance.short, p.origin].filter(Boolean),
    image: imgPath(p.id, 'drape', defaultColour(p)).replace(/^/, ''),
    href: url(`/products/${p.id}/`)
  }))
};
await write('assets/data/products.json', JSON.stringify(index));

/* ------------------------------ 4. Pages -------------------------- */
const routes = [];

async function page(path, html) {
  routes.push(path);
  await write(path, html);
}

await page('index.html', homePage());

for (const key of Object.keys(collections)) {
  // "Occasion" is a chooser, not a second copy of the full saree list.
  await page(`collections/${key}`, key === 'occasion' ? occasionLandingPage() : collectionPage(key));
}

for (const product of products) {
  await page(`products/${product.id}`, productPage(product));
}

await page('bag', shop.bagPage());
await page('wishlist', shop.wishlistPage());
await page('search', shop.searchPage());
await page('account', shop.accountPage());
await page('checkout', checkout.checkoutPage());
await page('order-confirmation', checkout.confirmationPage());
await page('track-order', checkout.trackOrderPage());

await page('saree-guide', guide.guideHubPage());
await page('saree-guide/first-saree', guide.firstSareePage());
await page('saree-guide/anatomy', guide.anatomyPage());
await page('saree-guide/draping', guide.drapingPage());
await page('saree-guide/fabrics', guide.fabricsPage());
await page('saree-guide/weaves', guide.weavesPage());
await page('saree-guide/ready-to-wear', guide.readyToWearPage());
await page('saree-guide/tailoring', guide.tailoringPage());
await page('saree-guide/measurements', guide.measurementsPage());
await page('saree-guide/care', guide.carePage());
await page('saree-guide/glossary', guide.glossaryPage());

await page('delivery', info.deliveryPage());
await page('returns', info.returnsPage());
await page('contact', info.contactPage());
await page('about', info.aboutPage());
await page('accessibility', info.accessibilityPage());
await page('demo-notice', info.demoNoticePage());
await page('terms', info.termsPage());
await page('privacy', info.privacyPage());
await page('cookies', info.cookiesPage());
await page('image-credits', info.imageCreditsPage());

await write('404.html', shop.notFoundPage());

/* ------------------------- 5. Crawler files ----------------------- */
const origin = process.env.SITE_ORIGIN || '';
const canonicalRoutes = routes.map((r) => (r === 'index.html' ? '/' : `/${r}/`));

await write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${canonicalRoutes.map((r) => `  <url><loc>${origin}${BASE}${r}</loc></url>`).join('\n')}
</urlset>`
);

await write(
  'robots.txt',
  `# This is a demonstration storefront, not a real shop.
# See ${BASE}/demo-notice/ for what is sample data.
User-agent: *
Allow: /
${origin ? `Sitemap: ${origin}${BASE}/sitemap.xml` : ''}
`
);

/* GitHub Pages serves through Jekyll unless told not to, which would
 * drop files and directories beginning with an underscore. */
await writeFile(join(DIST, '.nojekyll'), '');

/* --------------------------- 6. Self-checks ------------------------ *
 * Cheap guards against mistakes that are silent in the source and only
 * visible in the built output. Each one is here because it actually
 * happened during this build.
 * ------------------------------------------------------------------ */
const checks = [];

for (const route of [...routes, '404.html']) {
  const file = route.endsWith('.html') ? join(DIST, route) : join(DIST, route, 'index.html');
  const out = await readFile(file, 'utf8');

  // Nested templates escaped into visible tag soup.
  const escaped = out.match(/&lt;\/?(?:div|article|section|button|form|ul|ol|table|p|h[1-6])[\s&]/g);
  if (escaped) checks.push(`${route}: ${escaped.length} escaped HTML tags in the output`);

  // Interpolation of an object that was never rendered.
  if (out.includes('[object Object]')) checks.push(`${route}: "[object Object]" in the output`);

  // A missing value that reached the page.
  if (/>\s*(undefined|null|NaN)\s*</.test(out)) checks.push(`${route}: undefined/null/NaN rendered as text`);

  // Every internal link must resolve to a page we actually generated.
  for (const m of out.matchAll(/href="([^"#?]+)"/g)) {
    const href = m[1];
    if (!href.startsWith(BASE + '/') || href.startsWith('//')) continue;
    const rel = href.slice(BASE.length).replace(/^\/|\/$/g, '');
    if (!rel) continue;
    if (/\.(css|js|mjs|svg|webp|woff2|xml|txt|json|md|html)$/.test(rel)) continue;
    if (!routes.includes(rel) && !routes.includes(rel + '/')) {
      checks.push(`${route}: link to "${href}" has no generated page`);
    }
  }
}

if (checks.length) {
  console.error('\nBuild self-checks failed:\n' + [...new Set(checks)].map((c) => `  - ${c}`).join('\n') + '\n');
  process.exitCode = 1;
}

/* ------------------------------ Report ---------------------------- */
async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += await dirSize(full);
    else total += (await stat(full)).size;
  }
  return total;
}

const size = await dirSize(DIST);
const ms = Math.round(performance.now() - started);
const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

console.log(`
Built ${stats.pages} pages and ${stats.images} images in ${ms}ms
Base path: ${BASE || '(root)'}
Output:    dist/ — ${kb(size)} total
`);
