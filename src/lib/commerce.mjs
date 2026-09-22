/* ------------------------------------------------------------------ *
 * Commerce logic: money, working-day arithmetic, delivery estimates,
 * bag totals, discount codes and measurement validation.
 *
 * This module is imported by the static build AND served to the
 * browser unchanged. That is deliberate: the delivery date printed on
 * a product page, recalculated when you add stitching, shown in the
 * bag and confirmed at checkout all come out of the same functions, so
 * they cannot drift apart.
 *
 * Browser-safe: no Node imports, no DOM access.
 * ------------------------------------------------------------------ */

export function formatMoney(rupees, { showFree = false } = {}) {
  if (rupees === 0 && showFree) return 'Free';
  const sign = rupees < 0 ? '−' : '';
  const grouped = Math.round(Math.abs(rupees)).toLocaleString('en-IN');
  return `${sign}₹${grouped}`;
}

/* UK bank holidays — SAMPLE DATA for England and Wales, covering the
 * dates this demonstration can reach. A live site should read these
 * from gov.uk's bank-holiday feed rather than hard-coding them. */
export const UK_BANK_HOLIDAYS = [
  '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25',
  '2026-08-31', '2026-12-25', '2026-12-28',
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31',
  '2027-08-30', '2027-12-27', '2027-12-28'
];

const holidaySet = new Set(UK_BANK_HOLIDAYS);

function isoDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isWorkingDay(d) {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  return !holidaySet.has(isoDay(d));
}

export function addWorkingDays(from, n) {
  const d = new Date(from.getTime());
  d.setHours(12, 0, 0, 0);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    if (isWorkingDay(d)) added++;
  }
  return d;
}

/* The first working day on which an order placed at `now` can leave
 * the studio, respecting the same-day cutoff. */
export function dispatchStart(now, cutoffHour = 14) {
  const d = new Date(now.getTime());
  const afterCutoff = d.getHours() >= cutoffHour;
  d.setHours(12, 0, 0, 0);
  if (afterCutoff) d.setDate(d.getDate() + 1);
  while (!isWorkingDay(d)) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Delivery estimate for one line or one product.
 *
 * Returns null when the item cannot ship at all, so callers are forced
 * to handle the out-of-stock case rather than printing a false date.
 */
export function estimateDelivery({
  stock = 'in-stock',
  serviceLeadDays = 0,
  shipping,
  now = new Date(),
  handling,
  cutoffHour = 14
}) {
  const handlingDays = handling[stock];
  if (handlingDays == null) return null;

  const start = dispatchStart(now, cutoffHour);
  const totalHandling = handlingDays + serviceLeadDays;
  // Handling day 1 is the dispatch day itself.
  const dispatch = totalHandling <= 1 ? start : addWorkingDays(start, totalHandling - 1);
  const earliest = addWorkingDays(dispatch, shipping.minDays);
  const latest = addWorkingDays(dispatch, shipping.maxDays);
  return { dispatch, earliest, latest, handlingDays: totalHandling, shipping };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatDate(d, { weekday = true, year = false } = {}) {
  const wd = weekday ? `${DAY_NAMES[d.getDay()]} ` : '';
  const y = year ? ` ${d.getFullYear()}` : '';
  return `${wd}${d.getDate()} ${MONTH_NAMES[d.getMonth()]}${y}`;
}

export function formatDateShort(d) {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

/** "Thursday 24 September to Friday 25 September", collapsed sensibly. */
export function formatWindow(earliest, latest) {
  if (isoDay(earliest) === isoDay(latest)) return formatDate(earliest);
  const sameMonth = earliest.getMonth() === latest.getMonth();
  if (sameMonth) {
    return `${DAY_NAMES[earliest.getDay()]} ${earliest.getDate()} to ${DAY_NAMES[latest.getDay()]} ${latest.getDate()} ${MONTH_NAMES[latest.getMonth()]}`;
  }
  return `${formatDate(earliest)} to ${formatDate(latest)}`;
}

/* ----------------------------- Bag maths --------------------------- */

/* Sample discount codes. A live build reads these from the commerce
 * platform; none of these represent a real offer. */
export const discountCodes = {
  WELCOME10: { type: 'percent', value: 10, label: '10% off your first order', minSpend: 0 },
  FREEPOST: { type: 'shipping', value: 0, label: 'Free standard delivery', minSpend: 5000 },
  DRAPE25: { type: 'fixed', value: 2500, label: '₹2,500 off orders over ₹20,000', minSpend: 20000 }
};

export function lineTotal(line) {
  const services = (line.services || []).reduce((sum, s) => sum + s.price, 0);
  return (line.price + services) * line.quantity;
}

export function bagTotals({ lines, shippingId, discountCode, shippingOptions, region = 'uk' }) {
  const itemsTotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const servicesTotal = lines.reduce(
    (sum, l) => sum + (l.services || []).reduce((s, sv) => s + sv.price, 0) * l.quantity,
    0
  );
  const option = shippingOptions.find((s) => s.id === shippingId) || shippingOptions[0];

  let discount = 0;
  let discountLabel = null;
  let discountError = null;
  const code = discountCode ? discountCodes[discountCode.toUpperCase()] : null;
  if (discountCode && !code) {
    discountError = `We do not recognise the code “${discountCode}”. Check for typos, or continue without it.`;
  } else if (code && itemsTotal < code.minSpend) {
    discountError = `“${discountCode.toUpperCase()}” needs a basket of ${formatMoney(code.minSpend)} or more. You are ${formatMoney(
      code.minSpend - itemsTotal
    )} away.`;
  } else if (code) {
    discountLabel = code.label;
    if (code.type === 'percent') discount = Math.round(itemsTotal * (code.value / 100));
    else if (code.type === 'fixed') discount = Math.min(code.value, itemsTotal);
  }

  let shippingCost = option.price;
  if (option.freeOver != null && itemsTotal - discount >= option.freeOver) shippingCost = 0;
  if (code && code.type === 'shipping' && option.id === 'standard' && !discountError) shippingCost = 0;

  const total = Math.max(0, itemsTotal - discount + shippingCost);
  // Prices are VAT-inclusive; this is the VAT contained within.
  const vat = Math.round(total - total / 1.2);

  return {
    itemsTotal,
    servicesTotal,
    discount,
    discountLabel,
    discountError,
    shippingCost,
    shippingOption: option,
    total,
    vat,
    freeShippingGap:
      option.freeOver != null && shippingCost > 0 ? option.freeOver - (itemsTotal - discount) : null
  };
}

/* ----------------------- Measurement validation ------------------- */

export function validateMeasurement(field, rawValue, unit = 'cm') {
  const value = String(rawValue ?? '').trim();
  if (value === '') return { ok: false, code: 'required', message: `Enter your ${field.label.toLowerCase()} measurement.` };
  const normalised = value.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalised)) {
    return {
      ok: false,
      code: 'format',
      message: `Enter ${field.label.toLowerCase()} as a number, for example ${unit === 'cm' ? '92' : '36'}. Leave out the unit.`
    };
  }
  const num = parseFloat(normalised);
  const cm = unit === 'in' ? num * 2.54 : num;
  if (cm < field.minCm) {
    return {
      ok: false,
      code: 'low',
      message:
        unit === 'cm'
          ? `${num}cm looks too small for ${field.label.toLowerCase()}. Did you measure in inches? ${num} inches is about ${Math.round(
              num * 2.54
            )}cm — switch the unit above and re-enter if so.`
          : `${num} inches looks too small for ${field.label.toLowerCase()}. Please check and re-enter.`
    };
  }
  if (cm > field.maxCm) {
    return {
      ok: false,
      code: 'high',
      message:
        unit === 'in'
          ? `${num} inches looks too large for ${field.label.toLowerCase()}. Did you measure in centimetres? Switch the unit above if so.`
          : `${num}cm looks too large for ${field.label.toLowerCase()}. Please check and re-enter, or email us and we will take it from there.`
    };
  }
  return { ok: true, cm: Math.round(cm * 10) / 10 };
}

/* ---------------------------- UK address -------------------------- */

const POSTCODE_RE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/i;

export function normalisePostcode(value) {
  const raw = String(value || '').toUpperCase().replace(/\s+/g, '');
  const m = raw.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  return m ? `${m[1]} ${m[2]}` : null;
}

export function validatePostcode(value) {
  const raw = String(value || '').trim();
  if (!raw) return { ok: false, message: 'Enter your postcode so we can find your address.' };
  const normalised = normalisePostcode(raw);
  if (!normalised) {
    return {
      ok: false,
      message: 'That does not look like a UK postcode. Try the format SW1A 1AA, or enter your address manually.'
    };
  }
  return { ok: true, value: normalised };
}

/* Sample postcode lookup results. A live build calls a real address
 * service (Loqate, Ideal Postcodes, getAddress.io). Any postcode not
 * listed here returns the `unknown` outcome, which the UI handles by
 * offering manual entry rather than blocking the customer. */
export const sampleAddressBook = {
  'LE4 5QX': [
    { line1: 'Unit 4, Fairfield Works', line2: '118 Leicester Road', city: 'Leicester' },
    { line1: 'Unit 5, Fairfield Works', line2: '118 Leicester Road', city: 'Leicester' },
    { line1: 'Unit 6, Fairfield Works', line2: '118 Leicester Road', city: 'Leicester' }
  ],
  'SW1A 1AA': [{ line1: 'Buckingham Palace', line2: '', city: 'London' }],
  'M1 1AE': [
    { line1: '1 Piccadilly Place', line2: 'Aytoun Street', city: 'Manchester' },
    { line1: '2 Piccadilly Place', line2: 'Aytoun Street', city: 'Manchester' }
  ],
  'B1 1TT': [
    { line1: '10 Brindleyplace', line2: '', city: 'Birmingham' },
    { line1: '11 Brindleyplace', line2: '', city: 'Birmingham' }
  ],
  'EH1 1YZ': [{ line1: '14 North Bridge', line2: '', city: 'Edinburgh' }],
  'CF10 1EP': [{ line1: '2 Central Square', line2: '', city: 'Cardiff' }],
  'HA0 4LP': [
    { line1: '42 Ealing Road', line2: '', city: 'Wembley' },
    { line1: '44 Ealing Road', line2: '', city: 'Wembley' },
    { line1: '46 Ealing Road', line2: '', city: 'Wembley' }
  ]
};

export function lookupPostcode(postcode) {
  const key = normalisePostcode(postcode);
  if (!key) return { status: 'invalid' };
  const hits = sampleAddressBook[key];
  if (!hits) return { status: 'unknown', postcode: key };
  return { status: 'found', postcode: key, addresses: hits };
}

/* --------------------------- Order numbers ------------------------ */

export function makeOrderNumber(seed = Date.now()) {
  const n = Math.abs(Math.floor(seed)) % 900000 + 100000;
  return `SR-${n}`;
}

/* Sample tracking states for the order-tracking page. */
export const trackingStages = [
  { id: 'placed', label: 'Order placed', detail: 'We have your order and payment.' },
  { id: 'preparing', label: 'Preparing your order', detail: 'Being checked, pressed and packed in Leicester.' },
  { id: 'tailoring', label: 'With our tailor', detail: 'Stitching in progress. Only appears when you have added a tailoring service.' },
  { id: 'dispatched', label: 'Dispatched', detail: 'Handed to the carrier with a tracking number.' },
  { id: 'out', label: 'Out for delivery', detail: 'On the van today.' },
  { id: 'delivered', label: 'Delivered', detail: 'Signed for or left as instructed.' }
];
