/* ------------------------------------------------------------------ *
 * Site-wide configuration: navigation, service, fulfilment, policies.
 *
 * SAMPLE CONTENT NOTICE
 * Every business fact in this file (address, lead times, carrier
 * timings, policies) is illustrative sample data created for this
 * demonstration. Nothing here has been verified against a real
 * business. Values that must be replaced before launch are grouped
 * under objects flagged `sample: true`, and the UI marks them.
 * ------------------------------------------------------------------ */

export const BRAND = '[BRAND NAME]';

export const site = {
  brand: BRAND,
  tagline: 'Handwoven and contemporary sarees, delivered across the United Kingdom.',
  locale: 'en-IN',
  currency: 'INR',
  sample: true,
  studio: {
    line1: 'Unit 4, Fairfield Works',
    line2: '118 Leicester Road',
    city: 'Leicester',
    postcode: 'LE4 5QX',
    country: 'United Kingdom'
  },
  contact: {
    email: 'hello@example.com',
    phone: '+442079460000',
    phoneDisplay: '020 7946 0000',
    hours: 'Monday to Friday, 9am to 5.30pm UK time',
    responseTime: 'We reply to email within one working day.'
  },
  vat: {
    registered: true,
    number: 'GB 000 0000 00',
    note: 'All prices include UK VAT at 20%.'
  },
  dispatch: {
    from: 'Leicester, United Kingdom',
    cutoffLabel: '2pm',
    workingDays: 'Monday to Friday, excluding UK bank holidays'
  }
};

/* Fulfilment model ------------------------------------------------- *
 * Delivery estimates everywhere on the site are computed from this
 * one model, so the product page, bag and checkout can never
 * disagree. Sample operational data.
 * ------------------------------------------------------------------ */
export const fulfilment = {
  sample: true,
  handling: {
    'in-stock': 1,
    'low-stock': 1,
    'made-to-order': 10,
    'out-of-stock': null
  },
  serviceLeadTime: {
    fallPico: 2,
    blouseStitching: 7,
    readyToWearConversion: 5
  },
  shipping: [
    {
      id: 'standard',
      label: 'Standard delivery',
      carrier: 'Royal Mail Tracked 48',
      minDays: 2,
      maxDays: 3,
      price: 395,
      freeOver: 15000,
      note: 'Tracked. No signature required.'
    },
    {
      id: 'express',
      label: 'Express delivery',
      carrier: 'Royal Mail Tracked 24',
      minDays: 1,
      maxDays: 2,
      price: 695,
      freeOver: null,
      note: 'Tracked, aims to arrive the next working day.'
    },
    {
      id: 'namedday',
      label: 'Named-day delivery',
      carrier: 'DPD Next Day',
      minDays: 1,
      maxDays: 1,
      price: 995,
      freeOver: null,
      note: 'Pick your date at checkout. One-hour arrival window by text.'
    }
  ],
  international: {
    enabled: true,
    regions: [
      { id: 'eu', label: 'European Union', minDays: 4, maxDays: 8, price: 1495 },
      { id: 'row', label: 'Rest of world', minDays: 6, maxDays: 12, price: 2495 }
    ],
    dutiesNote:
      'Orders delivered outside the United Kingdom may attract import duty, local sales tax and a customs handling fee. These are set by the destination country, are not included in our prices, and are paid by the recipient on delivery.'
  }
};

export const returnsPolicy = {
  sample: true,
  windowDays: 30,
  summary: 'Free UK returns within 30 days.',
  detail:
    'Send anything back within 30 days of delivery, unworn with tags attached, using our prepaid Royal Mail label. Refunds go to the original payment method within 5 working days of the parcel reaching us.',
  exclusions: [
    'Sarees that have had fall and pico stitching applied, because the fabric has been cut and sewn.',
    'Blouses stitched to your measurements.',
    'Ready-to-wear conversions made to your measurements.',
    'Pierced jewellery and unsealed cosmetics, on hygiene grounds.'
  ],
  faultyNote:
    'None of this affects your legal rights. If an item arrives faulty or not as described you can return it for a full refund, including any tailoring charge.'
};

/* Primary navigation ---------------------------------------------- */
export const nav = [
  { label: 'New Arrivals', href: '/collections/new-arrivals/', key: 'new-arrivals' },
  {
    label: 'Shop Sarees',
    href: '/collections/sarees/',
    key: 'sarees',
    panel: {
      columns: [
        {
          heading: 'By fabric',
          links: [
            { label: 'Art silk', href: '/collections/sarees/?fabric=art-silk', hint: 'Affordable, lustrous woven styles' },
            { label: 'Silk blend', href: '/collections/sarees/?fabric=silk-blend', hint: 'Sheen with a lighter drape' },
            { label: 'Silk–cotton', href: '/collections/sarees/?fabric=silk-cotton', hint: 'Lighter, drier and more breathable' },
            { label: 'Premium silk', href: '/collections/sarees/?fabric=silk', hint: 'Structured, substantial occasion sarees' }
          ]
        },
        {
          heading: 'By weave or style',
          links: [
            { label: 'Kanjivaram', href: '/collections/sarees/?weave=kanjivaram' },
            { label: 'Banarasi', href: '/collections/sarees/?weave=banarasi' },
            { label: 'Chanderi', href: '/collections/sarees/?weave=chanderi' },
            { label: 'Jamdani', href: '/collections/sarees/?weave=jamdani' },
            { label: 'Ikat', href: '/collections/sarees/?weave=ikat' },
            { label: 'Block print', href: '/collections/sarees/?weave=block-print' },
            { label: 'Every weave explained', href: '/saree-guide/weaves/', emphasis: true }
          ]
        },
        {
          heading: 'By price',
          links: [
            { label: 'Under ₹2,500', href: '/collections/sarees/?price=0-2500' },
            { label: '₹2,500 to ₹5,000', href: '/collections/sarees/?price=2500-5000' },
            { label: '₹5,000 to ₹10,000', href: '/collections/sarees/?price=5000-10000' },
            { label: '₹10,000 and above', href: '/collections/sarees/?price=10000-999999' }
          ]
        }
      ],
      feature: {
        heading: 'Buying your first saree?',
        body: 'Four questions, then a short list of light, forgiving sarees that are easy to drape.',
        cta: { label: 'Find your first saree', href: '/saree-guide/first-saree/' }
      }
    }
  },
  {
    label: 'Occasion',
    href: '/collections/occasion/',
    key: 'occasion',
    panel: {
      columns: [
        {
          heading: 'Occasion',
          links: [
            { label: 'Wedding guest', href: '/collections/wedding-guest/', hint: 'Dressed up, not the bride' },
            { label: 'Bridal', href: '/collections/bridal/', hint: 'Heavier weaves, full drapes' },
            { label: 'Festive', href: '/collections/festive/', hint: 'Diwali, Navratri, Eid, Pongal' },
            { label: 'Party', href: '/collections/party/', hint: 'Evenings and receptions' },
            { label: 'Everyday', href: '/collections/everyday/', hint: 'Simpler, lighter daywear designs' }
          ]
        },
        {
          heading: 'Shopping to a deadline',
          links: [
            { label: 'Quickest to arrive', href: '/collections/sarees/?stock=in-stock&sort=delivery', hint: 'In stock, dispatched next working day' },
            { label: 'How delivery timings work', href: '/delivery/' },
            { label: 'Named-day delivery', href: '/delivery/#named-day' }
          ]
        }
      ]
    }
  },
  {
    label: 'Ready to Wear',
    href: '/collections/ready-to-wear/',
    key: 'ready-to-wear',
    panel: {
      columns: [
        {
          heading: 'Ready to wear',
          links: [
            { label: 'All ready-to-wear sarees', href: '/collections/ready-to-wear/' },
            { label: 'How ready to wear works', href: '/saree-guide/ready-to-wear/' },
            { label: 'Measurement guide', href: '/saree-guide/measurements/' }
          ]
        }
      ],
      feature: {
        heading: 'Pre-pleated and stitched',
        body: 'Step in, fasten the zip, pin the pallu. About two minutes, no draping practice needed.',
        cta: { label: 'Shop ready to wear', href: '/collections/ready-to-wear/' }
      }
    }
  },
  {
    label: 'Blouses & Essentials',
    href: '/collections/blouses-essentials/',
    key: 'blouses-essentials',
    panel: {
      columns: [
        {
          heading: 'Essentials',
          links: [
            { label: 'Stitched blouses', href: '/collections/blouses-essentials/?type=blouse' },
            { label: 'Petticoats', href: '/collections/blouses-essentials/?type=petticoat' },
            { label: 'Pins and shapewear', href: '/collections/blouses-essentials/?type=accessory' },
            { label: 'Saree care', href: '/collections/blouses-essentials/?type=care' }
          ]
        },
        {
          heading: 'Services',
          links: [
            { label: 'Blouse stitching', href: '/saree-guide/tailoring/#blouse-stitching' },
            { label: 'Fall and pico', href: '/saree-guide/tailoring/#fall-and-pico' },
            { label: 'Ready-to-wear conversion', href: '/saree-guide/tailoring/#conversion' }
          ]
        }
      ]
    }
  },
  {
    label: 'Saree Guide',
    href: '/saree-guide/',
    key: 'saree-guide',
    panel: {
      columns: [
        {
          heading: 'Start here',
          links: [
            { label: 'Find your first saree', href: '/saree-guide/first-saree/' },
            { label: 'How to drape a saree', href: '/saree-guide/draping/' },
            { label: 'Anatomy of a saree', href: '/saree-guide/anatomy/' }
          ]
        },
        {
          heading: 'Understand the detail',
          links: [
            { label: 'Fabrics compared', href: '/saree-guide/fabrics/' },
            { label: 'Weaves and regional styles', href: '/saree-guide/weaves/' },
            { label: 'Blouses and tailoring', href: '/saree-guide/tailoring/' },
            { label: 'Measurements', href: '/saree-guide/measurements/' },
            { label: 'Caring for your saree', href: '/saree-guide/care/' },
            { label: 'Glossary', href: '/saree-guide/glossary/' }
          ]
        }
      ]
    }
  }
];

export const footer = [
  {
    heading: 'Customer service',
    links: [
      { label: 'Contact us', href: '/contact/' },
      { label: 'Delivery', href: '/delivery/' },
      { label: 'Returns and refunds', href: '/returns/' },
      { label: 'Track your order', href: '/track-order/' },
      { label: 'Measurement guide', href: '/saree-guide/measurements/' },
      { label: 'Common questions', href: '/contact/#faq' }
    ]
  },
  {
    heading: 'Learn',
    links: [
      { label: 'Saree guide', href: '/saree-guide/' },
      { label: 'How to drape', href: '/saree-guide/draping/' },
      { label: 'Fabrics compared', href: '/saree-guide/fabrics/' },
      { label: 'Weaves and regional styles', href: '/saree-guide/weaves/' },
      { label: 'Caring for your saree', href: '/saree-guide/care/' },
      { label: 'Glossary', href: '/saree-guide/glossary/' }
    ]
  },
  {
    heading: 'About',
    links: [
      { label: 'About ' + BRAND, href: '/about/' },
      { label: 'How we describe our sarees', href: '/about/#sourcing-language' },
      { label: 'Accessibility', href: '/accessibility/' },
      { label: 'Image credits', href: '/image-credits/' },
      { label: 'Demonstration notice', href: '/demo-notice/' }
    ]
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms and conditions', href: '/terms/' },
      { label: 'Privacy notice', href: '/privacy/' },
      { label: 'Cookies', href: '/cookies/' },
      { label: 'Delivery policy', href: '/delivery/' },
      { label: 'Returns policy', href: '/returns/' }
    ]
  }
];

/* Optional services ------------------------------------------------ *
 * Prices in whole Indian rupees. Never preselected anywhere in the UI.
 * ------------------------------------------------------------------ */
export const services = {
  fallPico: {
    id: 'fallPico',
    label: 'Fall and pico stitching',
    price: 1200,
    leadDays: fulfilment.serviceLeadTime.fallPico,
    requiresMeasurements: false,
    blurb:
      'A cotton tape (the fall) is sewn inside the bottom edge so the pleats hang straight, and the raw edges are finished with a narrow rolled hem (pico).',
    returnsImpact: 'Not returnable once stitched, because the fabric is cut and sewn.'
  },
  blouseStitching: {
    id: 'blouseStitching',
    label: 'Blouse stitched to your measurements',
    price: 3500,
    leadDays: fulfilment.serviceLeadTime.blouseStitching,
    requiresMeasurements: true,
    blurb:
      'We cut and stitch the included blouse piece to your measurements. You choose a neckline and sleeve length, and give us five measurements.',
    returnsImpact: 'Not returnable once stitched, unless the finished blouse does not match the measurements you gave us.'
  },
  readyToWearConversion: {
    id: 'readyToWearConversion',
    label: 'Convert to ready to wear',
    price: 4500,
    leadDays: fulfilment.serviceLeadTime.readyToWearConversion,
    requiresMeasurements: true,
    blurb:
      'We pre-pleat the saree, stitch it onto a fitted waistband with a concealed zip, and set the pallu so it stays in place. You step into it.',
    returnsImpact: 'Not returnable once converted, unless the finished garment does not match the measurements you gave us.'
  }
};

export const paymentMethods = [
  { id: 'card', label: 'Card', detail: 'Visa, Mastercard, American Express' },
  { id: 'paypal', label: 'PayPal', detail: 'Your PayPal balance or a saved card' },
  { id: 'applepay', label: 'Apple Pay', detail: 'Safari on Apple devices' },
  { id: 'googlepay', label: 'Google Pay', detail: 'Chrome with a saved card' },
  { id: 'klarna', label: 'Klarna', detail: 'Pay in 3 interest-free instalments' }
];

/* Service strip: factual, non-promissory statements only. */
export const serviceStrip = [
  { text: 'Free UK delivery over ₹15,000', href: '/delivery/' },
  { text: 'Dispatched from Leicester', href: '/delivery/#dispatch' },
  { text: 'Free 30-day UK returns', href: '/returns/' },
  { text: 'Stitching and fall & pico available', href: '/saree-guide/tailoring/' }
];
