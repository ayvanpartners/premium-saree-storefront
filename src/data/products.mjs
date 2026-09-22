import { inventoryRecords } from './inventory-records.mjs';

/* ------------------------------------------------------------------ *
 * Product catalogue.
 *
 * SAMPLE CONTENT. Every product, price, measurement and provenance
 * note below was written for this demonstration. None of it describes
 * real stock. `provenance` is the field that keeps us honest: it says
 * how much is actually known about how a piece was made, and the
 * product page prints it word for word rather than paraphrasing it
 * into a heritage story.
 *
 * Prices are stored as whole Indian rupees.
 * ------------------------------------------------------------------ */

const PROVENANCE = {
  supplierDeclared: {
    code: 'supplier-declared',
    short: 'Handloom, supplier declared',
    full:
      'Our supplier declares this was woven on a handloom and names the weaving cluster. We hold that declaration on file. We have not independently audited the loom.'
  },
  millDescribed: {
    code: 'mill-described',
    short: 'Mill described, not verified',
    full:
      'The weave was described to us by the mill that supplied it. We have not independently verified it, so treat it as a description of the design rather than a provenance claim.'
  },
  inspiredBy: {
    code: 'inspired-by',
    short: 'Inspired by the tradition',
    full:
      'This design references the tradition named, but it is not made in that tradition or in that region. We call it out so you are not misled by the name.'
  },
  powerloom: {
    code: 'powerloom',
    short: 'Powerloom woven',
    full: 'Woven on a powerloom. Even, fast and lower in cost than handloom, with none of the small irregularities of hand weaving.'
  },
  contemporary: {
    code: 'contemporary',
    short: 'Contemporary production',
    full: 'A contemporary piece made in a modern mill. No regional weaving tradition is claimed.'
  }
};

export { PROVENANCE };

/* Defaults applied to every saree so no record can silently omit
 * something a customer needs before buying. */
function saree(p) {
  const base = {
    type: 'saree',
    readyToWear: false,
    stock: 'in-stock',
    isNew: false,
    petticoat: { included: false, required: true },
    blousePiece: { included: true, lengthCm: 80, stitched: false },
    dimensions: { lengthM: 5.5, widthCm: 110 },
    services: ['fallPico', 'blouseStitching'],
    origin: 'India',
    lining: 'Unlined',
    fallPicoDone: false,
    sizes: null,
    ...p
  };
  // Derived: what is and is not in the parcel, stated plainly.
  base.included = base.included || buildIncluded(base);
  base.excluded = base.excluded || buildExcluded(base);
  return base;
}

function buildIncluded(p) {
  const list = [];
  if (p.readyToWear) {
    list.push('One pre-pleated, stitched ready-to-wear saree with a concealed side zip');
  } else {
    list.push(`One saree, ${p.dimensions.lengthM} metres long and ${p.dimensions.widthCm}cm wide`);
  }
  if (p.blousePiece.included) {
    list.push(
      p.blousePiece.stitched
        ? `One blouse, stitched, in the size you select`
        : `One unstitched blouse piece, ${p.blousePiece.lengthCm}cm, attached to the saree and cut from the same fabric run`
    );
  }
  if (p.petticoat.included) list.push('One matching petticoat');
  list.push('Muslin storage bag and a care card');
  return list;
}

function buildExcluded(p) {
  const list = [];
  if (p.blousePiece.included && !p.blousePiece.stitched) {
    list.push('Blouse stitching. The included piece arrives as flat fabric — add stitching below, or take it to your own tailor.');
  }
  if (!p.blousePiece.included) list.push('A blouse or blouse piece of any kind.');
  if (!p.petticoat.included && p.petticoat.required) {
    list.push('A petticoat. This fabric needs one underneath — we sell them from ₹2,200.');
  }
  list.push('The jewellery and footwear shown in the styling images.');
  return list;
}

const sampleProducts = [
  /* ------------------------------ Silk ----------------------------- */
  saree({
    id: 'meenakshi-kanjivaram',
    name: 'Meenakshi Kanjivaram Silk Saree',
    fabric: 'silk',
    fabricLabel: 'Pure mulberry silk with zari',
    composition: '92% mulberry silk, 8% metallic zari thread',
    weave: 'kanjivaram',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['bridal', 'wedding-guest', 'festive'],
    price: 42500,
    colour: { name: 'Deep burgundy with antique gold', family: 'red', hex: '#6E1B2B' },
    colours: [
      { slug: 'burgundy', name: 'Deep burgundy', hex: '#6E1B2B', stock: 'made-to-order' },
      { slug: 'peacock', name: 'Peacock blue', hex: '#1F5C6B', stock: 'made-to-order' },
      { slug: 'moss', name: 'Moss green', hex: '#4A5B34', stock: 'out-of-stock' }
    ],
    stock: 'made-to-order',
    isNew: true,
    dimensions: { lengthM: 6.3, widthCm: 118 },
    blousePiece: { included: true, lengthCm: 90, stitched: false },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Smooth with a firm, papery crispness from the zari',
      weightGsm: 720,
      weightLabel: 'Heavy, around 780g for the full saree',
      drapeDifficulty: 5
    },
    care: 'Dry clean only. Store folded in the muslin bag away from light, and refold along different lines once a year so the zari does not crack.',
    patternFamily: 'kanjivaram',
    palette: ['#6E1B2B', '#8A2438', '#C89A3C', '#E3C878', '#3A0F1A'],
    editorial: 'A contrast-border silk with the weight and the joins that mark the tradition.',
    description:
      'The body and the border of this saree were woven separately and joined, which is why the antique gold border sits against burgundy with no gradient between them. You can feel the join with a fingernail. At 780g it is a substantial saree: the pleats stay put all evening, and it holds a shape in photographs that lighter fabrics cannot.',
    honest:
      'This is a heavy, long saree and it is genuinely hard to drape the first time. If this is your first saree, add ready-to-wear conversion or ask a friend.',
    styling: 'Wear it with the plain gold blouse piece stitched high-necked, and keep jewellery to one statement piece.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'anaya-banarasi-brocade',
    name: 'Anaya Banarasi Brocade Saree',
    fabric: 'silk',
    fabricLabel: 'Katan silk with brocade',
    composition: '95% silk, 5% metallic zari thread',
    weave: 'banarasi',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['wedding-guest', 'festive', 'bridal'],
    price: 29800,
    colour: { name: 'Warm ivory with gold', family: 'white', hex: '#F0E7D6' },
    colours: [
      { slug: 'ivory', name: 'Warm ivory', hex: '#F0E7D6', stock: 'in-stock' },
      { slug: 'rosewood', name: 'Rosewood', hex: '#93424A', stock: 'in-stock' },
      { slug: 'indigo', name: 'Deep indigo', hex: '#2A3A5C', stock: 'low-stock' }
    ],
    isNew: true,
    dimensions: { lengthM: 6.3, widthCm: 115 },
    blousePiece: { included: true, lengthCm: 85, stitched: false },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Raised brocade you can read with your fingertips against a smooth ground',
      weightGsm: 480,
      weightLabel: 'Medium-heavy, around 620g',
      drapeDifficulty: 4
    },
    care: 'Dry clean only. The brocade floats on the reverse can catch — turn it inside out before folding.',
    patternFamily: 'brocade',
    palette: ['#F0E7D6', '#E0CFAE', '#C89A3C', '#A8812C', '#6E5B34'],
    editorial: 'Dense floral brocade on an ivory ground — the most photographed saree we sell.',
    description:
      'Brocade means the pattern is woven in with extra threads rather than printed on, so it stands slightly proud of the surface and the reverse shows the floats of thread where the motif jumps. The ivory ground keeps a heavily patterned saree from reading as loud, which is why it works for a wedding where you are a guest and not the bride.',
    honest: 'Ivory shows marks. If you are eating a sit-down meal in it, take a pin for the pallu and keep it off your lap.',
    styling: 'A deep-toned blouse in rosewood or forest green stops the ivory washing you out.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'lakshmi-paithani',
    name: 'Lakshmi Paithani Silk Saree',
    fabric: 'silk',
    fabricLabel: 'Pure silk with tapestry-woven pallu',
    composition: '90% silk, 10% metallic zari thread',
    weave: 'paithani',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['bridal', 'wedding-guest'],
    price: 52000,
    colour: { name: 'Peacock teal with gold', family: 'blue', hex: '#1F5C6B' },
    colours: [
      { slug: 'peacock', name: 'Peacock teal', hex: '#1F5C6B', stock: 'made-to-order' },
      { slug: 'magenta', name: 'Magenta', hex: '#9C2A62', stock: 'made-to-order' }
    ],
    stock: 'made-to-order',
    dimensions: { lengthM: 6.3, widthCm: 120 },
    blousePiece: { included: true, lengthCm: 90, stitched: false },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Smooth body with a noticeably thicker, stiffer woven pallu',
      weightGsm: 700,
      weightLabel: 'Heavy, around 810g',
      drapeDifficulty: 5
    },
    care: 'Dry clean only. Never press the pallu directly — press from the reverse through a cotton cloth.',
    patternFamily: 'paithani',
    palette: ['#1F5C6B', '#2D7C8A', '#C89A3C', '#E3C878', '#123A44'],
    editorial: 'The peacock pallu is woven, thread by thread, not embroidered on.',
    description:
      'The pallu on this saree is a tapestry weave: the peacock and lotus are built into the cloth as it is made, which is why the pallu is heavier and stiffer than the body and why the design reads cleanly from both faces. The border uses the interlocked oblique technique that gives Paithani its unbroken colour change at the edge.',
    honest: 'Made to order, so allow around two weeks before dispatch. This is the heaviest saree we stock.',
    styling: 'Traditionally worn with a contrast blouse in the pallu gold rather than matching the body.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'devi-mysore-crepe',
    name: 'Devi Mysore Crepe Silk Saree',
    fabric: 'silk',
    fabricLabel: 'Mysore crepe silk',
    composition: '100% silk',
    weave: 'mysore-crepe',
    provenance: PROVENANCE.millDescribed,
    occasions: ['party', 'wedding-guest', 'festive'],
    price: 18900,
    colour: { name: 'Emerald', family: 'green', hex: '#1F5A43' },
    colours: [
      { slug: 'emerald', name: 'Emerald', hex: '#1F5A43', stock: 'in-stock' },
      { slug: 'oxblood', name: 'Oxblood', hex: '#5E1F26', stock: 'in-stock' },
      { slug: 'ink', name: 'Ink black', hex: '#23201F', stock: 'in-stock' },
      { slug: 'saffron', name: 'Saffron', hex: '#C97B22', stock: 'low-stock' }
    ],
    dimensions: { lengthM: 5.5, widthCm: 112 },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Fine pebbled crepe, matte rather than shiny',
      weightGsm: 180,
      weightLabel: 'Light to medium, around 420g',
      drapeDifficulty: 3
    },
    care: 'Dry clean recommended. Crepe can shrink slightly if washed.',
    patternFamily: 'plain-border',
    palette: ['#1F5A43', '#2C7355', '#C89A3C', '#0F3327', '#E8E0D2'],
    editorial: 'Silk that falls like water, with none of the shine.',
    description:
      'Crepe is made by twisting the silk threads hard before weaving, which gives this saree a fine sandy surface and a fall that is closer to liquid than to cloth. It is silk, so it has weight and body, but at 420g it is less than half the weight of a Kanjivaram. A plain saree with a narrow zari border is the most versatile thing you can own.',
    honest: 'The matte surface means it photographs quieter than a shiny silk. If you want shine in photos, look at the Banarasi instead.',
    styling: 'The one saree that works with any blouse you already own.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'padma-tussar',
    name: 'Padma Tussar Silk Saree',
    fabric: 'silk',
    fabricLabel: 'Tussar wild silk',
    composition: '100% tussar silk',
    weave: 'tussar',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['everyday', 'festive', 'party'],
    price: 15800,
    colour: { name: 'Natural wheat with madder border', family: 'neutral', hex: '#C8AE82' },
    colours: [
      { slug: 'wheat', name: 'Natural wheat', hex: '#C8AE82', stock: 'in-stock' },
      { slug: 'clay', name: 'Clay', hex: '#A8683F', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Opaque',
      texture: 'Dry, slubby and slightly coarse — you can see individual thicker threads',
      weightGsm: 220,
      weightLabel: 'Medium, around 480g',
      drapeDifficulty: 2
    },
    care: 'Dry clean, or hand wash cold with a pH-neutral detergent. Dry flat in shade — sunlight fades the natural gold.',
    patternFamily: 'tussar',
    palette: ['#C8AE82', '#D9C49B', '#9E3B2E', '#7A5B3A', '#F1E9DA'],
    editorial: 'Wild silk, warm gold, and a texture you can read with your eyes shut.',
    description:
      'Tussar comes from wild silkworms rather than farmed mulberry, and it is naturally a deeper honey-gold that no dye quite reproduces. The thread is uneven, so the surface has slubs — small thicker sections that catch the light differently. It is stiffer than mulberry silk, which makes the pleats behave, and it is one of the few silks relaxed enough to wear during the day.',
    honest: 'The slubbed texture is the point, not a flaw. If you want a perfectly even surface, choose the Mysore crepe.',
    styling: 'Terracotta, rust or deep green blouses. Silver jewellery rather than gold.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  /* ---------------------------- Silk-cotton ------------------------ */
  saree({
    id: 'rohini-chanderi',
    name: 'Rohini Chanderi Silk-Cotton Saree',
    fabric: 'silk-blend',
    fabricLabel: 'Chanderi silk-cotton',
    composition: '60% silk, 40% cotton',
    weave: 'chanderi',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['festive', 'wedding-guest', 'everyday'],
    price: 14500,
    colour: { name: 'Blush with silver buti', family: 'pink', hex: '#D9AFAD' },
    colours: [
      { slug: 'blush', name: 'Blush', hex: '#D9AFAD', stock: 'in-stock' },
      { slug: 'pistachio', name: 'Pistachio', hex: '#B9C7A0', stock: 'in-stock' },
      { slug: 'slate', name: 'Slate grey', hex: '#7E8794', stock: 'low-stock' }
    ],
    isNew: true,
    dimensions: { lengthM: 5.5, widthCm: 110 },
    attributes: {
      sheerness: 'Semi-sheer — a petticoat is essential',
      texture: 'Glassy and cool, almost weightless',
      weightGsm: 90,
      weightLabel: 'Very light, around 280g',
      drapeDifficulty: 2
    },
    care: 'Dry clean preferred. Hand wash cold at your own risk — the silk can water-mark.',
    patternFamily: 'chanderi',
    palette: ['#D9AFAD', '#E8CFCD', '#B9B0A4', '#C0C6CE', '#F6F1EA'],
    editorial: 'Sheer, glossy and so light you forget you are wearing it.',
    description:
      'Chanderi is woven from unbleached yarn, which is where the faint glassy transparency comes from. Small silver buti — woven dots — are scattered across the body. At 280g this is the lightest silk-mix saree we stock, and the easiest formal saree to wear for a long hot day.',
    honest:
      'It is genuinely see-through. You need a petticoat in a matching or deliberately contrasting colour, and what you wear underneath will show at the pleats.',
    styling: 'A petticoat one shade deeper than the saree reads as intentional rather than accidental.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'gauri-maheshwari',
    name: 'Gauri Maheshwari Saree',
    fabric: 'silk-blend',
    fabricLabel: 'Maheshwari silk-cotton',
    composition: '50% silk, 50% cotton',
    weave: 'maheshwari',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['everyday', 'festive'],
    price: 11200,
    colour: { name: 'Sandstone with reversible border', family: 'neutral', hex: '#C9B295' },
    colours: [
      { slug: 'sandstone', name: 'Sandstone', hex: '#C9B295', stock: 'in-stock' },
      { slug: 'lotus', name: 'Lotus pink', hex: '#CE8397', stock: 'in-stock' },
      { slug: 'teal', name: 'Deep teal', hex: '#255E60', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Lightly sheer at the body, opaque at the border',
      texture: 'Crisp and dry with a faint sheen along the silk warp',
      weightGsm: 110,
      weightLabel: 'Light, around 330g',
      drapeDifficulty: 1
    },
    care: 'Hand wash cold, separately, with a mild detergent. Dry in shade. Warm iron on the reverse.',
    patternFamily: 'maheshwari',
    palette: ['#C9B295', '#DCCBB2', '#6E1B2B', '#C89A3C', '#F5EFE5'],
    editorial: 'A reversible border, designed to be worn either way round.',
    description:
      'The striped border on a Maheshwari is woven to read correctly on both faces, so if you drape the saree the other way it still looks finished. The silk runs one way through the weave and cotton the other, which is why it is crisp rather than soft and why the pleats hold without ironing.',
    honest: 'Hand washable, which is unusual for anything with silk in it, but it will need ironing every time.',
    styling: 'The everyday saree that does not look like an everyday saree.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'aruna-kota-doria',
    name: 'Aruna Kota Doria Saree',
    fabric: 'cotton',
    fabricLabel: 'Kota Doria cotton-silk',
    composition: '70% cotton, 30% silk',
    weave: 'kota-doria',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['everyday', 'festive'],
    price: 8800,
    colour: { name: 'Mint with gold check', family: 'green', hex: '#BFD4C4' },
    colours: [
      { slug: 'mint', name: 'Mint', hex: '#BFD4C4', stock: 'in-stock' },
      { slug: 'powder', name: 'Powder blue', hex: '#B6C6D8', stock: 'in-stock' },
      { slug: 'sand', name: 'Sand', hex: '#DACBB0', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Sheer — the open weave is visible',
      texture: 'A fine open grid, crisp and papery',
      weightGsm: 70,
      weightLabel: 'Featherweight, around 240g',
      drapeDifficulty: 2
    },
    care: 'Hand wash cold. Do not wring — the open weave distorts. Dry flat, iron while very slightly damp.',
    patternFamily: 'kota',
    palette: ['#BFD4C4', '#D6E2D8', '#C89A3C', '#8AA694', '#F7F3EB'],
    editorial: 'The lightest saree we sell. You can see daylight through it.',
    description:
      'Kota Doria is woven in a square grid — the checks are called khat — alternating cotton and silk threads, which is what gives it that crisp papery hand despite weighing almost nothing. It is the saree to wear when the room is going to be hot.',
    honest: 'Sheer and delicate. It snags on rings and rough jewellery, and it needs a full petticoat.',
    styling: 'Works beautifully over a deep-coloured petticoat, which shows through and shifts the whole tone.',
    services: ['fallPico', 'blouseStitching']
  }),

  /* ------------------------------ Cotton --------------------------- */
  saree({
    id: 'neela-jamdani',
    name: 'Neela Jamdani Cotton Saree',
    fabric: 'cotton',
    fabricLabel: 'Fine handloom cotton',
    composition: '100% cotton',
    weave: 'jamdani',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['festive', 'everyday', 'party'],
    price: 13200,
    colour: { name: 'Indigo with ivory motifs', family: 'blue', hex: '#2C3E63' },
    colours: [
      { slug: 'indigo', name: 'Indigo', hex: '#2C3E63', stock: 'low-stock' },
      { slug: 'ecru', name: 'Ecru and black', hex: '#E5DCCB', stock: 'in-stock' }
    ],
    stock: 'low-stock',
    attributes: {
      sheerness: 'Semi-sheer',
      texture: 'Soft, fine and slightly crisp with raised motifs you can feel',
      weightGsm: 100,
      weightLabel: 'Light, around 300g',
      drapeDifficulty: 1
    },
    care: 'Hand wash cold, separately for the first three washes — the indigo will bleed. Dry in shade.',
    patternFamily: 'jamdani',
    palette: ['#2C3E63', '#44598A', '#EFE7D6', '#1B2742', '#C9BFA8'],
    editorial: 'Motifs added by hand on the loom, one thread at a time.',
    description:
      'Jamdani motifs are put in by the weaver as the cloth is being made, using a supplementary thread lifted by hand for every single point of the pattern. There is no shortcut and no machine version. You can tell it apart from an embroidered saree by turning it over: the motifs read the same on both sides, with no long threads trailing behind.',
    honest: 'Indigo bleeds. Wash it alone the first few times, and do not let it sit wet against anything pale.',
    styling: 'Cotton this fine takes starch well if you want sharper pleats.',
    services: ['fallPico', 'blouseStitching']
  }),

  saree({
    id: 'uma-handloom-cotton',
    name: 'Uma Handloom Cotton Saree',
    fabric: 'cotton',
    fabricLabel: 'Handloom cotton',
    composition: '100% cotton',
    weave: 'none',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['everyday'],
    price: 7800,
    colour: { name: 'Off-white with charcoal stripe', family: 'white', hex: '#EFE9DE' },
    colours: [
      { slug: 'offwhite', name: 'Off-white and charcoal', hex: '#EFE9DE', stock: 'in-stock' },
      { slug: 'grey', name: 'Grey and ivory', hex: '#A8A49C', stock: 'in-stock' },
      { slug: 'olive', name: 'Olive and ivory', hex: '#7C7F4E', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Opaque',
      texture: 'Soft, matte, with the small unevennesses of a hand-thrown shuttle',
      weightGsm: 130,
      weightLabel: 'Light to medium, around 380g',
      drapeDifficulty: 1
    },
    care: 'Machine wash at 30°C on a gentle cycle. Warm iron. It softens with every wash.',
    patternFamily: 'stripe',
    palette: ['#EFE9DE', '#D8D2C6', '#2B2725', '#6E6A64', '#FAF7F2'],
    editorial: 'The saree to learn in. Machine washable, grips itself, forgives everything.',
    description:
      'Plain handloom cotton is the most practical saree there is. It grips itself rather than sliding, so pleats stay where you put them without a single pin, and it goes in the washing machine. If you have never draped a saree before, start here and keep it afterwards for work.',
    honest: 'It creases. That is cotton, and most people find the crumple is part of the charm by the second wearing.',
    styling: 'A crisp white or black cotton blouse and flat sandals.',
    services: ['fallPico', 'blouseStitching']
  }),

  saree({
    id: 'shalini-sambalpuri',
    name: 'Shalini Sambalpuri Ikat Saree',
    fabric: 'cotton',
    fabricLabel: 'Handloom cotton ikat',
    composition: '100% cotton',
    weave: 'sambalpuri',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['festive', 'everyday', 'party'],
    price: 13600,
    colour: { name: 'Black with vermilion and ivory', family: 'black', hex: '#221F1E' },
    colours: [
      { slug: 'black', name: 'Black and vermilion', hex: '#221F1E', stock: 'in-stock' },
      { slug: 'maroon', name: 'Maroon and mustard', hex: '#6A2027', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Opaque',
      texture: 'Firm, matte cotton with a dense hand',
      weightGsm: 150,
      weightLabel: 'Medium, around 450g',
      drapeDifficulty: 2
    },
    care: 'Hand wash cold with salt in the first wash to set the dye. Dry in shade, iron on the reverse.',
    patternFamily: 'ikat',
    palette: ['#221F1E', '#B5342A', '#EFE7D6', '#C89A3C', '#4A4442'],
    editorial: 'Tie-dyed thread by thread before weaving, which is why the edges blur.',
    description:
      'In ikat the pattern is dyed into the threads before a single row is woven, by binding off the sections that must stay undyed. When the threads are then lined up on the loom they never align perfectly, and that tiny drift is what gives every shape its soft feathered edge. A print cannot fake it, and a machine cannot tighten it.',
    honest: 'High-contrast black and red. Wash it separately, properly, for the first few times.',
    styling: 'Oxidised silver and a plain black blouse. Let the pattern do the work.',
    services: ['fallPico', 'blouseStitching']
  }),

  saree({
    id: 'charu-block-print-linen',
    name: 'Charu Hand Block Print Linen Saree',
    fabric: 'linen',
    fabricLabel: 'Pure linen, hand block printed',
    composition: '100% linen',
    weave: 'block-print',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['everyday', 'party'],
    price: 9200,
    colour: { name: 'Terracotta on ivory', family: 'orange', hex: '#B4603C' },
    colours: [
      { slug: 'terracotta', name: 'Terracotta on ivory', hex: '#B4603C', stock: 'in-stock' },
      { slug: 'indigo', name: 'Indigo on ivory', hex: '#35496F', stock: 'in-stock' },
      { slug: 'olive', name: 'Olive on ivory', hex: '#6F7444', stock: 'out-of-stock' }
    ],
    isNew: true,
    attributes: {
      sheerness: 'Opaque',
      texture: 'Dry, cool and noticeably textured, with a slight stiffness that softens',
      weightGsm: 140,
      weightLabel: 'Medium, around 420g',
      drapeDifficulty: 2
    },
    care: 'Hand wash cold or machine wash at 30°C in a bag. Iron damp. It gets better with age.',
    patternFamily: 'block-print',
    palette: ['#B4603C', '#D08B62', '#F1E9DA', '#8A4227', '#C9BFA8'],
    editorial: 'Stamped by hand, block by block, so no two repeats line up exactly.',
    description:
      'Each colour in this print is a separate carved wooden block, inked and pressed down the length of the fabric by hand. Look along a border and you will find places where two impressions overlap slightly and places where they leave a hairline gap. That is the record of a hand doing it, and it is the reason we buy block print rather than screen print.',
    honest: 'Linen creases hard and deliberately. If creases bother you, this is the wrong fabric.',
    styling: 'A linen or khadi blouse, and nothing shiny anywhere near it.',
    services: ['fallPico', 'blouseStitching']
  }),

  /* --------------------------- Georgette --------------------------- */
  saree({
    id: 'saanvi-georgette',
    name: 'Saanvi Georgette Saree',
    fabric: 'georgette',
    fabricLabel: 'Poly georgette',
    composition: '100% polyester georgette',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['party', 'wedding-guest', 'festive'],
    price: 11800,
    colour: { name: 'Wine', family: 'red', hex: '#6B2233' },
    colours: [
      { slug: 'wine', name: 'Wine', hex: '#6B2233', stock: 'in-stock' },
      { slug: 'onyx', name: 'Onyx', hex: '#262322', stock: 'in-stock' },
      { slug: 'sage', name: 'Sage', hex: '#8E9C82', stock: 'in-stock' },
      { slug: 'plum', name: 'Plum', hex: '#54325C', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Semi-opaque',
      texture: 'Fine crinkled crepe with a slight grain and a matte finish',
      weightGsm: 80,
      weightLabel: 'Light, around 300g',
      drapeDifficulty: 2
    },
    care: 'Hand wash cold or dry clean. Do not tumble dry. Cool iron only — this is a synthetic and it will melt.',
    patternFamily: 'plain-fluid',
    palette: ['#6B2233', '#8C3448', '#E5DCCB', '#3E1420', '#C9A26B'],
    editorial: 'The most forgiving light saree there is, and the one we recommend first.',
    description:
      'Georgette has a crinkled crepe surface, and that microscopic texture is what stops it sliding the way chiffon does. It is nearly as light as chiffon, falls almost as fluidly, resists creasing well enough to survive a flight, and holds pleats with a handful of pins. If you want a light saree and you have never draped one before, this is the fabric.',
    honest:
      'It is polyester, and we would rather say so. That is why it costs what it does, why it travels well, and why you must keep an iron away from it.',
    styling: 'Plain fluid sarees live or die on the blouse. Pick a texture — brocade, raw silk, velvet.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'bela-bandhani',
    name: 'Bela Bandhani Georgette Saree',
    fabric: 'georgette',
    fabricLabel: 'Georgette, tie-dyed',
    composition: '100% viscose georgette',
    weave: 'bandhani',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['festive', 'party'],
    price: 12400,
    colour: { name: 'Marigold and red', family: 'yellow', hex: '#D89A2E' },
    colours: [
      { slug: 'marigold', name: 'Marigold and red', hex: '#D89A2E', stock: 'in-stock' },
      { slug: 'fuchsia', name: 'Fuchsia and black', hex: '#A82A6A', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Semi-opaque',
      texture: 'Crepe with a faint permanent pucker where the ties were',
      weightGsm: 85,
      weightLabel: 'Light, around 310g',
      drapeDifficulty: 2
    },
    care: 'Dry clean recommended. The dye is deep and will run in water.',
    patternFamily: 'bandhani',
    palette: ['#D89A2E', '#E8B85A', '#B5342A', '#F1E9DA', '#7A4A12'],
    editorial: 'Tens of thousands of hand-tied points, each one a dot.',
    description:
      'Every dot on this saree is a place where the cloth was pinched up and bound tightly with thread before it went into the dye, then untied afterwards. The fabric keeps a slight memory of the ties, so run your hand across it and you can feel the pucker. Irregular dot spacing is the honest signature of hand tying.',
    honest: 'The dye is intense and not colour-fast in water. Dry clean it, and keep it out of the rain.',
    styling: 'Festive by nature. A plain blouse in the darker of the two dye colours.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'kamala-ikat-silk',
    name: 'Kamala Pochampally Ikat Silk Saree',
    fabric: 'silk',
    fabricLabel: 'Pochampally silk ikat',
    composition: '100% silk',
    weave: 'ikat',
    provenance: PROVENANCE.supplierDeclared,
    occasions: ['festive', 'wedding-guest', 'party'],
    price: 17800,
    colour: { name: 'Ochre and aubergine', family: 'yellow', hex: '#C08A2E' },
    colours: [
      { slug: 'ochre', name: 'Ochre and aubergine', hex: '#C08A2E', stock: 'in-stock' },
      { slug: 'teal', name: 'Teal and coral', hex: '#1F6B6B', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Opaque',
      texture: 'Smooth silk with a firm, slightly dry hand',
      weightGsm: 200,
      weightLabel: 'Medium, around 500g',
      drapeDifficulty: 3
    },
    care: 'Dry clean only.',
    patternFamily: 'ikat-silk',
    palette: ['#C08A2E', '#DDAE52', '#4A2340', '#E8E0D2', '#8A5F16'],
    editorial: 'Geometric ikat in silk, with that unmistakable soft-edged pattern.',
    description:
      'Pochampally ikat works in bold geometry — diamonds, chevrons, stepped forms — because the tie-dye-before-weaving method suits shapes with clear direction. In silk the blurred edges read as a deliberate softness against the sheen rather than as a mistake. A saree that looks contemporary and is anything but.',
    honest: 'Medium weight and reasonably grippy, but silk, so a beginner will still want pins.',
    styling: 'One of the two colours as a plain blouse. Never both.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  /* ---------------------------- Chiffon ---------------------------- */
  saree({
    id: 'isha-chiffon-ombre',
    name: 'Isha Ombré Chiffon Saree',
    fabric: 'chiffon',
    fabricLabel: 'Poly chiffon',
    composition: '100% polyester chiffon',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['party', 'wedding-guest'],
    price: 9600,
    colour: { name: 'Rose fading to sand', family: 'pink', hex: '#C98B8B' },
    colours: [
      { slug: 'rose', name: 'Rose to sand', hex: '#C98B8B', stock: 'in-stock' },
      { slug: 'slate', name: 'Slate to silver', hex: '#75808E', stock: 'in-stock' },
      { slug: 'amber', name: 'Amber to cream', hex: '#C89552', stock: 'low-stock' }
    ],
    attributes: {
      sheerness: 'Sheer — a petticoat is essential',
      texture: 'Very fine, cool and slippery with a faint grain',
      weightGsm: 50,
      weightLabel: 'Featherweight, around 220g',
      drapeDifficulty: 4
    },
    care: 'Hand wash cold. Cool iron through a cloth, or steam. Never hot.',
    patternFamily: 'ombre',
    palette: ['#C98B8B', '#DCAFA6', '#E8D5BC', '#F1E9DA', '#A8676A'],
    editorial: 'A gradient that moves as you move.',
    description:
      'The colour shifts along the length, so the pleats read one tone and the pallu another, and the whole thing changes as you walk. Chiffon is the most fluid fabric we sell and the most dramatic in movement. It is also the most slippery, which is the trade.',
    honest:
      'Chiffon slides. Expect to use eight to ten pins, and give yourself twenty minutes the first time. If that sounds like too much, the same look in georgette is far more forgiving.',
    styling: 'A fitted, structured blouse gives the fluid fabric something to hang from.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  /* ---------------------------- Organza ---------------------------- */
  saree({
    id: 'tara-organza-ribbonwork',
    name: 'Tara Organza Saree with Ribbonwork',
    fabric: 'organza',
    fabricLabel: 'Silk organza with ribbon embroidery',
    composition: '100% silk organza, viscose ribbon embroidery',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['party', 'wedding-guest', 'festive'],
    price: 16500,
    colour: { name: 'Dusk blue', family: 'blue', hex: '#8FA3BE' },
    colours: [
      { slug: 'dusk', name: 'Dusk blue', hex: '#8FA3BE', stock: 'in-stock' },
      { slug: 'shell', name: 'Shell pink', hex: '#E0BFBC', stock: 'in-stock' },
      { slug: 'lime', name: 'Pale lime', hex: '#C6CE9A', stock: 'in-stock' }
    ],
    isNew: true,
    attributes: {
      sheerness: 'Sheer and crisp — a petticoat is essential',
      texture: 'Papery and springy, with raised ribbon flowers you can feel',
      weightGsm: 60,
      weightLabel: 'Light but bulky, around 280g',
      drapeDifficulty: 3
    },
    care: 'Dry clean only. Store rolled, not folded — organza keeps creases permanently.',
    patternFamily: 'organza',
    palette: ['#8FA3BE', '#B6C4D6', '#E8D5BC', '#F6F1EA', '#5E7290'],
    editorial: 'Sheer, sculptural, and it holds its own shape.',
    description:
      'Organza is stiff enough to stand away from the body, so the pleats fan rather than fall and the pallu keeps a shape in the air. The ribbon flowers are stitched on by hand in a scattered pattern that gathers towards the pallu. It is the most photographed fabric at an evening event for a reason.',
    honest:
      'Two real drawbacks: it creases permanently, so it must be stored rolled, and the stiffness makes a bulky waist. Fewer, deeper pleats work better than many fine ones.',
    styling: 'Keep everything else simple. The fabric is the event.',
    services: ['fallPico', 'blouseStitching']
  }),

  saree({
    id: 'riya-organza-embroidered',
    name: 'Riya Embroidered Organza Saree',
    fabric: 'organza',
    fabricLabel: 'Organza with thread embroidery',
    composition: '100% polyester organza with viscose thread work',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['wedding-guest', 'party', 'festive'],
    price: 19800,
    colour: { name: 'Pistachio with ivory thread', family: 'green', hex: '#C3CFA4' },
    colours: [
      { slug: 'pistachio', name: 'Pistachio', hex: '#C3CFA4', stock: 'in-stock' },
      { slug: 'powder', name: 'Powder blue', hex: '#B6C6D8', stock: 'in-stock' },
      { slug: 'ivory', name: 'Ivory on ivory', hex: '#F0E7D6', stock: 'low-stock' }
    ],
    attributes: {
      sheerness: 'Sheer — a petticoat is essential',
      texture: 'Crisp ground with dense raised embroidery across the border and pallu',
      weightGsm: 70,
      weightLabel: 'Light, around 340g',
      drapeDifficulty: 3
    },
    care: 'Dry clean only. Store rolled. The embroidery snags — keep it away from velcro and rings.',
    patternFamily: 'organza-embroidered',
    palette: ['#C3CFA4', '#D8E0C2', '#F1E9DA', '#9DAA7C', '#FAF7F2'],
    editorial: 'Embroidery dense at the border, thinning to nothing at the waist.',
    description:
      'The embroidery is graded: heavy along the border and across the pallu, scattering to bare organza by the time it reaches the waist. That keeps the weight where it helps the drape hang and keeps bulk away from where you pleat. A considered piece of design rather than a decorated rectangle.',
    honest: 'The polyester ground keeps the price down and makes it hardier than silk organza. It is slightly less soft as a result.',
    styling: 'An ivory raw silk blouse, or the pistachio matched exactly.',
    services: ['fallPico', 'blouseStitching']
  }),

  /* ------------------------------- Net ----------------------------- */
  saree({
    id: 'sitara-sequin-net',
    name: 'Sitara Sequin Net Saree',
    fabric: 'net',
    fabricLabel: 'Net with sequin embroidery',
    composition: '100% nylon net, resin sequins, viscose thread',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['party', 'wedding-guest'],
    price: 15200,
    colour: { name: 'Midnight with silver', family: 'blue', hex: '#20263C' },
    colours: [
      { slug: 'midnight', name: 'Midnight', hex: '#20263C', stock: 'in-stock' },
      { slug: 'champagne', name: 'Champagne', hex: '#CBB894', stock: 'in-stock' },
      { slug: 'black', name: 'Black on black', hex: '#1E1C1B', stock: 'in-stock' }
    ],
    attributes: {
      sheerness: 'Sheer mesh — lining or a full petticoat is essential',
      texture: 'Open mesh, densely covered in flat sequins. Slightly scratchy against bare skin.',
      weightGsm: 120,
      weightLabel: 'Medium, around 480g, most of it sequins',
      drapeDifficulty: 3
    },
    care: 'Dry clean only. Fold with tissue between the layers so the sequins do not abrade each other.',
    patternFamily: 'sequin',
    palette: ['#20263C', '#39415E', '#C6CBD6', '#E8E0D2', '#12162A'],
    editorial: 'Built for low light and camera flash.',
    description:
      'Flat sequins, laid in rows across an open net, catch light from every angle at once — which is exactly what you want at an evening reception and exactly what you do not want in bright daylight. The net itself weighs almost nothing; the weight you feel is the sequins.',
    honest:
      'Sequins on bare skin can scratch over a long evening. We line the pallu edge as standard, and would suggest a soft cotton petticoat rather than satin.',
    styling: 'A plain matte blouse. Anything shiny competes and both lose.',
    services: ['fallPico', 'blouseStitching']
  }),

  saree({
    id: 'priya-satin-silk',
    name: 'Priya Satin Silk Saree',
    fabric: 'silk-blend',
    fabricLabel: 'Satin-finish silk blend',
    composition: '70% silk, 30% viscose',
    weave: 'none',
    provenance: PROVENANCE.millDescribed,
    occasions: ['party', 'everyday'],
    price: 10800,
    colour: { name: 'Deep teal', family: 'blue', hex: '#1D4F58' },
    colours: [
      { slug: 'teal', name: 'Deep teal', hex: '#1D4F58', stock: 'in-stock' },
      { slug: 'claret', name: 'Claret', hex: '#69202E', stock: 'in-stock' },
      { slug: 'bronze', name: 'Bronze', hex: '#8A6A3C', stock: 'in-stock' },
      { slug: 'ink', name: 'Ink', hex: '#232A33', stock: 'out-of-stock' }
    ],
    attributes: {
      sheerness: 'Opaque',
      texture: 'High-shine satin face, matte reverse',
      weightGsm: 120,
      weightLabel: 'Light to medium, around 390g',
      drapeDifficulty: 3
    },
    care: 'Dry clean. Satin water-marks easily, so blot spills, never rub.',
    patternFamily: 'satin',
    palette: ['#1D4F58', '#2E7480', '#E8E0D2', '#0F3239', '#C9A26B'],
    editorial: 'A single deep colour, high shine, no pattern at all.',
    description:
      'Plain, shiny and saturated. Satin is a weave rather than a fibre — the threads float over each other to build that reflective face, with a matte reverse. Without pattern to carry it, everything depends on the colour and the fall, so we keep the palette to four deep tones.',
    honest: 'Satin shows every water mark and every pin hole. It is not a forgiving surface.',
    styling: 'Contrast texture at the blouse. Velvet is the obvious answer.',
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion']
  }),

  saree({
    id: 'nandini-patola-inspired',
    name: 'Nandini Patola-Inspired Silk Saree',
    fabric: 'silk',
    fabricLabel: 'Silk, digitally printed',
    composition: '100% silk',
    weave: 'patola',
    provenance: PROVENANCE.inspiredBy,
    occasions: ['wedding-guest', 'festive'],
    price: 26800,
    colour: { name: 'Crimson and ivory', family: 'red', hex: '#A8202C' },
    colours: [{ slug: 'crimson', name: 'Crimson and ivory', hex: '#A8202C', stock: 'out-of-stock' }],
    stock: 'out-of-stock',
    attributes: {
      sheerness: 'Opaque',
      texture: 'Smooth silk, printed rather than woven',
      weightGsm: 180,
      weightLabel: 'Medium, around 470g',
      drapeDifficulty: 3
    },
    care: 'Dry clean only.',
    patternFamily: 'patola',
    palette: ['#A8202C', '#C94A44', '#F1E9DA', '#C89A3C', '#6E1B2B'],
    editorial: 'A printed homage to Patan double ikat — and we will not pretend otherwise.',
    description:
      'This is a digital print on silk that takes its geometry from Patan patola. It is not a double ikat, it was not woven in Patan, and it costs a fraction of what a true patola costs — a real one is a year of two weavers’ work and runs into five figures. We stock this because the design is beautiful at this price, and we name it accurately so you know what you are buying.',
    honest:
      'Printed, not woven. The giveaway is the reverse: a true patola reads identically on both faces, and this does not.',
    styling: 'A plain crimson blouse, and let the geometry speak.',
    services: ['fallPico', 'blouseStitching']
  }),

  /* ------------------------- Ready to wear ------------------------- */
  saree({
    id: 'mira-rtw-georgette',
    name: 'Mira Ready-to-Wear Georgette Saree',
    fabric: 'georgette',
    fabricLabel: 'Georgette, pre-pleated and stitched',
    composition: '100% polyester georgette, cotton waistband lining',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['party', 'festive', 'wedding-guest'],
    price: 16800,
    colour: { name: 'Charcoal with silver border', family: 'black', hex: '#33302E' },
    colours: [
      { slug: 'charcoal', name: 'Charcoal', hex: '#33302E', stock: 'in-stock' },
      { slug: 'wine', name: 'Wine', hex: '#6B2233', stock: 'in-stock' },
      { slug: 'emerald', name: 'Emerald', hex: '#1F5A43', stock: 'low-stock' }
    ],
    readyToWear: true,
    isNew: true,
    petticoat: { included: true, required: false },
    blousePiece: { included: false, lengthCm: null, stitched: false },
    dimensions: { lengthM: null, widthCm: null },
    sizes: ['UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'UK 20'],
    sizeStock: { 'UK 8': 'in-stock', 'UK 10': 'in-stock', 'UK 12': 'in-stock', 'UK 14': 'in-stock', 'UK 16': 'low-stock', 'UK 18': 'in-stock', 'UK 20': 'out-of-stock' },
    attributes: {
      sheerness: 'Fully lined at the skirt',
      texture: 'Fine crepe with a matte finish',
      weightGsm: 80,
      weightLabel: 'Light, around 520g including the lining',
      drapeDifficulty: 1
    },
    care: 'Dry clean, or hand wash cold and hang to dry with the pleats pinched together. Cool iron only.',
    patternFamily: 'rtw-plain',
    palette: ['#33302E', '#54504C', '#C6CBD6', '#E8E0D2', '#1C1A19'],
    editorial: 'Step in, zip up, pin the pallu. About two minutes.',
    description:
      'The pleats are stitched permanently into a fitted waistband with a concealed side zip, and the pallu is pre-set to fall over the left shoulder at the right length. You put it on like a skirt. Nothing about how it looks says ready to wear — the pleats are deeper and more even than most people achieve by hand.',
    honest:
      'Because the waistband is fitted, size matters. Check the chart against your own waist and hip before ordering, and note that this comes without a blouse.',
    styling: 'Wear it with any fitted blouse or a plain crop top. A black polo neck in winter looks deliberate.',
    services: [],
    sizeGuideNote: 'Sized to the waist and hip measurements in the chart, with 4cm of ease built in. The skirt is 105cm from waistband to hem.'
  }),

  saree({
    id: 'veda-rtw-silk-blend',
    name: 'Veda Ready-to-Wear Silk-Blend Saree',
    fabric: 'silk-blend',
    fabricLabel: 'Silk blend, pre-pleated and stitched',
    composition: '60% silk, 40% viscose, cotton waistband lining',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['wedding-guest', 'bridal', 'festive'],
    price: 22500,
    colour: { name: 'Garnet with gold border', family: 'red', hex: '#7A1F2E' },
    colours: [
      { slug: 'garnet', name: 'Garnet', hex: '#7A1F2E', stock: 'in-stock' },
      { slug: 'midnight', name: 'Midnight blue', hex: '#20263C', stock: 'in-stock' },
      { slug: 'gold', name: 'Antique gold', hex: '#A8812C', stock: 'in-stock' }
    ],
    readyToWear: true,
    petticoat: { included: true, required: false },
    blousePiece: { included: true, lengthCm: 85, stitched: false },
    dimensions: { lengthM: null, widthCm: null },
    sizes: ['UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'UK 20', 'UK 22'],
    sizeStock: { 'UK 8': 'in-stock', 'UK 10': 'in-stock', 'UK 12': 'in-stock', 'UK 14': 'in-stock', 'UK 16': 'in-stock', 'UK 18': 'in-stock', 'UK 20': 'in-stock', 'UK 22': 'low-stock' },
    attributes: {
      sheerness: 'Fully lined at the skirt',
      texture: 'Soft with a low sheen, heavier than the georgette version',
      weightGsm: 160,
      weightLabel: 'Medium, around 740g including the lining',
      drapeDifficulty: 1
    },
    care: 'Dry clean only.',
    patternFamily: 'rtw-border',
    palette: ['#7A1F2E', '#9C3040', '#C89A3C', '#E3C878', '#4E1220'],
    editorial: 'The wedding option for anyone who does not want to spend the morning draping.',
    description:
      'A silk blend with real weight and a woven gold border, built as a ready-to-wear saree. It comes with an unstitched blouse piece cut from the same run, so you can have a matching blouse made. The pallu is longer than on the georgette version so it can be pinned in the traditional wide drape or left loose.',
    honest: 'Heavier than the georgette, and dry clean only. The blouse piece still needs stitching — add it below or use your own tailor.',
    styling: 'Have the blouse piece stitched with an elbow sleeve. It suits the weight of the fabric.',
    services: ['blouseStitching'],
    sizeGuideNote: 'Sized to the waist and hip measurements in the chart, with 4cm of ease. Skirt length 107cm from waistband to hem.'
  }),

  saree({
    id: 'anjali-rtw-chiffon',
    name: 'Anjali Ready-to-Wear Chiffon Saree',
    fabric: 'chiffon',
    fabricLabel: 'Chiffon, pre-pleated and stitched',
    composition: '100% polyester chiffon, polyester lining',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['festive', 'party'],
    price: 14800,
    colour: { name: 'Lilac', family: 'purple', hex: '#A896B8' },
    colours: [
      { slug: 'lilac', name: 'Lilac', hex: '#A896B8', stock: 'low-stock' },
      { slug: 'blush', name: 'Blush', hex: '#D9AFAD', stock: 'in-stock' }
    ],
    readyToWear: true,
    stock: 'low-stock',
    petticoat: { included: true, required: false },
    blousePiece: { included: false, lengthCm: null, stitched: false },
    dimensions: { lengthM: null, widthCm: null },
    sizes: ['UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18'],
    sizeStock: { 'UK 8': 'in-stock', 'UK 10': 'low-stock', 'UK 12': 'in-stock', 'UK 14': 'in-stock', 'UK 16': 'out-of-stock', 'UK 18': 'in-stock' },
    attributes: {
      sheerness: 'Fully lined at the skirt',
      texture: 'Very fine and cool, with a fluid fall',
      weightGsm: 50,
      weightLabel: 'Very light, around 430g including the lining',
      drapeDifficulty: 1
    },
    care: 'Hand wash cold, hang to dry with the pleats pinched. Cool iron only.',
    patternFamily: 'rtw-ombre',
    palette: ['#A896B8', '#C4B4D0', '#E8E0D2', '#8574A0', '#F6F1EA'],
    editorial: 'All the movement of chiffon, none of the draping.',
    description:
      'Chiffon is the most fluid fabric and the hardest to drape, which makes it the best possible candidate for pre-pleating. The pleats are stitched in so they cannot slip, and the pallu is set at a length that stays put. You get the movement without the twenty minutes of pinning.',
    honest: 'Low stock, and two sizes are already gone. Blouse not included.',
    styling: 'A fitted silver or pewter blouse. Lilac wants a cool metal, not gold.',
    services: [],
    sizeGuideNote: 'Sized to the waist and hip measurements in the chart, with 4cm of ease. Skirt length 104cm from waistband to hem.'
  }),

  /* ------------------------- Essentials ---------------------------- */
  {
    id: 'blouse-cotton-silk-elbow',
    type: 'blouse',
    name: 'Stitched Blouse, Elbow Sleeve, Cotton Silk',
    fabric: 'silk-blend',
    fabricLabel: 'Cotton silk',
    composition: '55% cotton, 45% silk. Fully lined in cotton.',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['everyday', 'festive', 'wedding-guest', 'party'],
    price: 4800,
    colour: { name: 'Ink black', family: 'black', hex: '#232120' },
    colours: [
      { slug: 'black', name: 'Ink black', hex: '#232120', stock: 'in-stock' },
      { slug: 'ivory', name: 'Ivory', hex: '#F0E7D6', stock: 'in-stock' },
      { slug: 'burgundy', name: 'Burgundy', hex: '#6E1B2B', stock: 'in-stock' },
      { slug: 'gold', name: 'Antique gold', hex: '#A8812C', stock: 'low-stock' },
      { slug: 'teal', name: 'Deep teal', hex: '#1D4F58', stock: 'out-of-stock' }
    ],
    readyToWear: true,
    stock: 'in-stock',
    isNew: false,
    sizes: ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'UK 20', 'UK 22'],
    sizeStock: { 'UK 6': 'in-stock', 'UK 8': 'in-stock', 'UK 10': 'in-stock', 'UK 12': 'in-stock', 'UK 14': 'in-stock', 'UK 16': 'in-stock', 'UK 18': 'in-stock', 'UK 20': 'low-stock', 'UK 22': 'in-stock' },
    blousePiece: { included: false, lengthCm: null, stitched: true },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: {
      sheerness: 'Fully lined',
      texture: 'Smooth with a low sheen',
      weightGsm: 150,
      weightLabel: 'Around 180g',
      drapeDifficulty: null
    },
    care: 'Hand wash cold or dry clean. Warm iron.',
    origin: 'India',
    lining: 'Cotton lined',
    services: [],
    patternFamily: 'blouse',
    palette: ['#232120', '#4A4442', '#C89A3C', '#E8E0D2', '#1C1A19'],
    editorial: 'Round neck, elbow sleeve, princess seams. The blouse that goes with everything.',
    description:
      'A ready-stitched blouse in a cotton silk that holds its shape without being stiff. Princess seams through the front give shape without darts, the back fastens with concealed hooks, and there is 3cm of seam allowance inside both side seams so a tailor can let it out.',
    honest: 'Sized to the body measurements in the chart. If you are between sizes, take the larger — there is allowance to take it in but not to let it out beyond 3cm.',
    styling: 'Black and ivory cover most of what you own. Buy both.',
    included: ['One stitched, lined blouse in the size and colour you select'],
    excluded: ['Alterations. There is 3cm of seam allowance inside for your own tailor.'],
    sizeGuideNote: 'Sized to the body measurements in the chart with 5cm of wearing ease at the bust.'
  },

  {
    id: 'blouse-raw-silk-sleeveless',
    type: 'blouse',
    name: 'Stitched Blouse, Sleeveless, Raw Silk',
    fabric: 'silk',
    fabricLabel: 'Raw silk',
    composition: '100% raw silk. Fully lined in cotton.',
    weave: 'none',
    provenance: PROVENANCE.millDescribed,
    occasions: ['festive', 'wedding-guest', 'party'],
    price: 5400,
    colour: { name: 'Antique gold', family: 'yellow', hex: '#A8812C' },
    colours: [
      { slug: 'gold', name: 'Antique gold', hex: '#A8812C', stock: 'in-stock' },
      { slug: 'oxblood', name: 'Oxblood', hex: '#5E1F26', stock: 'in-stock' },
      { slug: 'emerald', name: 'Emerald', hex: '#1F5A43', stock: 'in-stock' },
      { slug: 'pewter', name: 'Pewter', hex: '#8A8C90', stock: 'in-stock' }
    ],
    readyToWear: true,
    stock: 'in-stock',
    isNew: true,
    sizes: ['UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'UK 20'],
    sizeStock: { 'UK 8': 'in-stock', 'UK 10': 'in-stock', 'UK 12': 'low-stock', 'UK 14': 'in-stock', 'UK 16': 'in-stock', 'UK 18': 'in-stock', 'UK 20': 'in-stock' },
    blousePiece: { included: false, lengthCm: null, stitched: true },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: {
      sheerness: 'Fully lined',
      texture: 'Dry, slubbed and matte with a crisp hand',
      weightGsm: 200,
      weightLabel: 'Around 190g',
      drapeDifficulty: null
    },
    care: 'Dry clean only.',
    origin: 'India',
    lining: 'Cotton lined',
    services: [],
    patternFamily: 'blouse-silk',
    palette: ['#A8812C', '#C9A24B', '#E8E0D2', '#7A5B18', '#FAF7F2'],
    editorial: 'A structured sleeveless blouse with a boat neck, in raw silk that holds a line.',
    description:
      'Raw silk is stiff enough to give a sleeveless blouse real structure, so the armhole and neckline stay where they were cut. The boat neck sits wide and high, which balances a heavy saree pallu. Concealed back hooks and a lined body.',
    honest: 'Raw silk creases across the front if you sit for a long time. It hangs out overnight.',
    styling: 'Wear the gold with anything ivory, cream or deep green.',
    included: ['One stitched, lined blouse in the size and colour you select'],
    excluded: ['Alterations. There is 3cm of seam allowance inside for your own tailor.'],
    sizeGuideNote: 'Sized to the body measurements in the chart with 4cm of wearing ease at the bust. Raw silk has no stretch.'
  },

  {
    id: 'petticoat-cotton',
    type: 'petticoat',
    name: 'Cotton Saree Petticoat',
    fabric: 'cotton',
    fabricLabel: 'Cotton',
    composition: '100% cotton with an elasticated and drawstring waist',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['everyday', 'festive', 'wedding-guest', 'party', 'bridal'],
    price: 2200,
    colour: { name: 'Ivory', family: 'white', hex: '#F1EBE2' },
    colours: [
      { slug: 'ivory', name: 'Ivory', hex: '#F1EBE2', stock: 'in-stock' },
      { slug: 'black', name: 'Black', hex: '#232120', stock: 'in-stock' },
      { slug: 'maroon', name: 'Maroon', hex: '#6A2027', stock: 'in-stock' },
      { slug: 'navy', name: 'Navy', hex: '#20263C', stock: 'in-stock' },
      { slug: 'grey', name: 'Grey', hex: '#A8A49C', stock: 'in-stock' }
    ],
    readyToWear: true,
    stock: 'in-stock',
    sizes: ['UK 6-8', 'UK 10-12', 'UK 14-16', 'UK 18-20', 'UK 22-24'],
    sizeStock: { 'UK 6-8': 'in-stock', 'UK 10-12': 'in-stock', 'UK 14-16': 'in-stock', 'UK 18-20': 'in-stock', 'UK 22-24': 'in-stock' },
    blousePiece: { included: false, lengthCm: null, stitched: false },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Soft matte cotton',
      weightGsm: 140,
      weightLabel: 'Around 260g',
      drapeDifficulty: null
    },
    care: 'Machine wash at 40°C. Warm iron.',
    origin: 'India',
    lining: 'Unlined',
    services: [],
    patternFamily: 'petticoat',
    palette: ['#F1EBE2', '#E0D8CB', '#C9BFA8', '#FAF7F2', '#B5AB99'],
    editorial: 'The layer that makes everything else work. A-line, cotton, 105cm long.',
    description:
      'A petticoat does two jobs: it stops a sheer saree being see-through, and it gives the pleats something to grip. This one is A-line so it does not restrict your stride, cut 105cm from waist to hem, with both elastic and a drawstring so you can set the waist exactly where you want the saree to sit.',
    honest: 'Cotton grips better than satin, which is what you want for a slippery saree. Buy it in a colour close to the saree.',
    styling: 'Ivory under pale sarees, black under dark ones, and a deliberate contrast under anything sheer.',
    included: ['One A-line cotton petticoat, 105cm long, in the size and colour you select'],
    excluded: ['Hemming. If you need it shorter than 105cm, any tailor can take it up.'],
    sizeGuideNote: 'Elastic and drawstring waist, so each size covers a range. Length is 105cm in every size.'
  },

  {
    id: 'petticoat-satin',
    type: 'petticoat',
    name: 'Satin Saree Petticoat',
    fabric: 'silk-blend',
    fabricLabel: 'Satin',
    composition: '100% polyester satin with a drawstring waist',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['festive', 'wedding-guest', 'party', 'bridal'],
    price: 2600,
    colour: { name: 'Champagne', family: 'neutral', hex: '#D9C9AC' },
    colours: [
      { slug: 'champagne', name: 'Champagne', hex: '#D9C9AC', stock: 'in-stock' },
      { slug: 'black', name: 'Black', hex: '#232120', stock: 'in-stock' },
      { slug: 'wine', name: 'Wine', hex: '#6B2233', stock: 'low-stock' }
    ],
    readyToWear: true,
    stock: 'in-stock',
    sizes: ['UK 6-8', 'UK 10-12', 'UK 14-16', 'UK 18-20'],
    sizeStock: { 'UK 6-8': 'in-stock', 'UK 10-12': 'in-stock', 'UK 14-16': 'in-stock', 'UK 18-20': 'low-stock' },
    blousePiece: { included: false, lengthCm: null, stitched: false },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Slippery with a high shine',
      weightGsm: 90,
      weightLabel: 'Around 200g',
      drapeDifficulty: null
    },
    care: 'Hand wash cold. Cool iron.',
    origin: 'India',
    lining: 'Unlined',
    services: [],
    patternFamily: 'petticoat-satin',
    palette: ['#D9C9AC', '#E8DCC4', '#B5A183', '#FAF7F2', '#8A7A5C'],
    editorial: 'For heavy silks, where you want the saree to slide rather than grip.',
    description:
      'Satin does the opposite of cotton: it lets the saree move over it. With a heavy Kanjivaram or Paithani that is exactly right, because the weight of the silk holds the pleats and you want the fabric to fall rather than catch.',
    honest: 'Do not use satin under chiffon or a light georgette. Two slippery layers and nothing will stay put.',
    styling: 'Champagne under gold and ivory sarees, black under everything dark.',
    included: ['One A-line satin petticoat, 105cm long, in the size and colour you select'],
    excluded: ['Hemming.'],
    sizeGuideNote: 'Drawstring waist. Length is 105cm in every size.'
  },

  {
    id: 'saree-shapewear',
    type: 'accessory',
    name: 'Saree Shapewear Petticoat',
    fabric: 'silk-blend',
    fabricLabel: 'Stretch jersey',
    composition: '92% nylon, 8% elastane',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['festive', 'wedding-guest', 'party', 'bridal'],
    price: 3400,
    colour: { name: 'Nude', family: 'neutral', hex: '#C9A88E' },
    colours: [
      { slug: 'nude', name: 'Nude', hex: '#C9A88E', stock: 'in-stock' },
      { slug: 'brown', name: 'Deep brown', hex: '#6B4A38', stock: 'in-stock' },
      { slug: 'black', name: 'Black', hex: '#232120', stock: 'in-stock' }
    ],
    readyToWear: true,
    stock: 'in-stock',
    sizes: ['UK 6-8', 'UK 10-12', 'UK 14-16', 'UK 18-20', 'UK 22-24'],
    sizeStock: { 'UK 6-8': 'in-stock', 'UK 10-12': 'in-stock', 'UK 14-16': 'in-stock', 'UK 18-20': 'in-stock', 'UK 22-24': 'in-stock' },
    blousePiece: { included: false, lengthCm: null, stitched: false },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: {
      sheerness: 'Opaque',
      texture: 'Smooth four-way stretch',
      weightGsm: 200,
      weightLabel: 'Around 210g',
      drapeDifficulty: null
    },
    care: 'Hand wash cold. Do not tumble dry or iron.',
    origin: 'India',
    lining: 'Unlined',
    services: [],
    patternFamily: 'shapewear',
    palette: ['#C9A88E', '#DCC0A8', '#8A6A52', '#F1EBE2', '#6B4A38'],
    editorial: 'A stretch petticoat that replaces both petticoat and shapewear.',
    description:
      'A fitted stretch petticoat with a wide waistband, mermaid-cut so it follows the leg and then flares below the knee. It removes the bulk of a drawstring at the waist, which matters if your saree is heavy or your blouse is short.',
    honest: 'Fitted through the thigh. It is comfortable but it is not loose, and it does not suit a very full traditional pleat count.',
    styling: 'Nude and deep brown both disappear under a sheer saree better than white does.',
    included: ['One stretch shapewear petticoat in the size and colour you select'],
    excluded: [],
    sizeGuideNote: 'Four-way stretch, so each size covers a range. Sized to the hip measurements in the chart.'
  },

  {
    id: 'saree-pins-set',
    type: 'accessory',
    name: 'Saree Pin Set',
    fabric: 'none',
    fabricLabel: 'Stainless steel and brass',
    composition: 'Nickel-free stainless steel and plated brass',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['everyday', 'festive', 'wedding-guest', 'party', 'bridal'],
    price: 900,
    colour: { name: 'Mixed silver and gold', family: 'multi', hex: '#C9BFA8' },
    colours: [{ slug: 'mixed', name: 'Mixed silver and gold', hex: '#C9BFA8', stock: 'in-stock' }],
    readyToWear: true,
    stock: 'in-stock',
    sizes: null,
    blousePiece: { included: false, lengthCm: null, stitched: false },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: {
      sheerness: null,
      texture: null,
      weightGsm: null,
      weightLabel: 'Around 40g',
      drapeDifficulty: null
    },
    care: 'Keep dry. Store in the tin.',
    origin: 'India',
    lining: null,
    services: [],
    patternFamily: 'pins',
    palette: ['#C9BFA8', '#E0D8CB', '#A8812C', '#8A8C90', '#FAF7F2'],
    editorial: 'Twelve pins that will not snag silk, in a tin that fits a clutch.',
    description:
      'Six fine safety pins for pleats, four flat-back brooch pins for the pallu at the shoulder, and two long pins for the waist. Every point is polished, because a rough pin point is how sarees get damaged. Nickel-free, so they are fine against skin.',
    honest: 'Pins do not grip organza or net reliably. For those, use the flat-back brooch pins through the blouse seam, not the fabric.',
    styling: 'Keep the tin in whatever bag you take to events and you will never be caught out.',
    included: ['Twelve pins in a lidded tin: six fine safety pins, four flat-back brooch pins, two long waist pins'],
    excluded: [],
    sizeGuideNote: null
  },

  {
    id: 'muslin-storage-bags',
    type: 'care',
    name: 'Muslin Saree Storage Bags, Set of Three',
    fabric: 'cotton',
    fabricLabel: 'Unbleached cotton muslin',
    composition: '100% unbleached cotton muslin',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['everyday'],
    price: 1800,
    colour: { name: 'Natural', family: 'neutral', hex: '#E0D5C0' },
    colours: [{ slug: 'natural', name: 'Natural', hex: '#E0D5C0', stock: 'in-stock' }],
    readyToWear: true,
    stock: 'in-stock',
    sizes: null,
    blousePiece: { included: false, lengthCm: null, stitched: false },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: { sheerness: null, texture: 'Soft, breathable, unbleached', weightGsm: null, weightLabel: 'Around 120g the set', drapeDifficulty: null },
    care: 'Machine washable at 40°C.',
    origin: 'India',
    lining: null,
    services: [],
    patternFamily: 'muslin',
    palette: ['#E0D5C0', '#F1EBE2', '#C9BFA8', '#FAF7F2', '#B5AB99'],
    editorial: 'Silk needs to breathe. Plastic is how sarees yellow.',
    description:
      'Three drawstring muslin bags, each large enough for one folded saree. Unbleached cotton lets moisture move in and out, which is what keeps silk from yellowing and zari from tarnishing. A plastic cover traps damp against the fabric and does the opposite.',
    honest: 'Muslin does not protect against moths. If that is a concern, add cedar or dried neem to the wardrobe, not to the bag.',
    styling: null,
    included: ['Three drawstring muslin storage bags, 45cm by 35cm'],
    excluded: [],
    sizeGuideNote: null
  },

  {
    id: 'delicate-fabric-wash',
    type: 'care',
    name: 'Delicate Fabric Wash, 250ml',
    fabric: 'none',
    fabricLabel: 'pH-neutral liquid detergent',
    composition: 'pH-neutral plant-derived surfactants, no optical brighteners, no enzymes',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['everyday'],
    price: 1200,
    colour: { name: 'Unscented', family: 'neutral', hex: '#E8E0D2' },
    colours: [{ slug: 'unscented', name: 'Unscented', hex: '#E8E0D2', stock: 'in-stock' }],
    readyToWear: true,
    stock: 'low-stock',
    sizes: null,
    blousePiece: { included: false, lengthCm: null, stitched: false },
    petticoat: { included: false, required: false },
    dimensions: { lengthM: null, widthCm: null },
    attributes: { sheerness: null, texture: null, weightGsm: null, weightLabel: '250ml', drapeDifficulty: null },
    care: 'Store below 25°C, out of reach of children.',
    origin: 'United Kingdom',
    lining: null,
    services: [],
    patternFamily: 'wash',
    palette: ['#E8E0D2', '#F1EBE2', '#C9BFA8', '#FAF7F2', '#B5AB99'],
    editorial: 'No enzymes, no brighteners. Safe for cotton, linen and hand-washable silk blends.',
    description:
      'Standard laundry detergent contains enzymes that digest protein, and silk and wool are protein fibres — which is why an ordinary wash dulls a silk saree. This is pH-neutral with no enzymes and no optical brighteners, so it cleans without eating the fibre or shifting the colour. One capful in four litres of cold water.',
    honest:
      'This does not make a dry-clean-only saree washable. Check the care line on the product page first — if it says dry clean only, that is because water will mark it, not because we are being cautious.',
    styling: null,
    included: ['One 250ml bottle of pH-neutral delicate wash, roughly 20 hand washes'],
    excluded: [],
    sizeGuideNote: null
  }

];

const inventoryProducts = inventoryRecords.map((item) => {
  const palette = [item.colourHex, '#E7D8BA', '#C89A3C', '#6B4A38', '#F7F3EB'];
  return saree({
    id: item.id,
    inventoryId: item.sku,
    name: item.name,
    fabric: 'silk-blend',
    fabricLabel: 'Catalogued saree — fibre content to be confirmed',
    composition: 'Fibre content pending supplier confirmation',
    weave: 'none',
    provenance: PROVENANCE.contemporary,
    occasions: ['festive', 'wedding-guest', 'party'],
    price: item.price,
    colour: { name: item.colourName, family: item.colourFamily, hex: item.colourHex },
    colours: [{ slug: 'catalogued', name: item.colourName, hex: item.colourHex, stock: 'in-stock' }],
    stock: 'in-stock',
    isNew: item.isNew,
    blousePiece: { included: false, lengthCm: null, stitched: false },
    attributes: {
      sheerness: 'Not yet assessed',
      texture: `${item.pattern} with ${item.border}`,
      weightGsm: 250,
      weightLabel: 'Weight not yet recorded',
      drapeDifficulty: 3
    },
    care: 'Care instructions are pending supplier confirmation. Dry clean until confirmed.',
    patternFamily: 'plain-border',
    palette,
    editorial: `${item.colourName} with ${item.pattern} and ${item.border}. Inventory ${item.sku}.`,
    description: item.description,
    honest: 'These photographs show the actual catalogued item. Fibre content, measurements and provenance still need supplier confirmation.',
    styling: `Pair with a blouse that picks up the ${item.colourName.toLowerCase()} palette or the border tone.`,
    services: ['fallPico', 'blouseStitching', 'readyToWearConversion'],
    images: item.images,
    sourceFiles: item.sourceFiles
  });
});

export const products = [...inventoryProducts, ...sampleProducts.filter((product) => product.type !== 'saree')];

/* ---------------------------- Derived ----------------------------- */

export const productById = Object.fromEntries(products.map((p) => [p.id, p]));

export const sarees = products.filter((p) => p.type === 'saree');
export const essentials = products.filter((p) => p.type !== 'saree');

/* Curated homepage selection, chosen by hand rather than by algorithm. */
export const homepageEdit = inventoryProducts.slice(0, 6);

/* Sarees we are comfortable recommending to somebody who has never
 * worn one: light, grippy, and forgiving of imperfect pleating. */
export const firstSareePicks = inventoryProducts.slice(6, 10);

/* Real inventory photographs used outside product cards. Keeping the
 * selection here means the homepage and occasion landing page cannot
 * drift back to the retired reference-photo library. */
export const occasionImagePicks = {
  'wedding-guest': productById['ss-0146'],
  bridal: productById['ss-0142'],
  festive: productById['ss-0207'],
  party: productById['ss-0180'],
  everyday: productById['ss-0188']
};

export const homepageEditorialPicks = {
  hero: productById['ss-0203'],
  readyToWear: productById['ss-0144'],
  craft: productById['ss-0157']
};

export const collections = {
  'new-arrivals': {
    title: 'New Arrivals',
    strapline: 'The most recent pieces to reach the Leicester studio.',
    intro:
      'Sorted with the newest first. Everything here is in stock or made to order — the delivery estimate on each product page is the one that applies to you.',
    filter: (p) => p.isNew
  },
  sarees: {
    title: 'Shop Sarees',
    strapline: 'Every saree we stock, from handloom cotton to bridal silk.',
    intro:
      'Filter by fabric if you know how you want it to feel, by occasion if you know where you are wearing it, or by weave if you are looking for a specific tradition. Every term is explained where it appears.',
    filter: (p) => p.type === 'saree'
  },
  'ready-to-wear': {
    title: 'Ready to Wear',
    strapline: 'Pre-pleated and stitched. Step in, fasten, done.',
    intro:
      'These sarees have the pleats stitched permanently into a fitted waistband with a concealed zip, so putting one on takes about two minutes and needs no draping practice. Because the waistband is fitted, check your waist and hip against the size chart before ordering.',
    filter: (p) => p.readyToWear && p.type === 'saree'
  },
  'blouses-essentials': {
    title: 'Blouses & Essentials',
    strapline: 'The pieces that make a saree work.',
    intro:
      'Stitched blouses in standard UK sizes, petticoats in cotton and satin, pins that will not snag, and the storage and washing that keeps a saree alive for decades.',
    filter: (p) => p.type !== 'saree'
  },
  'wedding-guest': {
    title: 'Wedding Guest Sarees',
    strapline: 'Dressed up, and deliberately not the bride.',
    intro:
      'Rich colour and some shine, in weights you can sit, eat and dance in across a long day. If you have a fixed date, filter to in-stock and check the delivery estimate on the product page before you order.',
    filter: (p) => p.occasions.includes('wedding-guest') && p.type === 'saree'
  },
  bridal: {
    title: 'Bridal Sarees',
    strapline: 'The heaviest weaves, made to keep.',
    intro:
      'Substantial silks in traditional bridal palettes. Several are made to order, which adds around two weeks before dispatch — start early, and consider ready-to-wear conversion if you would rather not spend the morning draping.',
    filter: (p) => p.occasions.includes('bridal') && p.type === 'saree'
  },
  festive: {
    title: 'Festive Sarees',
    strapline: 'For Diwali, Navratri, Eid, Pongal and everything at home.',
    intro: 'Colour and pattern that reads across a room, in weights you can wear all evening.',
    filter: (p) => p.occasions.includes('festive') && p.type === 'saree'
  },
  party: {
    title: 'Party Sarees',
    strapline: 'Evening events, receptions and dinners.',
    intro: 'Fluid fabrics, deeper tones, and finishes that catch low light and camera flash.',
    filter: (p) => p.occasions.includes('party') && p.type === 'saree'
  },
  everyday: {
    title: 'Everyday Sarees',
    strapline: 'Cotton and linen you can actually wear to work.',
    intro:
      'Breathable, mostly washable, and comfortable for a full day. These are also the easiest sarees to learn to drape, because cotton grips itself instead of sliding.',
    filter: (p) => p.occasions.includes('everyday') && p.type === 'saree'
  },
  occasion: {
    title: 'Shop by Occasion',
    strapline: 'Start from where you are wearing it.',
    intro: 'Pick the occasion and we will narrow the fabrics, weights and colours to the ones that suit it.',
    filter: (p) => p.type === 'saree'
  }
};
