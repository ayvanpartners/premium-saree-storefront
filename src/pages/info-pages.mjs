import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { breadcrumb, notice, sampleTag, accordion, sectionHead } from '../lib/components.mjs';
import { site, fulfilment, returnsPolicy, services, paymentMethods, BRAND } from '../data/site.mjs';
import { formatMoney, UK_BANK_HOLIDAYS } from '../lib/commerce.mjs';
import { products } from '../data/products.mjs';

function infoShell({ title, slug, description, lede, body, toc: tocItems = null, draft = false }) {
  return page({
    title,
    description,
    path: `/${slug}/`,
    body: html`
      <div class="container container--narrow" style="padding-block:var(--sp-7) 0">
        ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: title }]))}
        <div class="cluster mb-4">
          ${raw(draft ? sampleTag('Draft policy — for business and legal review') : '')}
        </div>
        <h1 class="h1">${title}</h1>
        ${raw(lede ? `<p class="lede mt-4">${lede}</p>` : '')}
        ${raw(
          tocItems
            ? `<div class="toc mt-6"><h2>On this page</h2><ul>${tocItems
                .map((i) => `<li><a class="link link--quiet" href="#${i.id}">${esc(i.label)}</a></li>`)
                .join('')}</ul></div>`
            : ''
        )}
      </div>
      ${body}
    `
  });
}

const DRAFT_BANNER = notice(
  `<p><strong>This is a draft policy written for a demonstration.</strong></p>
   <p>
     It has not been reviewed by a solicitor and it does not describe a real trading company. Before
     launch it needs review against the Consumer Rights Act 2015, the Consumer Contracts (Information,
     Cancellation and Additional Charges) Regulations 2013, UK GDPR and PECR, and it needs the real
     company name, registered address, company number and VAT number inserted.
   </p>`,
  { tone: 'warn', iconName: 'alert' }
);

/* ----------------------------- Delivery --------------------------- */
export function deliveryPage() {
  const madeToOrder = products.filter((p) => p.stock === 'made-to-order').length;

  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="options">Delivery options and prices</h2>
      </div>
      <div class="container">
        <div class="table-scroll">
          <table class="table">
            <caption>All prices include VAT. Working days are ${esc(site.dispatch.workingDays.toLowerCase())}. ${raw(
              sampleTag('Sample rates')
            )}</caption>
            <thead>
              <tr>
                <th scope="col">Option</th>
                <th scope="col">Carrier</th>
                <th scope="col" class="numeric">After dispatch</th>
                <th scope="col" class="numeric">Price</th>
              </tr>
            </thead>
            <tbody>
              ${fulfilment.shipping.map(
                (s) => raw(`<tr>
                <th scope="row">${esc(s.label)}<br><span class="xs muted">${esc(s.note)}</span></th>
                <td>${esc(s.carrier)}</td>
                <td class="numeric">${s.minDays === s.maxDays ? `${s.minDays} working day` : `${s.minDays}–${s.maxDays} working days`}</td>
                <td class="numeric">${formatMoney(s.price)}${
                  s.freeOver ? `<br><span class="xs" style="color:var(--ok)">Free over ${formatMoney(s.freeOver)}</span>` : ''
                }</td>
              </tr>`)
              )}
              ${fulfilment.international.regions.map(
                (r) => raw(`<tr>
                <th scope="row">${esc(r.label)}</th>
                <td>Tracked international</td>
                <td class="numeric">${r.minDays}–${r.maxDays} working days</td>
                <td class="numeric">${formatMoney(r.price)}</td>
              </tr>`)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div class="container container--narrow prose mt-7">
        <h2 id="dispatch">How we work out the date you see</h2>
        <p>
          The delivery estimate on a product page is calculated, not written. It adds three things
          together:
        </p>
        <ol>
          <li>
            <strong>Handling time</strong>, which depends on the item. In-stock pieces are prepared in
            one working day. Made-to-order pieces take around ${fulfilment.handling['made-to-order']}
            working days because they are woven after you order —
            ${madeToOrder} ${madeToOrder === 1 ? 'piece is' : 'pieces are'} made to order at the moment.
          </li>
          <li>
            <strong>Any tailoring you add</strong>: fall and pico adds ${services.fallPico.leadDays}
            working days, blouse stitching adds ${services.blouseStitching.leadDays}, a ready-to-wear
            conversion adds ${services.readyToWearConversion.leadDays}.
          </li>
          <li><strong>The carrier's transit time</strong> for the option you choose.</li>
        </ol>
        <p>
          Weekends and UK bank holidays are skipped. Orders placed before
          ${site.dispatch.cutoffLabel} on a working day start counting that day; anything later starts
          the next working day.
        </p>
        <p>
          Everything ships from ${site.studio.city}. If your order contains several items with
          different handling times, we hold it and send it together on the latest date unless you ask
          us to split it — email us and we will, at no extra cost.
        </p>

        <h2 id="named-day">Named-day delivery</h2>
        <p>
          Pick your date at checkout and DPD will text you a one-hour arrival window on the morning.
          ${formatMoney(fulfilment.shipping[2].price)}. You need to give us a mobile number for this
          one, because the window is delivered by text.
        </p>
        <p>
          If you have a fixed event date, choose named-day and order with a couple of days in hand.
          Carrier estimates are estimates, and we would rather you had slack than a promise.
        </p>

        <h2 id="deadline">Shopping to a deadline</h2>
        <ul>
          <li>Filter the collection to <a href="${url('/collections/sarees/?stock=in-stock')}">in stock</a> to exclude made-to-order pieces.</li>
          <li>Check the estimate on the product page, then add any tailoring and watch the date move.</li>
          <li>Skip fall and pico if you are tight on time — any local tailor can do it in a day.</li>
          <li>If it is genuinely urgent, <a href="tel:${site.contact.phone}">call us</a>. We can sometimes prioritise, and we will tell you honestly if we cannot.</li>
        </ul>

        <h2 id="international">Outside the United Kingdom</h2>
        <p>${returnsInternationalNote()}</p>

        <h2 id="holidays">Bank holidays we skip</h2>
        <p class="small muted">England and Wales. ${raw(sampleTag('Sample — a live site should read the gov.uk feed'))}</p>
        <p class="small numeric">${UK_BANK_HOLIDAYS.join(' · ')}</p>

        <h2 id="problems">If something goes wrong</h2>
        <ul>
          <li><strong>Tracking has not moved for three working days.</strong> <a href="${url('/contact/')}">Tell us</a> and we will chase the carrier.</li>
          <li><strong>Marked delivered but missing.</strong> Check with neighbours and any nominated safe place, then contact us within seven days.</li>
          <li><strong>Damaged in transit.</strong> Photograph the parcel before you unpack it further and send us the photographs. Full refund or replacement, your choice.</li>
          <li><strong>Wrong address.</strong> If it has not dispatched we can usually change it. Call rather than email — it is time-sensitive.</li>
        </ul>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Delivery',
    slug: 'delivery',
    description: 'UK delivery options, prices and timings, how we calculate delivery dates, named-day delivery and international duties.',
    lede: `Dispatched from ${site.studio.city}. Standard tracked delivery is ${formatMoney(
      fulfilment.shipping[0].price
    )} and free over ${formatMoney(fulfilment.shipping[0].freeOver)}.`,
    body,
    toc: [
      { id: 'options', label: 'Options and prices' },
      { id: 'dispatch', label: 'How we work out the date' },
      { id: 'named-day', label: 'Named-day delivery' },
      { id: 'deadline', label: 'Shopping to a deadline' },
      { id: 'international', label: 'Outside the UK' },
      { id: 'problems', label: 'If something goes wrong' }
    ],
    draft: true
  });
}

function returnsInternationalNote() {
  return esc(fulfilment.international.dutiesNote);
}

/* ------------------------------ Returns --------------------------- */
export function returnsPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow">${raw(DRAFT_BANNER)}</div>

      <div class="container container--narrow prose mt-6">
        <h2 id="summary">The short version</h2>
        <p>
          <strong>${esc(returnsPolicy.summary)}</strong> ${esc(returnsPolicy.detail)}
        </p>

        <h2 id="cannot">What cannot be returned</h2>
        <p>
          Anything we have cut or stitched to your measurements, because it cannot be sold to anybody
          else:
        </p>
        <ul>
          ${returnsPolicy.exclusions.map((e) => raw(`<li>${esc(e)}</li>`))}
        </ul>
        <p>
          We say this next to each service on the product page <em>before</em> you tick it, not
          afterwards. If you want to keep a saree fully returnable, decline the stitching and use a
          local tailor once you are sure.
        </p>
        ${raw(
          notice(`<p>${esc(returnsPolicy.faultyNote)}</p>`, { tone: 'ok', iconName: 'info', heading: 'Faulty or not as described' })
        )}

        <h2 id="how">How to return something</h2>
        <ol>
          <li><a href="${url('/contact/')}">Email us</a> with your order number and which items you are sending back. You do not have to give a reason.</li>
          <li>We email you a prepaid Royal Mail returns label within one working day.</li>
          <li>Repack it with the tags still attached, attach the label, and drop it at any Post Office or parcel locker.</li>
          <li>We refund the original payment method within 5 working days of the parcel reaching us, and email you when we do.</li>
        </ol>

        <h2 id="condition">Condition we need it in</h2>
        <ul>
          <li>Unworn, with the original tags attached.</li>
          <li>No perfume, deodorant or make-up marks — these are the commonest reason a return is refused.</li>
          <li>In or with the muslin bag it arrived in, if you still have it.</li>
          <li>Trying a saree on indoors is fine. Wearing it to an event is not.</li>
        </ul>

        <h2 id="exchange">Exchanges</h2>
        <p>
          We do not run formal exchanges, because holding a piece while a parcel travels is how stock
          goes missing. Return the first item for a refund and place a new order — if the size or
          colour you want is low stock, <a href="${url('/contact/')}">tell us</a> and we will set one
          aside for seven days while your return is in transit.
        </p>

        <h2 id="cancel">Cancelling an order</h2>
        <p>
          If it has not dispatched, email or call and we will cancel and refund in full. If tailoring
          has already started we may not be able to, and we will tell you straight away rather than
          cancelling and charging you anyway.
        </p>
        <p>
          Your statutory right to cancel a distance purchase runs for 14 days from delivery, and our
          30-day policy sits on top of it rather than replacing it. Made-to-measure items are excluded
          from the statutory right by regulation 28(1)(b) of the Consumer Contracts Regulations 2013 —
          which is the legal basis for the stitching exclusions above.
        </p>

        <h2 id="international-returns">Returns from outside the UK</h2>
        <p>
          You are responsible for return postage and for reclaiming any duty you paid, which is
          usually possible but rarely quick. Mark the parcel clearly as "returned goods" to avoid it
          being charged duty again on the way back to us.
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Returns and refunds',
    slug: 'returns',
    description: 'Free UK returns within 30 days. What can and cannot be returned, how to send something back, and your statutory rights.',
    lede: `${returnsPolicy.summary} Unworn with tags attached, using the prepaid label in the box.`,
    body,
    toc: [
      { id: 'summary', label: 'The short version' },
      { id: 'cannot', label: 'What cannot be returned' },
      { id: 'how', label: 'How to return something' },
      { id: 'condition', label: 'Condition we need it in' },
      { id: 'exchange', label: 'Exchanges' },
      { id: 'cancel', label: 'Cancelling an order' },
      { id: 'international-returns', label: 'Returns from outside the UK' }
    ],
    draft: true
  });
}

/* ------------------------------ Contact --------------------------- */
export function contactPage() {
  const faqs = [
    {
      title: 'Is the blouse in the picture included?',
      body: `<p>No. Where a saree includes a blouse <em>piece</em>, that is a length of matching fabric — usually 80 to 90cm — that arrives flat and needs a tailor. The made-up blouse in any styling image is a suggestion, not part of the parcel. Every product page lists exactly what is in the box and what is not.</p>`
    },
    {
      title: 'Do I need a petticoat?',
      body: `<p>For most sarees, yes — the pleats tuck into its waistband and it is what stops a sheer fabric being see-through. Chanderi, Kota Doria, chiffon, organza and net all need one, and the product page says so. Ready-to-wear sarees include one built in.</p>`
    },
    {
      title: 'Will it arrive before my event?',
      body: `<p>Check the estimate on the product page — it is calculated from that item's own stock status, not a generic promise, and it moves if you add tailoring. For a fixed date, filter to in-stock, choose named-day delivery at checkout, and leave a couple of days of slack. If it is tight, <a href="tel:${site.contact.phone}">call us</a>.</p>`
    },
    {
      title: 'Can I return a saree after fall and pico?',
      body: `<p>No, and we are sorry to be firm about it — the fabric has been cut and hemmed to length, so it cannot go back into stock. We repeat this next to the option before you tick it. If you are unsure about a saree, buy it without stitching first.</p>`
    },
    {
      title: 'How do I know if a saree is really handloom?',
      body: `<p>Look at the provenance line in the specification. "Handloom, supplier declared" means the supplier states it in writing and names the cluster, and we hold that declaration — we have not audited the loom, and we will not claim we have. "Mill described" means we could not confirm it. "Inspired by" means it is not made in that tradition at all. <a href="${url('/saree-guide/weaves/')}">How to check for yourself.</a></p>`
    },
    {
      title: 'What if the blouse you stitch does not fit?',
      body: `<p>If it does not match the measurements you gave us, that is our error — send it back and we will remake it or refund you in full, including the stitching charge. If the measurements were not right in the first place we will usually still help, but we cannot refund it, which is why we ask you to read the <a href="${url('/saree-guide/measurements/')}">measurement guide</a> first.</p>`
    },
    {
      title: 'Do you ship outside the UK?',
      body: `<p>Yes, to the EU and the rest of the world. Import duty, local tax and customs handling are set by the destination country, are not included in our prices, and are paid by the recipient. We say this at checkout before you pay, not after.</p>`
    },
    {
      title: 'Can you find me something you do not have in stock?',
      body: `<p>Sometimes. Email us with what you are after — the weave, the colour, the occasion and your budget — and we will tell you honestly whether we can source it and how long it would take.</p>`
    }
  ];

  const body = html`
    <section class="section">
      <div class="container">
        <div class="grid grid--2" style="gap:var(--sp-8);align-items:start">
          <div class="stack-5">
            <div>
              <h2 class="h3 mb-4">Talk to a person</h2>
              <dl class="spec-list">
                <div>
                  <dt>${raw(icon('mail', { size: 16 }))} Email</dt>
                  <dd><a class="link" href="mailto:${site.contact.email}">${site.contact.email}</a><em>${esc(site.contact.responseTime)}</em></dd>
                </div>
                <div>
                  <dt>${raw(icon('phone', { size: 16 }))} Phone</dt>
                  <dd><a class="link" href="tel:${site.contact.phone}">${site.contact.phoneDisplay}</a><em>${esc(site.contact.hours)}</em></dd>
                </div>
                <div>
                  <dt>${raw(icon('pin', { size: 16 }))} Studio</dt>
                  <dd>
                    ${site.studio.line1}<br />${site.studio.line2}<br />${site.studio.city}
                    ${site.studio.postcode}<br />${site.studio.country}
                    <em>Not a shop — please do not visit without arranging it first.</em>
                  </dd>
                </div>
              </dl>
              <p class="mt-4">${raw(sampleTag('Sample contact details'))}</p>
            </div>

            ${raw(
              notice(
                `<p><strong>Not sure what to ask?</strong></p>
                 <p>
                   Tell us the occasion, the date, roughly what you want to spend and whether you have
                   worn a saree before. That is enough for us to send you three or four specific
                   suggestions rather than a catalogue.
                 </p>`,
                { tone: 'accent', iconName: 'sparkle' }
              )
            )}

            <div>
              <h2 class="h3 mb-4">Other things you might need</h2>
              <ul class="stack-2">
                <li><a class="link" href="${url('/track-order/')}">Track an order</a> — order number and postcode, no account needed.</li>
                <li><a class="link" href="${url('/returns/')}">Start a return</a> — what can go back and how.</li>
                <li><a class="link" href="${url('/saree-guide/measurements/')}">Measurement guide</a> — before ordering stitching.</li>
                <li><a class="link" href="${url('/accessibility/')}">Accessibility</a> — and how to tell us about a barrier.</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 class="h3 mb-4">Send us a message</h2>
            <form data-contact-form novalidate class="stack-4">
              <div class="field">
                <label class="field__label" for="cname">Your name</label>
                <input class="input" type="text" id="cname" name="name" autocomplete="name" required data-validate="text" />
                <p class="field__error" data-error-for="cname" hidden></p>
              </div>
              <div class="field">
                <label class="field__label" for="cemail">Email address</label>
                <input class="input" type="email" id="cemail" name="email" autocomplete="email" inputmode="email" required data-validate="email" />
                <p class="field__error" data-error-for="cemail" hidden></p>
              </div>
              <div class="field">
                <label class="field__label" for="corder">
                  Order number <span class="field__optional">(optional)</span>
                </label>
                <input class="input" type="text" id="corder" name="order" autocomplete="off" placeholder="SR-123456" />
              </div>
              <div class="field">
                <label class="field__label" for="ctopic">What is it about?</label>
                <select class="select" id="ctopic" name="topic">
                  <option value="advice">Help choosing something</option>
                  <option value="order">An existing order</option>
                  <option value="delivery">Delivery or timing</option>
                  <option value="returns">A return or refund</option>
                  <option value="tailoring">Stitching or measurements</option>
                  <option value="accessibility">An accessibility barrier</option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div class="field">
                <label class="field__label" for="cmessage">Message</label>
                <textarea class="textarea" id="cmessage" name="message" rows="6" required data-validate="text"></textarea>
                <p class="field__error" data-error-for="cmessage" hidden></p>
              </div>
              <button class="btn btn--accent" type="submit">Send message</button>
              <p class="field__ok" data-contact-ok hidden></p>
              <p class="xs muted">
                No form backend is connected on this demonstration, so nothing is sent anywhere. In a
                live build this would reach the customer service inbox.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container container--narrow">
        <h2 class="h2 mb-6" id="faq">Common questions</h2>
        ${raw(accordion(faqs))}
      </div>
    </section>
  `;

  return page({
    title: 'Contact us',
    description: 'Email, phone and opening hours, plus answers to the questions we are asked most.',
    path: '/contact/',
    body: html`
      <div class="container container--narrow" style="padding-block:var(--sp-7) 0">
        ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Contact us' }]))}
        <h1 class="h1">Contact us</h1>
        <p class="lede mt-4">
          A person replies, and we would rather spend five minutes now than remake something later.
        </p>
      </div>
      ${body}
    `,
    pageData: 'contact',
    scripts: ['/assets/js/contact.mjs']
  });
}

/* ------------------------------- About ---------------------------- */
export function aboutPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        ${raw(
          notice(
            `<p><strong>There is no brand story here, because there is no brand.</strong></p>
             <p>
               ${BRAND} is a placeholder. This page would normally carry the founders, the buying
               trips, the weaving relationships and the reasons the business exists. Inventing that
               would be the single most misleading thing this demonstration could do, so instead this
               page explains how we word claims — which is the part worth keeping.
             </p>`,
            { tone: 'warn', iconName: 'alert' }
          )
        )}

        <h2 id="sourcing-language">How we describe our sarees</h2>
        <p>
          "Handloom" adds a lot to the price of a saree, and it is almost impossible for a customer to
          verify from a photograph. So rather than asserting it, we grade our own confidence and print
          the grade on every product page:
        </p>
        <dl class="spec-list">
          <div>
            <dt>Handloom, supplier declared</dt>
            <dd>
              The supplier states in writing that it was woven on a handloom and names the weaving
              cluster. We hold that declaration on file.
              <em>We have not independently audited the loom, and we do not claim to have.</em>
            </dd>
          </div>
          <div>
            <dt>Mill described, not verified</dt>
            <dd>
              A mill described the weave to us and we could not confirm it independently.
              <em>Treat it as a description of the design rather than a provenance claim.</em>
            </dd>
          </div>
          <div>
            <dt>Inspired by the tradition</dt>
            <dd>
              The design references a named tradition but is not made in it or in that region — most
              often a print taking its geometry from a weave.
              <em>We put this in the product name, not only in the small print.</em>
            </dd>
          </div>
          <div>
            <dt>Powerloom woven</dt>
            <dd>Machine woven. Even, fast, lower cost, without the irregularities of hand work.</dd>
          </div>
          <div>
            <dt>Contemporary production</dt>
            <dd>A modern piece from a modern mill. No regional tradition is claimed.</dd>
          </div>
        </dl>

        <h2 id="what-we-dont-claim">What we deliberately do not claim</h2>
        <ul>
          <li><strong>No sustainability claims.</strong> We have no audited data, so we say nothing rather than saying something comfortable.</li>
          <li><strong>No certifications.</strong> None are held. If any were, the certificate number would be on the product page.</li>
          <li><strong>No artisan biographies.</strong> Naming a weaver we have not met, to sell a saree, is not a story — it is decoration.</li>
          <li><strong>No scarcity pressure.</strong> Stock status is factual — in stock, low stock, made to order, out of stock. No countdown timers, no "twelve people are viewing this".</li>
          <li><strong>No invented reviews.</strong> The review slot exists and is empty, because no verified review data has been supplied.</li>
        </ul>

        <h2 id="prices">Why things cost what they cost</h2>
        <p>
          A handloom Kanjivaram costs what it does because it is 720 grams of silk with real zari,
          woven slowly by two people. A polyester georgette costs a fraction of that because it is
          machine-made from petroleum, and it will not become an heirloom. Both are legitimate
          purchases for different occasions, and the honest thing is to be clear about which is which
          rather than using the word "luxury" to cover both.
        </p>

        <h2 id="build">About this build</h2>
        <p>
          This is a demonstration storefront built as a static site with no runtime dependencies. What
          is real, what is sample data and what is not connected at all is set out plainly on the
          <a href="${url('/demo-notice/')}">demonstration notice</a>.
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: `About ${BRAND}`,
    slug: 'about',
    description: 'How we word provenance claims, what we deliberately do not claim, and why sarees cost what they cost.',
    lede: 'No founder story. Instead, the part that actually affects what you buy: how we word our claims.',
    body,
    toc: [
      { id: 'sourcing-language', label: 'How we describe our sarees' },
      { id: 'what-we-dont-claim', label: 'What we do not claim' },
      { id: 'prices', label: 'Why things cost what they cost' },
      { id: 'build', label: 'About this build' }
    ]
  });
}

/* --------------------------- Accessibility ------------------------ */
export function accessibilityPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="target">What we are aiming for</h2>
        <p>
          WCAG 2.2 Level AA across the whole shopping journey — browsing, filtering, product pages,
          bag, checkout and confirmation. Not just the homepage.
        </p>

        <h2 id="built">What is built in</h2>
        <ul>
          <li><strong>Keyboard</strong> — every control is reachable and operable by keyboard, with a visible focus ring that meets contrast requirements. Drawers and dialogs trap focus while open and return it to the control that opened them.</li>
          <li><strong>Skip link</strong> — first thing in the tab order on every page.</li>
          <li><strong>Semantic structure</strong> — one h1 per page, headings in order, landmarks for header, navigation, main and footer, and real lists for lists.</li>
          <li><strong>Forms</strong> — every field has a visible persistent label, not a placeholder standing in for one. Errors are announced, tied to their field with aria-describedby, and your input is preserved.</li>
          <li><strong>Colour is never the only signal</strong> — colour swatches carry text labels, out-of-stock options are crossed as well as greyed, and stock states are words.</li>
          <li><strong>Contrast</strong> — body text is at least 4.5:1 against its background and large text at least 3:1.</li>
          <li><strong>Touch targets</strong> — interactive controls are at least 44 by 44 CSS pixels.</li>
          <li><strong>Screen-reader feedback</strong> — bag and wishlist changes, filter result counts and validation are announced through polite live regions.</li>
          <li><strong>Reduced motion</strong> — <code>prefers-reduced-motion</code> removes transitions, hover zooms and the loading shimmer.</li>
          <li><strong>Zoom and reflow</strong> — usable at 400% zoom and at 320 CSS pixels wide without two-dimensional scrolling.</li>
          <li><strong>Degrades without JavaScript</strong> — every product, collection, guide and policy page renders and reads normally. Controls that cannot work without it are hidden rather than left dead on the page, and replaced with links that do work.</li>
        </ul>

        <h2 id="known">Known limitations in this build</h2>
        ${raw(
          notice(
            `<p>
               Stated plainly rather than omitted. These would be addressed before a real launch.
             </p>
             <ul class="small mt-2">
               <li>No audit by a third party, and no testing with real assistive-technology users. Automated checks and manual keyboard and screen-reader passes are not a substitute for either.</li>
               <li>Inventory sarees use photographs of the actual catalogued item. Fibre, weave, dimensions and provenance still need supplier confirmation and are labelled as unconfirmed rather than inferred from the image.</li>
               <li>The bag, checkout, wishlist, search and collection filtering require JavaScript. Without it you can still browse every collection and product page, and the collection pages offer the pre-built occasion and fabric collections instead of a filter form that would not work. Purchasing is not possible without JavaScript.</li>
               <li>The interactive first-saree questionnaire requires JavaScript; the equivalent result is reachable with collection filters.</li>
               <li>No captions or transcripts are needed yet because there is no video or audio. If video is added, both become required.</li>
             </ul>`,
            { tone: 'warn', iconName: 'alert' }
          )
        )}

        <h2 id="feedback">Tell us about a barrier</h2>
        <p>
          If something on this site stops you doing what you came to do, email
          <a class="link" href="mailto:${site.contact.email}">${site.contact.email}</a> with
          "Accessibility" in the subject line. Tell us the page and what happened, and what you were
          using if you know. We will reply within one working day and tell you either when it will be
          fixed or how to get what you needed another way in the meantime.
        </p>
        <p>
          You can also <a class="link" href="tel:${site.contact.phone}">call us</a> and we will place
          an order for you over the phone.
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Accessibility',
    slug: 'accessibility',
    description: 'Our WCAG 2.2 AA target, what is built in, the known limitations of this build, and how to report a barrier.',
    lede: 'What we have built, what we know is not good enough yet, and how to tell us when something blocks you.',
    body,
    toc: [
      { id: 'target', label: 'What we are aiming for' },
      { id: 'built', label: 'What is built in' },
      { id: 'known', label: 'Known limitations' },
      { id: 'feedback', label: 'Tell us about a barrier' }
    ]
  });
}

/* --------------------------- Demo notice -------------------------- */
export function demoNoticePage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="not-real">This is not a real shop</h2>
        <p>
          ${BRAND} does not exist. Nothing on this site can be bought, no payment can be taken, no
          order is created and no email is sent. If you reached this site expecting to buy a saree,
          you cannot — and we would rather say that once, plainly, than bury it.
        </p>

        <h2 id="sample">What is sample content</h2>
        <p>Everything in this list was written for the demonstration and describes nothing real:</p>
        <ul>
          <li><strong>All ${products.length} products</strong> — names, descriptions, prices, compositions, measurements, stock levels and provenance notes.</li>
          <li><strong>Business identity</strong> — the studio address in ${site.studio.city}, the email address, the phone number, the VAT number.</li>
          <li><strong>Fulfilment data</strong> — handling times, carrier names, transit times, delivery prices and the bank-holiday list.</li>
          <li><strong>Policies</strong> — delivery, returns, terms, privacy and cookies are drafts marked for business and legal review.</li>
          <li><strong>Discount codes</strong> and the three sample orders on the tracking page.</li>
          <li><strong>Postcode lookup results</strong> — a handful of hard-coded postcodes, not a real address service.</li>
        </ul>
        <p>
          Wherever invented content could be mistaken for a business fact, the interface marks it:
          ${raw(sampleTag('Sample content'))}
        </p>

        <h2 id="imagery">About the imagery</h2>
        <p>
          <strong>The saree catalogue uses photographs of the actual SS-numbered inventory.</strong>
          Product cards, galleries, homepage editorial panels and occasion tiles all use the same
          local supplier-photo library. The retired Wikimedia reference photographs and generated
          saree illustrations are no longer used for catalogue items.
        </p>
        <p>
          The photographs support visual descriptions such as color, motif and border. They do not
          prove fibre composition, weaving method, dimensions or provenance, so those fields remain
          explicitly unconfirmed until supplier data is available. See
          <a href="${url('/image-credits/')}">product imagery</a> for the inventory-image workflow.
        </p>

        <h2 id="integrations">Integrations not connected</h2>
        ${raw(
          `<div class="table-scroll" style="max-width:none">
            <table class="table">
              <thead><tr><th scope="col">Integration</th><th scope="col">State</th><th scope="col">What stands in for it</th></tr></thead>
              <tbody>
                <tr><th scope="row">Payments</th><td>Not connected</td><td>No card form exists. A hosted provider element would mount at checkout; a demonstration panel shows where.</td></tr>
                <tr><th scope="row">Order management</th><td>Not connected</td><td>Orders are written to your browser's session storage so confirmation and tracking have something to display.</td></tr>
                <tr><th scope="row">Inventory</th><td>Not connected</td><td>Stock states are static fields in the catalogue. A demonstration control on the checkout page simulates stock running out.</td></tr>
                <tr><th scope="row">Accounts and authentication</th><td>Not connected</td><td>Everything works as a guest. The wishlist lives in browser storage.</td></tr>
                <tr><th scope="row">Address lookup</th><td>Not connected</td><td>Seven hard-coded postcodes, with manual entry always available as the fallback.</td></tr>
                <tr><th scope="row">Reviews</th><td>Not connected</td><td>Nothing. The slot is built and left visibly empty rather than filled with invented testimonials.</td></tr>
                <tr><th scope="row">Email</th><td>Not connected</td><td>Nothing is sent. The contact form validates and then tells you it went nowhere.</td></tr>
                <tr><th scope="row">Analytics</th><td>Not connected</td><td>No tracking scripts, no cookies set, no third-party requests of any kind.</td></tr>
              </tbody>
            </table>
          </div>`
        )}

        <h2 id="cookies-truth">Cookies actually set: none</h2>
        <p>
          This build sets no cookies and makes no third-party requests. There is no consent banner
          because there is nothing to consent to. The <a href="${url('/cookies/')}">cookies page</a>
          is a draft of what would be needed once analytics or payments are added. The bag and
          wishlist use your browser's local storage, which stays on your device and is never sent
          anywhere.
        </p>

        <h2 id="tech">How it is built</h2>
        <ul>
          <li>Static HTML generated by a small Node script. No framework, no runtime dependencies, no build toolchain beyond Node itself.</li>
          <li>One stylesheet, a handful of ES modules, self-hosted variable fonts under the SIL Open Font License.</li>
          <li>The 2,668 inventory photographs are emitted as web-sized WebP files and lazy-loaded below the fold. The full-resolution originals remain outside the build.</li>
          <li>Delivery dates, totals and validation come from one shared module used by both the build and the browser, so pages cannot disagree with each other.</li>
        </ul>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Demonstration notice',
    slug: 'demo-notice',
    description: 'What is real, what is sample data and which integrations are not connected on this demonstration build.',
    lede: 'Everything this build invents, everything it does not do, and every integration that is missing — in one place.',
    body,
    toc: [
      { id: 'not-real', label: 'This is not a real shop' },
      { id: 'sample', label: 'What is sample content' },
      { id: 'imagery', label: 'About the imagery' },
      { id: 'integrations', label: 'Integrations not connected' },
      { id: 'cookies-truth', label: 'Cookies actually set' },
      { id: 'tech', label: 'How it is built' }
    ]
  });
}

/* ------------------------------- Terms ---------------------------- */
export function termsPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow">${raw(DRAFT_BANNER)}</div>
      <div class="container container--narrow prose mt-6">
        <h2 id="who">1. Who we are</h2>
        <p>
          [COMPANY NAME] trading as ${BRAND}, a company registered in England and Wales, company
          number [NUMBER], registered office ${site.studio.line1}, ${site.studio.line2},
          ${site.studio.city} ${site.studio.postcode}. VAT registration ${site.vat.number}.
          ${raw(sampleTag('Placeholders to be completed'))}
        </p>

        <h2 id="contract">2. When a contract is formed</h2>
        <p>
          Your order is an offer to buy. We accept it when we email you a dispatch confirmation, and
          the contract is formed at that point — not when you place the order and not when payment is
          authorised. If we cannot fulfil an order we will tell you and refund you in full.
        </p>

        <h2 id="prices">3. Prices and payment</h2>
        <p>
          Prices are in pounds sterling and include UK VAT at 20%. We take payment when you order. If
          a price is obviously wrong we will contact you before dispatching rather than either
          charging the wrong amount or silently cancelling.
        </p>
        <p>
          Orders delivered outside the UK may attract import duty, local tax and customs handling
          charges, which are set by the destination country and are the recipient's responsibility.
        </p>

        <h2 id="delivery-terms">4. Delivery</h2>
        <p>
          Delivery estimates are estimates, not guarantees, and they depend on carriers we do not
          control. Risk passes to you on delivery. If we miss a delivery date you specified as
          essential, you may treat the contract as ended and we will refund you in full.
        </p>

        <h2 id="madetomeasure">5. Made-to-measure items</h2>
        <p>
          Items stitched to your measurements — fall and pico, stitched blouses, ready-to-wear
          conversions — are made to your specification and are excluded from the statutory right to
          cancel under regulation 28(1)(b) of the Consumer Contracts (Information, Cancellation and
          Additional Charges) Regulations 2013. This is stated next to each service before you select
          it. Your rights where an item is faulty or not as described are unaffected.
        </p>

        <h2 id="cancellation">6. Your right to cancel</h2>
        <p>
          You have 14 days from delivery to cancel a distance purchase, and our own returns policy
          extends that to 30 days. Nothing in these terms reduces your rights under the Consumer
          Rights Act 2015.
        </p>

        <h2 id="description">7. Product descriptions and colour</h2>
        <p>
          Handwoven textiles vary. Small irregularities in weave, dye and motif placement are
          characteristics of hand production, not faults, and we describe them as such. Colours may
          look different on different screens. Where a weave or provenance claim is not independently
          verified, the product page says so.
        </p>

        <h2 id="liability">8. Our liability</h2>
        <p>
          We are responsible for foreseeable loss and damage caused by us. We are not liable for
          business losses. Nothing here limits liability for death or personal injury caused by
          negligence, for fraud, or for anything else that cannot lawfully be limited.
        </p>

        <h2 id="law">9. Complaints, law and jurisdiction</h2>
        <p>
          Email <a class="link" href="mailto:${site.contact.email}">${site.contact.email}</a> and we
          will acknowledge within one working day. These terms are governed by the law of England and
          Wales, and you may bring proceedings in the courts of England and Wales — or, if you live in
          Scotland or Northern Ireland, in your own courts.
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Terms and conditions',
    slug: 'terms',
    description: 'Draft terms and conditions of sale, for business and legal review.',
    lede: 'Draft terms of sale. Marked for legal review, with company details left as placeholders.',
    body,
    draft: true
  });
}

/* ------------------------------ Privacy --------------------------- */
export function privacyPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow">${raw(DRAFT_BANNER)}</div>
      <div class="container container--narrow prose mt-6">
        ${raw(
          notice(
            `<p><strong>What this build actually does with your data: nothing.</strong></p>
             <p>
               No analytics, no tracking, no third-party requests, no cookies, no server. Your bag and
               wishlist are stored in your own browser and never transmitted. Nothing you type into a
               form is sent anywhere. The policy below is a draft of what would be needed once real
               integrations exist.
             </p>`,
            { tone: 'ok', iconName: 'lock' }
          )
        )}

        <h2 id="controller">1. Who is responsible</h2>
        <p>
          [COMPANY NAME] trading as ${BRAND}, ${site.studio.line1}, ${site.studio.city}
          ${site.studio.postcode}, is the data controller. Contact
          <a class="link" href="mailto:${site.contact.email}">${site.contact.email}</a>.
          ${raw(sampleTag('Placeholders to be completed'))}
        </p>

        <h2 id="what">2. What we would collect, and why</h2>
        <dl class="spec-list">
          <div>
            <dt>Order details</dt>
            <dd>Name, email, delivery and billing address, phone number, what you bought.<em>Lawful basis: performance of a contract.</em></dd>
          </div>
          <div>
            <dt>Measurements</dt>
            <dd>Only if you order stitching. Held to make the item, and to remake it if we get it wrong.<em>Lawful basis: performance of a contract.</em></dd>
          </div>
          <div>
            <dt>Payment data</dt>
            <dd>Handled entirely by the payment provider. We would receive a token and the last four digits, never the full card number.<em>Lawful basis: performance of a contract.</em></dd>
          </div>
          <div>
            <dt>Marketing emails</dt>
            <dd>Your email address, only if you tick the box. Never pre-ticked.<em>Lawful basis: consent, withdrawable at any time.</em></dd>
          </div>
          <div>
            <dt>Analytics</dt>
            <dd>Not in use in this build.<em>Would require consent under PECR before any non-essential cookie is set.</em></dd>
          </div>
        </dl>

        <h2 id="retention">3. How long we would keep it</h2>
        <ul>
          <li><strong>Order and transaction records:</strong> six years after the tax year, as HMRC requires.</li>
          <li><strong>Measurements:</strong> three years, so repeat orders do not need re-measuring. Deleted on request.</li>
          <li><strong>Marketing consent:</strong> until you withdraw it, plus a suppression record so we do not re-add you.</li>
          <li><strong>Customer service email:</strong> two years.</li>
        </ul>

        <h2 id="sharing">4. Who we would share it with</h2>
        <p>
          Carriers, to deliver your parcel. The payment provider, to take payment. Our tailoring
          partner, for measurements only where you have ordered stitching. Our email provider, for
          transactional and consented marketing email. No one else, and never for sale.
        </p>

        <h2 id="rights">5. Your rights</h2>
        <p>
          You can ask for a copy of your data, ask us to correct or delete it, object to processing,
          ask us to restrict it, and ask for it in a portable format. Email us and we will respond
          within one month. If you are unhappy with how we handle it you can complain to the
          Information Commissioner's Office at ico.org.uk or on 0303 123 1113.
        </p>

        <h2 id="transfers">6. International transfers</h2>
        <p>
          Where a provider processes data outside the UK we would rely on UK adequacy regulations or
          the International Data Transfer Addendum, and list the providers here.
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Privacy notice',
    slug: 'privacy',
    description: 'Draft privacy notice. This build collects no data, sets no cookies and makes no third-party requests.',
    lede: 'This build collects nothing. Below is a draft of the notice a live build would need.',
    body,
    draft: true
  });
}

/* ------------------------------ Cookies --------------------------- */
export function cookiesPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow">
        ${raw(
          notice(
            `<p><strong>This build sets no cookies at all.</strong></p>
             <p>
               That is why there is no consent banner — asking permission for nothing would be
               theatre. There are no analytics scripts, no advertising pixels, no embedded video, no
               web fonts loaded from a third party, and no requests to any domain but this one.
             </p>`,
            { tone: 'ok', iconName: 'lock' }
          )
        )}
      </div>

      <div class="container container--narrow prose mt-6">
        <h2 id="storage">What we do use: your browser's own storage</h2>
        <p>
          Your bag and wishlist are kept in <code>localStorage</code>, and an in-progress order in
          <code>sessionStorage</code>. Neither is a cookie, neither is sent to any server, and both
          stay on your device. Clearing your browser data clears them. Nothing in them identifies you.
        </p>
        ${raw(
          `<div class="table-scroll" style="max-width:none">
            <table class="table">
              <thead><tr><th scope="col">Key</th><th scope="col">Holds</th><th scope="col">Lasts</th></tr></thead>
              <tbody>
                <tr><th scope="row"><code>bag</code></th><td>Items, options and any tailoring you have chosen</td><td>Until you clear it or empty the bag</td></tr>
                <tr><th scope="row"><code>wishlist</code></th><td>Product IDs you have saved</td><td>Until you clear it</td></tr>
                <tr><th scope="row"><code>lastOrder</code></th><td>The demonstration order, so the confirmation page can display it</td><td>Until the browser tab closes</td></tr>
                <tr><th scope="row"><code>collectionState</code></th><td>Your filters and scroll position, so returning from a product page puts you back where you were</td><td>Until the browser tab closes</td></tr>
              </tbody>
            </table>
          </div>`
        )}

        <h2 id="future">What a live build would need</h2>
        <p>Draft only, for review before anything is switched on:</p>
        <dl class="spec-list">
          <div>
            <dt>Strictly necessary</dt>
            <dd>Session and cart cookies from the commerce platform, and fraud-prevention cookies from the payment provider.<em>No consent required, but they must still be listed.</em></dd>
          </div>
          <div>
            <dt>Analytics</dt>
            <dd>Aggregate measurement of which pages help people buy.<em>Consent required before being set, under PECR regulation 6.</em></dd>
          </div>
          <div>
            <dt>Marketing</dt>
            <dd>Advertising and remarketing pixels.<em>Consent required. Reject must be as easy as accept, and refusing must not degrade the shop.</em></dd>
          </div>
        </dl>
        <p>
          Any consent banner added later must not cover the navigation, the bag or the add-to-bag
          control, must be fully keyboard operable, and must offer "reject all" with the same
          prominence as "accept all".
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Cookies',
    slug: 'cookies',
    description: 'This build sets no cookies. What browser storage is used, and what a live build would need.',
    lede: 'No cookies are set by this site. Here is what is actually stored, and where.',
    body,
    draft: true
  });
}


/* ---------------------------- Product imagery --------------------- */
export function imageCreditsPage() {
  const inventory = products.filter((product) => product.inventoryId);
  const imageCount = inventory.reduce((total, product) => total + (product.images?.length || 0), 0);
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="what">What these images are</h2>
        <p>
          This build uses <strong>${imageCount} photographs</strong> for
          <strong>${inventory.length} SS-numbered sarees</strong>. They are photographs of the
          catalogued inventory items, not generic reference pictures. The same photographs appear
          on product cards, product galleries, homepage features and occasion tiles.
        </p>
        <p>
          Full-resolution originals stay in <code>src/assets/images/</code>. The storefront uses
          generated WebP derivatives from <code>src/assets/catalog/</code>, created by
          <code>python tools/sync-inventory.py</code>. Both image directories are excluded from Git.
        </p>
        ${raw(
          notice(
            `<p><strong>Usage rights still need business confirmation.</strong> The local catalogue
             should only be published where the supplier has authorized use of its photographs.</p>`,
            { tone: 'warn', iconName: 'alert' }
          )
        )}

        <h2 id="descriptions">How descriptions are handled</h2>
        <p>
          Folder names and webpage descriptions use visible characteristics—color, motif or pattern,
          and border. A photograph cannot verify fibre, weaving method, dimensions or provenance,
          so the product pages identify those details as awaiting supplier confirmation.
        </p>
      </div>
    </section>
  `;

  return infoShell({
    title: 'Product imagery',
    slug: 'image-credits',
    description: 'How the SS-numbered inventory photographs are prepared and used in this storefront.',
    lede: 'Actual inventory photographs, prepared for the web without changing the originals.',
    body,
    toc: [
      { id: 'what', label: 'What these images are' },
      { id: 'descriptions', label: 'How descriptions are handled' }
    ]
  });
}
