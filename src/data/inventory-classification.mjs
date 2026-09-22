/* ------------------------------------------------------------------ *
 * Supplier inventory classification.
 *
 * The source library contains photographs, price, colour and visible
 * design details, but no supplier-declared fibre composition. These
 * rules therefore describe the fabric's visible family rather than
 * making an unsupported purity claim. The product page keeps that
 * limitation explicit until supplier composition data is available.
 *
 * Occasion is deliberately a single primary use for each inventory
 * item. That makes the five occasion collections a genuine partition
 * of the catalogue instead of showing every saree in every collection.
 * ------------------------------------------------------------------ */

const SIMPLE_PATTERNS = new Set(['plain body', 'checked weave', 'striped weave', 'abstract weave']);
const SIMPLE_BORDERS = new Set(['plain border', 'contrast border', 'striped border', 'geometric border']);
const EVENING_PATTERNS = new Set(['plain body', 'abstract weave', 'geometric brocade', 'striped weave']);
const BRIDAL_COLOURS = new Set(['red', 'magenta', 'gold', 'orange']);
const RICH_BORDERS = new Set(['wide zari border', 'floral border', 'temple border']);

export function classifyFabric(item) {
  if (item.price <= 2000) {
    return {
      id: 'art-silk',
      label: 'Art silk appearance — visually assessed',
      composition: 'Exact fibre content pending supplier confirmation; visually classified as art silk'
    };
  }
  if (item.price <= 5000) {
    return {
      id: 'silk-blend',
      label: 'Silk-blend appearance — visually assessed',
      composition: 'Exact fibre content pending supplier confirmation; visually classified as a silk blend'
    };
  }
  if (item.price <= 9000) {
    return {
      id: 'silk-cotton',
      label: 'Silk–cotton appearance — visually assessed',
      composition: 'Exact fibre content pending supplier confirmation; visually classified as silk–cotton'
    };
  }
  return {
    id: 'silk',
    label: 'Premium silk appearance — visually assessed',
    composition: 'Exact fibre content pending supplier confirmation; visually classified in the premium silk family'
  };
}

export function classifyOccasion(item) {
  const primaryColour = item.colors[0];
  const hasBridalPalette = BRIDAL_COLOURS.has(primaryColour);
  const hasRichFinish = RICH_BORDERS.has(item.border) || item.pattern.includes('brocade');

  if (item.price >= 12000 && (hasBridalPalette || hasRichFinish)) return 'bridal';
  if (item.price >= 7000) return 'wedding-guest';

  const hasSimpleDaywearDesign = SIMPLE_PATTERNS.has(item.pattern) && SIMPLE_BORDERS.has(item.border);
  if (item.price <= 4000 && hasSimpleDaywearDesign) return 'everyday';

  const hasEveningDesign = EVENING_PATTERNS.has(item.pattern) && item.border !== 'temple border';
  if (item.price >= 2500 && item.price <= 6000 && hasEveningDesign) return 'party';

  return 'festive';
}

export function classifyInventoryItem(item) {
  return {
    fabric: classifyFabric(item),
    occasion: classifyOccasion(item)
  };
}
