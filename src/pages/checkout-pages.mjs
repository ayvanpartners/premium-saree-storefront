import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { breadcrumb, notice, emptyState, sampleTag, productCard } from '../lib/components.mjs';
import { fulfilment, returnsPolicy, site, paymentMethods, BRAND } from '../data/site.mjs';
import { formatMoney, trackingStages } from '../lib/commerce.mjs';
import { firstSareePicks } from '../data/products.mjs';

function progress(current) {
  const steps = [
    { id: 'bag', label: 'Bag', href: '/bag/' },
    { id: 'details', label: 'Delivery details' },
    { id: 'payment', label: 'Payment' },
    { id: 'done', label: 'Confirmation' }
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return html`
    <nav aria-label="Checkout progress">
      <ol class="checkout-progress">
        ${steps.map((s, i) =>
          raw(`<li${i === idx ? ' aria-current="step"' : ''}${i < idx ? ' data-done="true"' : ''}>
            ${i < idx ? icon('check', { size: 14 }) : ''}
            ${s.href && i < idx ? `<a href="${url(s.href)}">${esc(s.label)}</a>` : esc(s.label)}
          </li>`)
        )}
      </ol>
    </nav>
  `;
}

/* ----------------------------- Checkout --------------------------- */
export function checkoutPage() {
  const body = html`
    <div class="container">
      ${raw(progress('details'))}

      <!-- Recovery banners. Hidden until something actually goes wrong. -->
      <div data-checkout-alerts class="stack-4 mb-5"></div>

      <div data-checkout-empty hidden>
        ${raw(
          emptyState({
            iconName: 'bagEmpty',
            title: 'There is nothing to check out',
            body: 'Your bag is empty, so there is nothing to pay for yet.',
            actions: [{ label: 'Shop sarees', href: '/collections/sarees/' }]
          })
        )}
      </div>

      <div data-checkout-main hidden>
        <div class="checkout-layout">
          <form data-checkout-form novalidate>
            <div class="split mb-5">
              <h1 class="h2">Checkout</h1>
              <p class="small muted">
                ${raw(icon('lock', { size: 13 }))} Demonstration only — no payment is taken and no
                order is placed.
              </p>
            </div>

            <!-- 1. Guest checkout, prominent and default. -->
            <section class="checkout-step" aria-labelledby="step-contact">
              <div class="checkout-step__head">
                <span class="checkout-step__num">1</span>
                <div>
                  <h2 id="step-contact">Your details</h2>
                  <p class="small muted mt-2">
                    You are checking out as a guest. No account needed — we will offer you one after
                    the order if you want it.
                  </p>
                </div>
              </div>

              <div class="field">
                <label class="field__label" for="email">Email address</label>
                <span class="field__hint" id="email-hint">
                  For your order confirmation and delivery updates. Nothing else unless you ask.
                </span>
                <input
                  class="input"
                  type="email"
                  id="email"
                  name="email"
                  autocomplete="email"
                  inputmode="email"
                  spellcheck="false"
                  required
                  aria-describedby="email-hint"
                  data-validate="email"
                />
                <p class="field__error" data-error-for="email" hidden></p>
              </div>

              <div class="field">
                <label class="field__label" for="phone">
                  Mobile number <span class="field__optional">(optional)</span>
                </label>
                <span class="field__hint" id="phone-hint">
                  Only used by the carrier for delivery texts. Needed for named-day delivery.
                </span>
                <input
                  class="input"
                  type="tel"
                  id="phone"
                  name="phone"
                  autocomplete="tel"
                  inputmode="tel"
                  aria-describedby="phone-hint"
                  data-validate="phone"
                />
                <p class="field__error" data-error-for="phone" hidden></p>
              </div>
            </section>

            <!-- 2. Delivery address, UK-first with postcode lookup. -->
            <section class="checkout-step" aria-labelledby="step-address">
              <div class="checkout-step__head">
                <span class="checkout-step__num">2</span>
                <div><h2 id="step-address">Delivery address</h2></div>
              </div>

              <div class="field">
                <label class="field__label" for="country">Country or region</label>
                <select class="select" id="country" name="country" autocomplete="country-name" data-country>
                  <option value="uk" selected>United Kingdom</option>
                  ${fulfilment.international.regions.map((r) => raw(`<option value="${r.id}">${esc(r.label)}</option>`))}
                </select>
              </div>

              <div data-duties-note hidden class="mt-4">
                ${raw(
                  notice(`<p><strong>Delivering outside the UK</strong></p><p>${esc(fulfilment.international.dutiesNote)}</p>`, {
                    tone: 'warn',
                    iconName: 'alert'
                  })
                )}
              </div>

              <div class="field-row field-row--2 mt-4">
                <div class="field">
                  <label class="field__label" for="firstName">First name</label>
                  <input class="input" type="text" id="firstName" name="firstName" autocomplete="given-name" required data-validate="text" />
                  <p class="field__error" data-error-for="firstName" hidden></p>
                </div>
                <div class="field">
                  <label class="field__label" for="lastName">Last name</label>
                  <input class="input" type="text" id="lastName" name="lastName" autocomplete="family-name" required data-validate="text" />
                  <p class="field__error" data-error-for="lastName" hidden></p>
                </div>
              </div>

              <!-- Postcode lookup, with manual entry always available. -->
              <div data-postcode-lookup>
                <div class="field field--inline mt-4">
                  <div style="flex:1;max-width:14rem">
                    <label class="field__label" for="postcodeLookup">Postcode</label>
                    <input
                      class="input"
                      type="text"
                      id="postcodeLookup"
                      name="postcodeLookup"
                      autocomplete="postal-code"
                      autocapitalize="characters"
                      spellcheck="false"
                      placeholder="e.g. HA0 4LP"
                      data-postcode-input
                    />
                  </div>
                  <button class="btn btn--quiet" type="button" data-postcode-find>Find address</button>
                </div>
                <p class="field__error" data-error-for="postcodeLookup" hidden></p>
                <p class="xs muted mt-2">
                  Demonstration lookup. Try <code>HA0 4LP</code>, <code>M1 1AE</code>,
                  <code>B1 1TT</code>, <code>EH1 1YZ</code> or <code>CF10 1EP</code>. Any other
                  postcode falls through to manual entry. ${raw(sampleTag('Sample address data'))}
                </p>

                <div class="field mt-4" data-postcode-results hidden>
                  <label class="field__label" for="addressPick">Select your address</label>
                  <select class="select" id="addressPick" data-address-pick></select>
                </div>

                <button class="discount-toggle mt-2" type="button" data-manual-toggle aria-expanded="false" aria-controls="manual-address">
                  Enter address manually instead
                </button>
              </div>

              <div id="manual-address" hidden>
                <div class="field">
                  <label class="field__label" for="line1">Address line 1</label>
                  <input class="input" type="text" id="line1" name="line1" autocomplete="address-line1" required data-validate="text" />
                  <p class="field__error" data-error-for="line1" hidden></p>
                </div>
                <div class="field">
                  <label class="field__label" for="line2">
                    Address line 2 <span class="field__optional">(optional)</span>
                  </label>
                  <input class="input" type="text" id="line2" name="line2" autocomplete="address-line2" />
                </div>
                <div class="field-row field-row--2-1">
                  <div class="field">
                    <label class="field__label" for="city">Town or city</label>
                    <input class="input" type="text" id="city" name="city" autocomplete="address-level2" required data-validate="text" />
                    <p class="field__error" data-error-for="city" hidden></p>
                  </div>
                  <div class="field">
                    <label class="field__label" for="postcode">Postcode</label>
                    <input
                      class="input"
                      type="text"
                      id="postcode"
                      name="postcode"
                      autocomplete="postal-code"
                      autocapitalize="characters"
                      spellcheck="false"
                      required
                      data-validate="postcode"
                    />
                    <p class="field__error" data-error-for="postcode" hidden></p>
                  </div>
                </div>
                <div class="field">
                  <label class="field__label" for="county">
                    County <span class="field__optional">(optional)</span>
                  </label>
                  <input class="input" type="text" id="county" name="county" autocomplete="address-level1" />
                </div>
              </div>

              <div class="field mt-4">
                <label class="field__label" for="deliveryNote">
                  Delivery instructions <span class="field__optional">(optional)</span>
                </label>
                <span class="field__hint" id="note-hint">Safe place, neighbour, buzzer code — anything the driver needs.</span>
                <textarea class="textarea" id="deliveryNote" name="deliveryNote" rows="2" aria-describedby="note-hint"></textarea>
              </div>
            </section>

            <!-- 3. Delivery method, dates computed from the bag. -->
            <section class="checkout-step" aria-labelledby="step-delivery">
              <div class="checkout-step__head">
                <span class="checkout-step__num">3</span>
                <div>
                  <h2 id="step-delivery">Delivery method</h2>
                  <p class="small muted mt-2" data-delivery-context></p>
                </div>
              </div>
              <fieldset class="fieldset">
                <legend class="visually-hidden">Choose a delivery method</legend>
                <div data-shipping-options></div>
              </fieldset>
              <div class="field mt-4" data-namedday-field hidden>
                <label class="field__label" for="namedDate">Choose your delivery date</label>
                <input class="input" type="date" id="namedDate" name="namedDate" data-namedday-input style="max-width:16rem" />
                <p class="field__error" data-error-for="namedDate" hidden></p>
              </div>
            </section>

            <!-- 4. Payment. Deliberately not a working card form. -->
            <section class="checkout-step" aria-labelledby="step-payment">
              <div class="checkout-step__head">
                <span class="checkout-step__num">4</span>
                <div><h2 id="step-payment">Payment</h2></div>
              </div>

              ${raw(
                notice(
                  `<p><strong>No payment integration is connected, and this form deliberately does not collect card details.</strong></p>
                   <p>
                     In a live build, a hosted payment element from a regulated provider (Stripe,
                     Adyen or similar) would mount in the panel below, so card numbers reach the
                     provider directly and never touch this site. Building a realistic-looking card
                     form in a demonstration would be a bad idea, so we have not.
                   </p>`,
                  { tone: 'warn', iconName: 'lock' }
                )
              )}

              <fieldset class="fieldset mt-5">
                <legend class="fieldset__legend">How you would pay</legend>
                ${paymentMethods.map(
                  (m, i) => raw(`
                  <div class="payment-option">
                    <label class="check" style="min-height:2.5rem">
                      <input type="radio" name="payment" value="${m.id}" ${i === 0 ? 'checked' : ''} data-payment-method>
                      <span class="check__text">
                        <strong>${esc(m.label)}</strong>
                        <span class="check__note">${esc(m.detail)}</span>
                      </span>
                    </label>
                  </div>`)
                )}
              </fieldset>

              <div class="payment-option mt-5" style="border-style:dashed">
                <p class="small"><strong>Payment provider element would render here</strong></p>
                <p class="xs muted mt-2">
                  A hosted, PCI-compliant iframe. Nothing is typed into this site.
                </p>
                <div class="skeleton" style="height:3rem;margin-top:var(--sp-3)" aria-hidden="true"></div>
              </div>

              <div class="mt-5">
                <label class="check">
                  <input type="checkbox" name="marketing" value="yes" data-marketing />
                  <span class="check__text">
                    Email me occasionally about new pieces
                    <span class="check__note">
                      Unticked on purpose. We will not add you to anything you did not ask for, and
                      you can unsubscribe from any email in one click.
                    </span>
                  </span>
                </label>
              </div>

              <p class="small muted mt-4">
                By placing your order you accept our
                <a class="link" href="${url('/terms/')}">terms and conditions</a> and
                <a class="link" href="${url('/privacy/')}">privacy notice</a>. Your legal right to
                cancel is set out in the <a class="link" href="${url('/returns/')}">returns policy</a>.
              </p>

              <div class="mt-5">
                <button class="btn btn--accent btn--block btn--lg" type="submit" data-place-order>
                  Place order · <span data-submit-total>—</span>
                </button>
                <p class="field__error mt-3" data-checkout-error hidden></p>
                <p class="xs muted mt-3" style="text-align:center">
                  No money moves. No order is created. Nothing is sent anywhere.
                </p>
              </div>
            </section>

            <!-- Demonstration tooling, clearly separated from the shop UI. -->
            <section class="checkout-step">
              <details class="accordion__item" style="border:1px dashed var(--rule-strong);border-radius:var(--radius);padding:0 var(--sp-4)">
                <summary class="accordion__summary">
                  Demonstration controls — exercise the awkward states
                </summary>
                <div class="accordion__body">
                  <p class="small muted">
                    These buttons exist so the failure paths can be reviewed. A real storefront would
                    not have them.
                  </p>
                  <div class="cluster mt-4">
                    <button class="btn btn--quiet btn--sm" type="button" data-simulate="payment-failure">
                      Simulate a declined payment
                    </button>
                    <button class="btn btn--quiet btn--sm" type="button" data-simulate="stock-change">
                      Simulate stock running out
                    </button>
                    <button class="btn btn--quiet btn--sm" type="button" data-simulate="session-expiry">
                      Simulate an expired session
                    </button>
                    <button class="btn btn--quiet btn--sm" type="button" data-simulate="reset">
                      Clear simulated problems
                    </button>
                  </div>
                </div>
              </details>
            </section>
          </form>

          <aside class="checkout-layout__aside">
            <div class="order-summary">
              <h2 class="h3">Your order</h2>
              <div data-checkout-lines class="mb-4"></div>
              <ul class="totals" data-checkout-totals></ul>

              <div class="mt-4">
                <button class="discount-toggle" type="button" data-discount-toggle aria-expanded="false" aria-controls="checkout-discount">
                  Have a discount code?
                </button>
                <div id="checkout-discount" hidden>
                  <div class="field field--inline mt-2">
                    <div style="flex:1">
                      <label class="field__label" for="checkoutDiscount">Discount code</label>
                      <input class="input" type="text" id="checkoutDiscount" autocomplete="off" spellcheck="false" data-discount-input />
                    </div>
                    <button class="btn btn--quiet" type="button" data-discount-apply>Apply</button>
                  </div>
                  <p class="field__error" data-discount-error data-error-for="checkoutDiscount" hidden></p>
                  <p class="field__ok" data-discount-ok hidden></p>
                </div>
              </div>

              <div class="mt-5" style="border-top:1px solid var(--rule);padding-top:var(--sp-4)">
                <p class="small"><strong>${returnsPolicy.summary}</strong></p>
                <p class="xs muted mt-2" data-returns-caveat></p>
                <p class="xs mt-2"><a class="link" href="${url('/returns/')}">Returns policy</a> · <a class="link" href="${url('/delivery/')}">Delivery</a></p>
              </div>

              <p class="xs muted mt-4">
                ${raw(icon('pin', { size: 12 }))} Dispatched from ${site.dispatch.from}.
                ${site.vat.note}
              </p>
            </div>

            <p class="xs muted mt-4" style="text-align:center">
              Need help? <a class="link" href="${url('/contact/')}">Contact us</a> —
              ${site.contact.hours}
            </p>
          </aside>
        </div>
      </div>
    </div>
  `;

  return page({
    title: 'Checkout',
    description: 'Guest checkout with UK postcode lookup, transparent totals and clear delivery dates.',
    path: '/checkout/',
    body,
    pageData: 'checkout',
    scripts: ['/assets/js/checkout.mjs'],
    hideFooter: false
  });
}

/* --------------------------- Confirmation ------------------------- */
export function confirmationPage() {
  const body = html`
    <div data-confirmation-missing hidden>
      <div class="container container--narrow" style="padding-block:var(--sp-8)">
        ${raw(
          emptyState({
            iconName: 'info',
            title: 'No recent order to show',
            body: 'This page shows the order you have just placed. It looks like you have arrived here directly, or the page has been reloaded in a new session.',
            actions: [
              { label: 'Track an order', href: '/track-order/' },
              { label: 'Continue shopping', href: '/collections/sarees/' }
            ]
          })
        )}
      </div>
    </div>

    <div data-confirmation hidden>
      <section class="confirmation-hero">
        <div class="container">
          <div class="confirmation-hero__tick">${raw(icon('check', { size: 28 }))}</div>
          <p class="eyebrow">Order confirmed</p>
          <h1 class="h1 mt-3">Thank you, <span data-order-name>—</span></h1>
          <p class="lede mt-4">
            Your order number is <strong data-order-number>—</strong>. We have emailed a confirmation
            to <strong data-order-email>—</strong>.
          </p>
          ${raw(
            notice(
              `<p><strong>This is a demonstration. No order has been placed and no payment was taken.</strong></p>
               <p>Nothing was charged, nothing was sent, and no email has actually been issued. The
               order number is generated in your browser so the confirmation and tracking pages have
               something to show.</p>`,
              { tone: 'warn', iconName: 'alert' }
            )
          )}
        </div>
      </section>

      <div class="container" style="padding-block:var(--sp-7)">
        <div class="checkout-layout">
          <div>
            <h2 class="h3 mb-5">What happens next</h2>
            <ol class="timeline" data-confirmation-timeline></ol>

            <h2 class="h3 mt-7 mb-4">What you ordered</h2>
            <div data-confirmation-lines></div>

            <div class="grid grid--2 mt-7">
              <div>
                <h3 class="h4 mb-3">Delivering to</h3>
                <address class="small" style="font-style:normal;line-height:1.7" data-confirmation-address></address>
              </div>
              <div>
                <h3 class="h4 mb-3">Delivery method</h3>
                <p class="small" data-confirmation-shipping></p>
              </div>
            </div>

            <!-- Optional account creation, after the purchase, never before. -->
            <div class="mt-7">
              ${raw(
                notice(
                  `<p><strong>Want an account?</strong></p>
                   <p>
                     You checked out as a guest, which is completely fine — your order is not affected
                     either way. An account would let you track orders, save addresses, and store your
                     measurements so you do not have to re-enter them for stitching next time.
                   </p>
                   <p class="xs">Account creation is not connected on this build.</p>`,
                  { tone: 'info', iconName: 'user' }
                )
              )}
            </div>
          </div>

          <aside class="checkout-layout__aside">
            <div class="order-summary">
              <h2 class="h3">Order total</h2>
              <ul class="totals" data-confirmation-totals></ul>
              <div class="mt-5" style="border-top:1px solid var(--rule);padding-top:var(--sp-4)">
                <h3 class="h4 mb-3">Need help?</h3>
                <ul class="stack-2 small">
                  <li><a class="link" href="${url('/track-order/')}">Track this order</a></li>
                  <li><a class="link" href="${url('/returns/')}">Return something</a></li>
                  <li><a class="link" href="mailto:${site.contact.email}">${site.contact.email}</a></li>
                  <li><a class="link" href="tel:${site.contact.phone}">${site.contact.phoneDisplay}</a></li>
                </ul>
                <p class="xs muted mt-3">${site.contact.hours}</p>
              </div>
            </div>
          </aside>
        </div>

        <div class="mt-8">
          <h2 class="h3 mb-5">Before it arrives</h2>
          <div class="grid grid--3">
            <a class="guide-card" href="${url('/saree-guide/draping/')}">
              <h3>How to drape</h3>
              <p>Five steps with diagrams. Worth ten minutes of practice before the event, not on the day.</p>
              <span class="guide-card__more">Read the guide</span>
            </a>
            <a class="guide-card" href="${url('/saree-guide/care/')}">
              <h3>First wash and storage</h3>
              <p>What to do before the first wear, and why plastic covers are how sarees yellow.</p>
              <span class="guide-card__more">Care guide</span>
            </a>
            <a class="guide-card" href="${url('/returns/')}">
              <h3>If it is not right</h3>
              <p>Thirty days, prepaid label, no questions. What can and cannot go back.</p>
              <span class="guide-card__more">Returns</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  return page({
    title: 'Order confirmed',
    description: 'Your order confirmation, what happens next and how to get help.',
    path: '/order-confirmation/',
    body,
    pageData: 'confirmation',
    scripts: ['/assets/js/confirmation.mjs']
  });
}

/* --------------------------- Track order -------------------------- */
export function trackOrderPage() {
  const body = html`
    <div class="container container--narrow">
      ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Track your order' }]))}
      <h1 class="h1">Track your order</h1>
      <p class="lede mt-4">
        Enter your order number and the postcode it is being delivered to. This works for guest
        orders — you do not need an account.
      </p>

      <form class="mt-6" data-track-form novalidate>
        <div class="field-row field-row--2">
          <div class="field">
            <label class="field__label" for="orderNumber">Order number</label>
            <span class="field__hint" id="on-hint">On your confirmation email, in the form SR-123456.</span>
            <input
              class="input"
              type="text"
              id="orderNumber"
              name="orderNumber"
              autocomplete="off"
              spellcheck="false"
              placeholder="SR-123456"
              aria-describedby="on-hint"
              required
            />
            <p class="field__error" data-error-for="orderNumber" hidden></p>
          </div>
          <div class="field">
            <label class="field__label" for="trackPostcode">Delivery postcode</label>
            <span class="field__hint" id="tp-hint">The postcode the parcel is going to.</span>
            <input
              class="input"
              type="text"
              id="trackPostcode"
              name="trackPostcode"
              autocomplete="postal-code"
              autocapitalize="characters"
              spellcheck="false"
              placeholder="HA0 4LP"
              aria-describedby="tp-hint"
              required
            />
            <p class="field__error" data-error-for="trackPostcode" hidden></p>
          </div>
        </div>
        <button class="btn btn--accent mt-4" type="submit">Find my order</button>
      </form>

      <div class="mt-5">
        ${raw(
          notice(
            `<p><strong>Demonstration tracking.</strong></p>
             <p>
               There is no order system connected. Any order you "placed" in this browser will be
               found, and three sample orders are available so the different states can be reviewed:
             </p>
             <ul class="small mt-2">
               <li><code>SR-204815</code> with postcode <code>HA0 4LP</code> — dispatched, in transit</li>
               <li><code>SR-118342</code> with postcode <code>M1 1AE</code> — with our tailor, stitching in progress</li>
               <li><code>SR-993027</code> with postcode <code>EH1 1YZ</code> — delivered</li>
             </ul>
             ${sampleTag('Sample order data')}`,
            { tone: 'info', iconName: 'info' }
          )
        )}
      </div>

      <div class="mt-7" data-track-result hidden></div>

      <div class="mt-8">
        <h2 class="h3 mb-4">Something not right?</h2>
        <ul class="stack-3">
          <li>
            <strong>Tracking has not updated in a few days.</strong> Carriers sometimes scan late.
            If there is no movement after three working days,
            <a class="link" href="${url('/contact/')}">email us</a> and we will chase it.
          </li>
          <li>
            <strong>It says delivered and you do not have it.</strong> Check with neighbours and any
            safe place you nominated, then contact us within seven days and we will open a claim.
          </li>
          <li>
            <strong>You need to change the address.</strong> If it has not been dispatched we can
            usually change it — call us rather than emailing, because it is time-sensitive.
          </li>
        </ul>
      </div>
    </div>
  `;

  return page({
    title: 'Track your order',
    description: 'Track a guest or account order with your order number and delivery postcode.',
    path: '/track-order/',
    body,
    pageData: 'track',
    scripts: ['/assets/js/track.mjs']
  });
}
