# Photographic reference library

This folder contains **40 openly licensed photographic reference images** selected for the 32 catalogue records, five homepage occasion tiles, and three editorial image slots.

## Important usage rule

The catalogue is fictional. These images show a comparable weave, fabric, garment shape, accessory, or styling direction; they are **not photographs of the products described in the catalogue**. Do not replace the storefront's deliberately labelled illustrations with these files unless the page is also changed to label them as representative reference imagery.

For production, replace each product reference with photographs of the actual item for sale: front drape, back drape, pallu, border, blouse piece, reverse, close weave, and scale/texture detail.

## Naming convention

```text
products/<product-id>/<product-id>--reference-01.webp
occasions/<occasion-id>--reference-01.webp
editorial/<placement>--reference-01.webp
```

All names are lowercase, kebab-case, stable, and aligned with IDs already used in `src/data/products.mjs` and `src/data/taxonomy.mjs`.

## Rights and provenance

- `sources.json` is the machine-readable source manifest.
- `ATTRIBUTION.md` is the human-readable attribution table.
- Every downloaded image is restricted to the licence allowlist in `scripts/download-reference-images.mjs` and is normalized to WebP at a maximum 1600×1600 pixels.
- Keep the attribution files when copying or redistributing these assets.

Regenerate the library with:

```bash
node scripts/download-reference-images.mjs
```

