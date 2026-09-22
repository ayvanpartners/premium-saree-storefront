/* ------------------------------------------------------------------ *
 * Shared vocabulary: fabrics, weaves, occasions, colour families,
 * stock states and size charts.
 *
 * Every term carries a plain-English `plain` line. The UI shows that
 * line wherever the term appears in a filter, a facet or a spec table,
 * so a first-time buyer never meets an unexplained word.
 * ------------------------------------------------------------------ */

export const fabrics = [
  {
    id: 'art-silk',
    label: 'Art silk',
    plain: 'A lustrous woven fabric with the look of silk. For this supplier catalogue the classification is visual until fibre content is confirmed.',
    wearNote: 'Usually light, affordable and suitable for colourful festive dressing.',
    ease: 'Visual assessment — exact composition to be confirmed.'
  },
  {
    id: 'silk',
    label: 'Silk',
    plain: 'Lustrous and smooth with a natural sheen. Holds a sharp pleat and has weight, so it stays where you put it.',
    wearNote: 'Warmest of our fabrics. Best for cooler months and evening events.',
    ease: 'Structured — pleats behave, but the weight takes getting used to.'
  },
  {
    id: 'cotton',
    label: 'Cotton',
    plain: 'Matte, breathable and light. The easiest fabric to learn to drape because it grips itself instead of sliding.',
    wearNote: 'Comfortable all day and in warm rooms. Creases, which is part of the look.',
    ease: 'Easiest to drape.'
  },
  {
    id: 'chiffon',
    label: 'Chiffon',
    plain: 'Very light and semi-sheer with a fluid, liquid fall. Slips easily, so it needs pins and a petticoat.',
    wearNote: 'Cool to wear and packs small. Always needs a petticoat underneath.',
    ease: 'Slippery — use plenty of pins until you are practised.'
  },
  {
    id: 'georgette',
    label: 'Georgette',
    plain: 'A crinkled crepe weave. Light like chiffon but with more grip and a slight texture, so it is far more forgiving.',
    wearNote: 'Resists creasing, which makes it good for travel and long days.',
    ease: 'Forgiving — the best light fabric for a beginner.'
  },
  {
    id: 'organza',
    label: 'Organza',
    plain: 'Crisp, sheer and papery. Holds its own shape, so pleats stand away from the body sculpturally.',
    wearNote: 'Structured and eye-catching, but it creases and snags more than other fabrics.',
    ease: 'Stiff — pleats are easy to form but bulky at the waist.'
  },
  {
    id: 'linen',
    label: 'Linen',
    plain: 'Textured, matte and cool with a dry handle. Softens every time you wash it.',
    wearNote: 'Very breathable. Creases readily and is meant to.',
    ease: 'Easy to drape, slightly stiff at first.'
  },
  {
    id: 'net',
    label: 'Net',
    plain: 'An open mesh, usually embellished. Sheer by nature, so it is worn over a lining or with a full petticoat.',
    wearNote: 'Light but can scratch. Best with a soft lining.',
    ease: 'Moderate — light but the embellishment adds bulk.'
  },
  {
    id: 'silk-blend',
    label: 'Silk blend',
    plain: 'Silk mixed with another fibre to cut the weight and the price while keeping much of the sheen.',
    wearNote: 'Lighter than pure silk and usually easier to look after.',
    ease: 'Moderate.'
  },
  {
    id: 'silk-cotton',
    label: 'Silk–cotton',
    plain: 'A silk-look woven fabric with a drier, lighter handle associated with silk–cotton. For this supplier catalogue the classification is visual until fibre content is confirmed.',
    wearNote: 'Balances the sheen and structure of silk with a lighter, more breathable drape.',
    ease: 'Visual assessment — exact composition to be confirmed.'
  }
];

/* Weave and regional styles.
 *
 * `provenance` records how much we actually know, and is printed
 * verbatim on the product page. We never upgrade a mill description
 * into a handloom claim.
 *   'supplier-declared' — the weaver or supplier states it in writing
 *   'mill-described'    — described to us by the mill, unconfirmed
 *   'inspired-by'       — the design references a tradition; it is not
 *                         made in that tradition
 */
export const weaves = [
  {
    id: 'kanjivaram',
    label: 'Kanjivaram',
    region: 'Kanchipuram, Tamil Nadu',
    plain: 'A heavy silk where the body and the border are woven separately and then joined, which is why the border colour can be completely different.',
    marker: 'Look for the join line where border meets body.'
  },
  {
    id: 'banarasi',
    label: 'Banarasi',
    region: 'Varanasi, Uttar Pradesh',
    plain: 'Silk with dense raised brocade patterning, traditionally using metallic zari thread in Mughal-influenced floral motifs.',
    marker: 'Patterning sits proud of the surface and the reverse shows floats of thread.'
  },
  {
    id: 'chanderi',
    label: 'Chanderi',
    region: 'Chanderi, Madhya Pradesh',
    plain: 'A fine silk-cotton mix that is sheer and glossy but almost weightless, usually with small woven motifs scattered across it.',
    marker: 'Transparent when held up, with a faint glassy sheen.'
  },
  {
    id: 'jamdani',
    label: 'Jamdani',
    region: 'Bengal',
    plain: 'Motifs are added by hand on the loom as the cloth is woven, one supplementary thread at a time, so the pattern appears to float in the fabric.',
    marker: 'Motifs look the same on both sides with no long threads behind.'
  },
  {
    id: 'ikat',
    label: 'Ikat',
    region: 'Pochampally, Telangana',
    plain: 'The threads are tied and dyed before weaving, so the pattern has a soft blurred edge that no print can imitate.',
    marker: 'Feathered, slightly out-of-focus edges to every shape.'
  },
  {
    id: 'patola',
    label: 'Patola',
    region: 'Patan, Gujarat',
    plain: 'A double ikat where both the warp and the weft threads are tie-dyed, so the design reads identically on both faces.',
    marker: 'Reversible geometric patterning with no wrong side.'
  },
  {
    id: 'paithani',
    label: 'Paithani',
    region: 'Paithan, Maharashtra',
    plain: 'Silk with a tapestry-woven pallu, often a peacock or lotus, and a distinctive oblique interlocked border.',
    marker: 'The pallu design is woven in, not printed or embroidered.'
  },
  {
    id: 'maheshwari',
    label: 'Maheshwari',
    region: 'Maheshwar, Madhya Pradesh',
    plain: 'A light silk-cotton with a reversible striped or checked border, originally designed to be worn either way round.',
    marker: 'Border works on both faces.'
  },
  {
    id: 'kota-doria',
    label: 'Kota Doria',
    region: 'Kota, Rajasthan',
    plain: 'An open square-checked weave (the checks are called khat) that is exceptionally light and airy.',
    marker: 'A fine visible grid you can see daylight through.'
  },
  {
    id: 'bandhani',
    label: 'Bandhani',
    region: 'Kutch, Gujarat',
    plain: 'Thousands of tiny points are tied off with thread before dyeing, leaving a field of small dots.',
    marker: 'Dots are slightly irregular, and the fabric holds a puckered memory of the ties.'
  },
  {
    id: 'block-print',
    label: 'Hand block print',
    region: 'Rajasthan',
    plain: 'Carved wooden blocks are inked and stamped across the cloth by hand, one colour and one block at a time.',
    marker: 'Small overlaps and gaps where blocks meet — the signature of a hand, not a machine.'
  },
  {
    id: 'sambalpuri',
    label: 'Sambalpuri',
    region: 'Sambalpur, Odisha',
    plain: 'An Odisha ikat tradition using tie-dyed threads, typically with shankha, chakra and flower motifs.',
    marker: 'Blurred-edge motifs in a strong, high-contrast palette.'
  },
  {
    id: 'tussar',
    label: 'Tussar silk',
    region: 'Jharkhand and Bihar',
    plain: 'A wild silk with a deeper gold tone and a coarser, drier texture than cultivated mulberry silk.',
    marker: 'Visible slubs — small thicker sections in the thread.'
  },
  {
    id: 'mysore-crepe',
    label: 'Mysore crepe',
    region: 'Karnataka',
    plain: 'Heavily twisted silk threads give a fine pebbled surface, a matte sheen and a very fluid fall.',
    marker: 'A soft sandy texture rather than a shine.'
  },
  {
    id: 'none',
    label: 'Contemporary, not a regional weave',
    region: null,
    plain: 'A modern design that does not belong to a named regional weaving tradition.',
    marker: null
  }
];

export const occasions = [
  {
    id: 'wedding-guest',
    label: 'Wedding guest',
    plain: 'Dressed up and celebratory, but deliberately not competing with the bride.',
    blurb: 'Rich colour and some shine, in a weight you can sit, eat and dance in for a long day.'
  },
  {
    id: 'bridal',
    label: 'Bridal',
    plain: 'The heaviest weaves and the fullest drapes, usually in traditional bridal reds, golds and jewel tones.',
    blurb: 'Substantial silks made to photograph well and to keep.'
  },
  {
    id: 'festive',
    label: 'Festive',
    plain: 'For Diwali, Navratri, Eid, Pongal, Onam and family celebrations at home or at the temple.',
    blurb: 'Colour and pattern that reads across a room, in weights you can wear all evening.'
  },
  {
    id: 'party',
    label: 'Party',
    plain: 'Evening events, receptions and dinners where you want impact without full traditional weight.',
    blurb: 'Fluid fabrics, deeper tones, and finishes that catch the light.'
  },
  {
    id: 'everyday',
    label: 'Everyday',
    plain: 'Lighter sarees with simpler weaves and borders for work, teaching or an informal day out.',
    blurb: 'Straightforward designs selected for comfortable, lower-key daywear.'
  }
];

export const colourFamilies = [
  { id: 'red', label: 'Red', hex: '#9E2A2B' },
  { id: 'pink', label: 'Pink', hex: '#C96480' },
  { id: 'orange', label: 'Orange and rust', hex: '#C2612F' },
  { id: 'yellow', label: 'Yellow and gold', hex: '#C89A3C' },
  { id: 'green', label: 'Green', hex: '#3E6B4F' },
  { id: 'blue', label: 'Blue', hex: '#2F4E7A' },
  { id: 'purple', label: 'Purple', hex: '#5C4173' },
  { id: 'neutral', label: 'Ivory, beige and brown', hex: '#B9A387' },
  { id: 'black', label: 'Black and charcoal', hex: '#2B2725' },
  { id: 'white', label: 'White and off-white', hex: '#F1EBE2' },
  { id: 'multi', label: 'Multicolour', hex: null }
];

export const stockStates = {
  'in-stock': {
    label: 'In stock',
    plain: 'In our Leicester studio now.',
    buyable: true,
    tone: 'ok'
  },
  'low-stock': {
    label: 'Low stock',
    plain: 'Fewer than five left. We are not holding any back.',
    buyable: true,
    tone: 'warn'
  },
  'made-to-order': {
    label: 'Made to order',
    plain: 'Woven for you after you order, which adds around two weeks before dispatch.',
    buyable: true,
    tone: 'info'
  },
  'out-of-stock': {
    label: 'Out of stock',
    plain: 'Not available at the moment.',
    buyable: false,
    tone: 'off'
  }
};

export const drapeDifficulty = {
  1: { label: 'Very easy', plain: 'Grips itself. Good for a first attempt with no help.' },
  2: { label: 'Easy', plain: 'Forgiving. A few pins and you are set.' },
  3: { label: 'Moderate', plain: 'Needs pins and a little practice, or fifteen minutes with our guide.' },
  4: { label: 'Takes practice', plain: 'Slippery or heavy. Most people want a hand the first time.' },
  5: { label: 'Advanced', plain: 'Heavy and long. Best draped with help, or order it ready to wear.' }
};

/* Size chart for ready-to-wear sarees and stitched blouses.
 * Body measurements, not garment measurements. Both units given
 * because UK customers use either.
 */
export const sizeChart = [
  { size: 'UK 6', bustCm: 79, waistCm: 61, hipCm: 86 },
  { size: 'UK 8', bustCm: 84, waistCm: 66, hipCm: 91 },
  { size: 'UK 10', bustCm: 89, waistCm: 71, hipCm: 96 },
  { size: 'UK 12', bustCm: 94, waistCm: 76, hipCm: 101 },
  { size: 'UK 14', bustCm: 99, waistCm: 81, hipCm: 106 },
  { size: 'UK 16', bustCm: 104, waistCm: 89, hipCm: 111 },
  { size: 'UK 18', bustCm: 112, waistCm: 97, hipCm: 119 },
  { size: 'UK 20', bustCm: 119, waistCm: 104, hipCm: 127 },
  { size: 'UK 22', bustCm: 127, waistCm: 112, hipCm: 135 }
].map((r) => ({
  ...r,
  bustIn: Math.round(r.bustCm / 2.54),
  waistIn: Math.round(r.waistCm / 2.54),
  hipIn: Math.round(r.hipCm / 2.54)
}));

export const blouseNecklines = [
  { id: 'round', label: 'Round neck', plain: 'A classic curved neckline, moderate depth front and back.' },
  { id: 'v', label: 'V neck', plain: 'A pointed neckline that lengthens the neck.' },
  { id: 'boat', label: 'Boat neck', plain: 'A wide, high neckline running towards the shoulders.' },
  { id: 'sweetheart', label: 'Sweetheart', plain: 'A shaped neckline that curves over the bust.' }
];

export const blouseSleeves = [
  { id: 'sleeveless', label: 'Sleeveless' },
  { id: 'cap', label: 'Cap sleeve', plain: 'Just covers the shoulder.' },
  { id: 'short', label: 'Short sleeve', plain: 'Ends mid upper arm.' },
  { id: 'elbow', label: 'Elbow sleeve', plain: 'Ends just above the elbow.' },
  { id: 'threequarter', label: 'Three-quarter sleeve', plain: 'Ends mid forearm.' },
  { id: 'full', label: 'Full sleeve', plain: 'Ends at the wrist.' }
];

/* Measurements we need for stitching, with validation bounds used by
 * both the product page and checkout. Bounds are deliberately wide;
 * they exist to catch unit mistakes and typos, not to judge bodies. */
export const measurementFields = [
  { id: 'bust', label: 'Bust', help: 'Around the fullest part, tape level and not pulled tight.', minCm: 60, maxCm: 160 },
  { id: 'underbust', label: 'Under bust', help: 'Directly under the bust, snug.', minCm: 50, maxCm: 150 },
  { id: 'waist', label: 'Waist', help: 'At your natural waist, the narrowest point.', minCm: 50, maxCm: 160 },
  { id: 'shoulder', label: 'Shoulder to shoulder', help: 'Across the back, from one shoulder bone to the other.', minCm: 28, maxCm: 55 },
  { id: 'blouseLength', label: 'Blouse length', help: 'From the shoulder seam to where you want the hem to sit.', minCm: 30, maxCm: 60 }
];

export const rtwMeasurementFields = [
  { id: 'waist', label: 'Waist', help: 'Where you want the saree waistband to sit.', minCm: 50, maxCm: 160 },
  { id: 'hip', label: 'Hip', help: 'Around the fullest part of the hip.', minCm: 60, maxCm: 170 },
  { id: 'sareeLength', label: 'Waist to floor', help: 'Measured barefoot, from your waistband to the floor. Add 2cm if you will wear heels.', minCm: 90, maxCm: 125 }
];

export const fabricById = Object.fromEntries(fabrics.map((f) => [f.id, f]));
export const weaveById = Object.fromEntries(weaves.map((w) => [w.id, w]));
export const occasionById = Object.fromEntries(occasions.map((o) => [o.id, o]));
export const colourFamilyById = Object.fromEntries(colourFamilies.map((c) => [c.id, c]));
