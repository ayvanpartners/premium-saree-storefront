import { html, raw, esc, url, icon } from '../lib/html.mjs';
import { page } from '../lib/layout.mjs';
import { breadcrumb, notice, sectionHead, productCard, sampleTag, easeMeter, term } from '../lib/components.mjs';
import { fabrics, weaves, occasions, sizeChart, measurementFields, rtwMeasurementFields, drapeDifficulty } from '../data/taxonomy.mjs';
import { products, productById, firstSareePicks } from '../data/products.mjs';
import { services, returnsPolicy, site } from '../data/site.mjs';
import { formatMoney } from '../lib/commerce.mjs';

const GUIDE_CRUMB = [
  { label: 'Home', href: '/' },
  { label: 'Saree Guide', href: '/saree-guide/' }
];

function guideShell({ title, slug, description, lede, body, toc = null }) {
  return page({
    title,
    description,
    path: `/saree-guide/${slug}/`,
    activeKey: 'saree-guide',
    body: html`
      <div class="container container--narrow">
        ${raw(breadcrumb([...GUIDE_CRUMB, { label: title }]))}
        <h1 class="h1">${title}</h1>
        ${raw(lede ? `<p class="lede mt-4">${lede}</p>` : '')}
        ${raw(toc ? `<div class="toc mt-6">${toc}</div>` : '')}
      </div>
      ${body}
    `
  });
}

function toc(items) {
  return `<h2>On this page</h2><ul>${items
    .map((i) => `<li><a class="link link--quiet" href="#${i.id}">${esc(i.label)}</a></li>`)
    .join('')}</ul>`;
}

/* ----------------------------- Guide hub -------------------------- */
export function guideHubPage() {
  const cards = [
    {
      href: '/saree-guide/first-saree/',
      title: 'Find your first saree',
      body: 'Four questions about the occasion, the weather, your comfort with draping and your budget. Then a short list — not the whole shop.'
    },
    {
      href: '/saree-guide/anatomy/',
      title: 'Anatomy of a saree',
      body: 'Pallu, border, body, blouse piece, petticoat. A labelled diagram and what each part is for.'
    },
    {
      href: '/saree-guide/draping/',
      title: 'How to drape a saree',
      body: 'Five steps in the order you actually do them, with diagrams. Plus the three mistakes everybody makes first time.'
    },
    {
      href: '/saree-guide/fabrics/',
      title: 'Fabrics compared',
      body: 'Silk, cotton, chiffon, georgette, organza and linen, side by side: weight, sheerness, warmth, and how hard each is to drape.'
    },
    {
      href: '/saree-guide/weaves/',
      title: 'Weaves and regional styles',
      body: 'Kanjivaram, Banarasi, Chanderi, Jamdani, ikat and more — what makes each one that thing, and how to spot it yourself.'
    },
    {
      href: '/saree-guide/ready-to-wear/',
      title: 'How ready to wear works',
      body: 'Pre-pleated sarees explained: what is stitched, what is not, how sizing works, and when it is the wrong choice.'
    },
    {
      href: '/saree-guide/tailoring/',
      title: 'Blouses and tailoring',
      body: 'Blouse stitching, fall and pico, and ready-to-wear conversion. Costs, lead times, measurements and the effect on returns.'
    },
    {
      href: '/saree-guide/measurements/',
      title: 'Measurements',
      body: 'Where to put the tape for each measurement we ask for, in centimetres and inches, with the full size chart.'
    },
    {
      href: '/saree-guide/care/',
      title: 'Caring for your saree',
      body: 'Washing, dry cleaning, ironing, storage and the small habits that keep silk alive for decades.'
    },
    {
      href: '/saree-guide/glossary/',
      title: 'Glossary',
      body: 'Every term we use, in plain English. Buti, jaal, khat, pico, zari, and the rest.'
    }
  ];

  const body = html`
    <section class="section">
      <div class="container">
        <h2 class="visually-hidden">Guides</h2>
        <div class="grid grid--3">
          ${cards.map(
            (c) => raw(`
            <a class="guide-card" href="${url(c.href)}">
              <h3>${esc(c.title)}</h3>
              <p>${esc(c.body)}</p>
              <span class="guide-card__more">Read</span>
            </a>`)
          )}
        </div>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container">
        ${raw(
          sectionHead({
            eyebrow: 'The short version',
            title: 'Seven things worth knowing before you buy',
            body: 'If you read nothing else on this site, read this.'
          })
        )}
        <div class="grid grid--2" style="gap:var(--sp-6)">
          <ol class="prose" style="counter-reset:none">
            <li><strong>A saree is one piece of unstitched cloth</strong>, five and a half to six and a half metres long. There is no dress size.</li>
            <li><strong>You need three things to wear one:</strong> the saree, a fitted blouse, and a petticoat. Most sarees include fabric for a blouse but not a made-up blouse.</li>
            <li><strong>The blouse in the photograph is usually not what you get.</strong> We say explicitly on every product page what is in the parcel.</li>
            <li><strong>Fabric decides difficulty more than price does.</strong> Cotton grips and forgives. Chiffon slides and needs ten pins.</li>
          </ol>
          <ol class="prose" start="5">
            <li><strong>Sheer fabrics need a petticoat, not optionally.</strong> Chanderi, Kota, chiffon and organza are see-through by design.</li>
            <li><strong>Anything stitched to your measurements cannot be returned.</strong> Fall and pico cuts the fabric. We say so before you tick it, not after.</li>
            <li><strong>Ready to wear is not cheating.</strong> Pre-pleated sarees look the same and take two minutes. Plenty of experienced wearers own one for long days.</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${raw(
          sectionHead({
            eyebrow: 'Put it into practice',
            title: 'Four sarees that forgive a first attempt',
            link: { label: 'Take the four questions', href: '/saree-guide/first-saree/' }
          })
        )}
        <div class="product-grid product-grid--4">
          ${firstSareePicks.map((p, i) => raw(productCard(p, { index: i })))}
        </div>
      </div>
    </section>
  `;

  return page({
    title: 'Saree Guide',
    description:
      'Everything you need to buy your first saree with confidence: fabrics, weaves, draping, blouses, tailoring, measurements and care.',
    path: '/saree-guide/',
    activeKey: 'saree-guide',
    body: html`
      <div class="container" style="padding-block:var(--sp-7) var(--sp-5)">
        ${raw(breadcrumb([{ label: 'Home', href: '/' }, { label: 'Saree Guide' }]))}
        <h1 class="display--xl" style="max-width:24ch">Saree guide</h1>
        <p class="lede mt-5">
          Written for somebody who has never worn one, and useful to somebody who has worn them for
          forty years. No mystique, no invented heritage — just what the words mean and what to
          expect in the parcel.
        </p>
      </div>
      ${body}
    `
  });
}

/* --------------------------- First saree -------------------------- */
export function firstSareePage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow">
        <form class="quiz" data-quiz>
          <div class="quiz__step">
            <h2 class="h3 mb-2">1. Where are you wearing it?</h2>
            <p class="small muted mb-4">This decides weight and formality more than anything else.</p>
            <div class="quiz__options quiz__options--2">
              ${[
                ['wedding-guest', 'A wedding, as a guest', 'A long day, lots of photographs'],
                ['festive', 'A festival or family celebration', 'Diwali, Eid, Navratri, Pongal'],
                ['party', 'An evening party or reception', 'A few hours, indoors, low light'],
                ['everyday', 'Everyday, work or home', 'Comfort over drama']
              ].map(
                ([v, label, note]) => raw(`
                <label class="quiz__option">
                  <input type="radio" name="occasion" value="${v}">
                  <span class="quiz__option__box"><strong>${esc(label)}</strong><span>${esc(note)}</span></span>
                </label>`)
              )}
            </div>
          </div>

          <div class="quiz__step">
            <h2 class="h3 mb-2">2. How do you feel about draping?</h2>
            <p class="small muted mb-4">Be honest — it changes what we show you.</p>
            <div class="quiz__options">
              ${[
                ['rtw', 'I would rather not learn right now', 'We will show you ready-to-wear sarees you step into'],
                ['easy', 'Happy to try, but I want it forgiving', 'Cotton and georgette, which grip rather than slide'],
                ['any', 'I can drape, show me everything', 'No restriction on fabric']
              ].map(
                ([v, label, note]) => raw(`
                <label class="quiz__option">
                  <input type="radio" name="skill" value="${v}">
                  <span class="quiz__option__box"><strong>${esc(label)}</strong><span>${esc(note)}</span></span>
                </label>`)
              )}
            </div>
          </div>

          <div class="quiz__step">
            <h2 class="h3 mb-2">3. Will the room be warm?</h2>
            <p class="small muted mb-4">Silk is warm. A hot hall in July is a real consideration.</p>
            <div class="quiz__options quiz__options--2">
              ${[
                ['warm', 'Warm or crowded', 'Light cotton, georgette, Chanderi'],
                ['cool', 'Cool, or I do not mind', 'Silk is on the table']
              ].map(
                ([v, label, note]) => raw(`
                <label class="quiz__option">
                  <input type="radio" name="warmth" value="${v}">
                  <span class="quiz__option__box"><strong>${esc(label)}</strong><span>${esc(note)}</span></span>
                </label>`)
              )}
            </div>
          </div>

          <div class="quiz__step">
            <h2 class="h3 mb-2">4. What is your budget?</h2>
            <p class="small muted mb-4">Including a blouse and petticoat if you need them.</p>
            <div class="quiz__options quiz__options--2">
              ${[
                ['0-12000', 'Up to £120', ''],
                ['0-20000', 'Up to £200', ''],
                ['0-40000', 'Up to £400', ''],
                ['0-99999', 'No limit', '']
              ].map(
                ([v, label, note]) => raw(`
                <label class="quiz__option">
                  <input type="radio" name="budget" value="${v}">
                  <span class="quiz__option__box"><strong>${esc(label)}</strong>${note ? `<span>${esc(note)}</span>` : ''}</span>
                </label>`)
              )}
            </div>
          </div>

          <div class="quiz__step">
            <button class="btn btn--accent btn--lg" type="submit">Show me what fits</button>
            <button class="btn btn--quiet mt-3" type="reset" data-quiz-reset>Start again</button>
            <p class="small muted mt-4">
              This is a filter, not an algorithm. It narrows our catalogue by the four answers and
              shows you what is left, closest match first.
            </p>
          </div>
        </form>

        <div class="mt-7" data-quiz-results hidden aria-live="polite"></div>

        <noscript>
          <div class="mt-6">
            ${raw(
              notice(
                `<p><strong>This questionnaire needs JavaScript.</strong></p>
                 <p>You can get to the same place with the filters on the
                 <a href="${url('/collections/sarees/')}">Shop Sarees</a> page — filter by occasion,
                 fabric and price, and tick "Ready to wear" if you would rather not drape.</p>`,
                { tone: 'info' }
              )
            )}
          </div>
        </noscript>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container">
        ${raw(
          sectionHead({
            eyebrow: 'If you skip the questions',
            title: 'Four we would put in front of you anyway',
            body: 'Light, grippy and quick to pleat. Two go in the washing machine, one is ready to wear.'
          })
        )}
        <div class="product-grid product-grid--4">
          ${firstSareePicks.map((p, i) => raw(productCard(p, { index: i })))}
        </div>
      </div>
    </section>
  `;

  return page({
    title: 'Find your first saree',
    description: 'Four questions about occasion, draping confidence, warmth and budget, then a short list of sarees that fit.',
    path: '/saree-guide/first-saree/',
    activeKey: 'saree-guide',
    body: html`
      <div class="container container--narrow" style="padding-block:var(--sp-7) 0">
        ${raw(breadcrumb([...GUIDE_CRUMB, { label: 'Find your first saree' }]))}
        <h1 class="h1">Find your first saree</h1>
        <p class="lede mt-4">
          Four questions. No email address, no sign-up, and you can change any answer afterwards.
        </p>
      </div>
      ${body}
    `,
    pageData: 'quiz',
    scripts: ['/assets/js/quiz.mjs']
  });
}

/* ----------------------------- Anatomy ---------------------------- */
export function anatomyPage() {
  const body = html`
    <section class="section">
      <div class="container">
        <figure style="margin:0">
          <img
            src="${url('/assets/img/guide/anatomy.svg')}"
            alt="Labelled diagram of an unstitched saree laid flat. From left to right: the pallu, the decorated end that falls over the shoulder; the body, the field that is pleated at the waist; the border running the full length of both long edges; the lower border where the fall is stitched; and the blouse piece attached at the far end, which arrives as flat unstitched fabric. Total length 5.5 to 6.3 metres, width 105 to 120 centimetres."
            width="1200"
            height="640"
            loading="lazy"
            decoding="async"
            style="background:var(--paper);border:1px solid var(--rule)"
          />
          <figcaption class="small muted mt-3">Diagram, not to scale.</figcaption>
        </figure>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container container--narrow prose">
        <h2 id="parts">The five parts</h2>

        <h3>Pallu</h3>
        <p>
          The decorated end. This is the piece that goes over your left shoulder and hangs down your
          back, so it is the part people see most and the part weavers put the most work into. On a
          Paithani the pallu is a separate tapestry weave. On a Banarasi it is the densest brocade.
          If a saree has one obviously special end, that is the pallu.
        </p>

        <h3>Body</h3>
        <p>
          The long middle section. This is what you pleat at the waist, so it is usually the quietest
          part of the design — small repeating motifs, or nothing at all. A busy body and a busy
          pallu fight each other.
        </p>

        <h3>Border</h3>
        <p>
          The strip running the full length of both long edges. It gives the saree its structure and
          weight at the hem, which is why a saree with a heavy border hangs better. On a Kanjivaram
          the border is woven separately and joined, which is why its colour can be completely
          unrelated to the body.
        </p>

        <h3>Blouse piece</h3>
        <p>
          A length of matching fabric — usually 80 to 90cm — attached to the far end of the saree,
          meant to be cut off and made up into a blouse. <strong>It is flat fabric, not a
          blouse.</strong> If you have never bought a saree before this is the single most common
          surprise, which is why we state it separately on every product page.
        </p>

        <h3>Petticoat and fall</h3>
        <p>
          Neither is part of the saree, but neither is optional. The petticoat is an A-line underskirt
          you tuck the pleats into — it is what the whole drape hangs from, and it is what stops a
          sheer saree being see-through. The <em>fall</em> is a strip of cotton tape sewn inside the
          bottom edge so the hem has enough weight to hang straight rather than flapping.
        </p>

        <h2 id="lengths">Lengths, and which to buy</h2>
        <p>
          Most sarees are 5.5 metres. Some — Kanjivaram, Paithani, and anything intended for a
          traditional nine-yard drape — run 6.3 metres or longer. The extra length is not about your
          height; it is about how many pleats the style needs and how wide the pallu drape is.
        </p>
        <ul>
          <li><strong>5.5 metres</strong> suits the common modern drape (Nivi style) at any height.</li>
          <li><strong>6.3 metres and over</strong> gives a fuller pallu and enough fabric for regional drapes.</li>
          <li><strong>Width</strong> is 105 to 120cm. Wider means a longer drop, so taller wearers usually prefer 115cm and up.</li>
        </ul>

        <p>
          <a class="link link--arrow" href="${url('/saree-guide/draping/')}">Next: how to drape one</a>
        </p>
      </div>
    </section>
  `;

  return guideShell({
    title: 'Anatomy of a saree',
    slug: 'anatomy',
    description: 'The five parts of a saree — pallu, body, border, blouse piece and petticoat — with a labelled diagram.',
    lede: 'Five words that come up constantly, and a diagram that makes all of them obvious.',
    body
  });
}

/* ----------------------------- Draping ---------------------------- */
export function drapingPage() {
  const steps = [
    {
      title: 'Blouse and petticoat first',
      body: 'Put on the fitted blouse and the petticoat. Tie the petticoat at the height you want the saree hem to sit — just clear of the floor, in the shoes you are actually going to wear. Everything else hangs off this, so it is worth getting right.'
    },
    {
      title: 'Tuck the plain end and go round once',
      body: 'Take the plain end (the opposite end to the pallu) and tuck about 10cm into the petticoat waistband at your right hip. Wrap the saree once around yourself, right to left, and come back to the front.'
    },
    {
      title: 'Make five to seven pleats',
      body: 'Gather the fabric into even pleats about 12cm wide, all facing left, holding them together at the top. Do not aim for perfection — aim for even. Tuck the whole bundle into the waistband slightly left of your navel.'
    },
    {
      title: 'Wrap again, then pallu over the shoulder',
      body: 'Take the remaining fabric around yourself once more, bring it up across your front from right hip to left shoulder, and let the pallu fall down your back.'
    },
    {
      title: 'Pin it in two places',
      body: 'One pin at the left shoulder through the blouse seam — through the blouse, not the saree alone, or it will tear. One pin at the waist holding the pleats. That is it.'
    }
  ];

  const body = html`
    <section class="section">
      <div class="container">
        <div class="grid grid--2" style="gap:var(--sp-7)">
          ${steps.map(
            (s, i) => raw(`
            <div>
              <figure style="margin:0 0 var(--sp-4)">
                <img src="${url(`/assets/img/guide/drape-${i + 1}.svg`)}"
                     alt="Step ${i + 1}: ${esc(s.title)}. Line diagram of a figure showing the fabric path described in the text."
                     width="640" height="800" loading="lazy" decoding="async"
                     style="background:var(--paper);border:1px solid var(--rule)">
              </figure>
              <p class="eyebrow eyebrow--accent">Step ${i + 1} of 5</p>
              <h2 class="h3 mt-2 mb-3">${esc(s.title)}</h2>
              <p>${esc(s.body)}</p>
            </div>`)
          )}
          <div>
            <h2 class="h3 mb-4">The three mistakes everybody makes</h2>
            <ol class="prose">
              <li><strong>Tying the petticoat too low.</strong> The hem then drags and you spend the evening standing on it. Tie it at your natural waist, not your hips.</li>
              <li><strong>Pinning through the saree alone.</strong> A pin carrying the weight of a pallu will tear a hole in silk. Always catch the blouse seam.</li>
              <li><strong>Too many pleats.</strong> Five wide pleats hang better than nine narrow ones, and they are far easier to tuck as one bundle.</li>
            </ol>
            <div class="mt-5">
              ${raw(
                notice(
                  `<p><strong>Practise before the day, not on the day.</strong></p>
                   <p>Ten minutes in front of a mirror the week before is the difference between
                   enjoying an event and worrying about your hem. If that sounds like too much, a
                   <a href="${url('/collections/ready-to-wear/')}">ready-to-wear saree</a> takes two
                   minutes and nobody can tell.</p>`,
                  { tone: 'accent', iconName: 'drape' }
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container container--narrow prose">
        <h2>Difficulty, by fabric</h2>
        <p>
          We rate every saree out of five for how hard it is to pleat and pin. This is our own
          judgement, not an industry standard, and it is on every product page.
        </p>
        ${raw(
          `<div class="table-scroll mt-5" style="max-width:none">
            <table class="table">
              <thead><tr><th scope="col">Rating</th><th scope="col">Means</th><th scope="col">Typically</th></tr></thead>
              <tbody>
                ${Object.entries(drapeDifficulty)
                  .map(
                    ([lvl, d]) =>
                      `<tr><th scope="row">${easeMeter(Number(lvl))}</th><td>${esc(d.label)}</td><td>${esc(d.plain)}</td></tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        )}
        <p class="mt-5">
          <a class="link link--arrow" href="${url('/saree-guide/fabrics/')}">Next: fabrics compared</a>
        </p>
      </div>
    </section>
  `;

  return guideShell({
    title: 'How to drape a saree',
    slug: 'draping',
    description: 'Five steps to drape a saree in the Nivi style, with diagrams, plus the three mistakes everybody makes first time.',
    lede: 'Five steps, in the order you actually do them. Allow twenty minutes the first time and ten after that.',
    body
  });
}

/* ----------------------------- Fabrics ---------------------------- */
export function fabricsPage() {
  const rows = fabrics.map((f) => {
    const items = products.filter((p) => p.fabric === f.id && p.type === 'saree');
    const avgDiff = items.length
      ? Math.round(items.reduce((s, p) => s + (p.attributes.drapeDifficulty || 3), 0) / items.length)
      : null;
    return { f, items, avgDiff };
  });

  const body = html`
    <section class="section">
      <div class="container">
        <div class="table-scroll">
          <table class="table table--compare">
            <caption>Our own comparison, based on the pieces we stock. ${raw(sampleTag('Sample catalogue'))}</caption>
            <thead>
              <tr>
                <th scope="col">Fabric</th>
                <th scope="col">Feels like</th>
                <th scope="col">To wear</th>
                <th scope="col">Draping</th>
                <th scope="col" class="numeric">In stock</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(
                ({ f, items, avgDiff }) => raw(`
                <tr>
                  <th scope="row">${esc(f.label)}</th>
                  <td>${esc(f.plain)}</td>
                  <td>${esc(f.wearNote)}</td>
                  <td>${avgDiff ? easeMeter(avgDiff) : '<span class="muted">—</span>'}<br><span class="xs muted">${esc(f.ease)}</span></td>
                  <td class="numeric">${
                    items.length
                      ? `<a class="link" href="${url(`/collections/sarees/?fabric=${f.id}`)}">${items.length}</a>`
                      : '<span class="muted">0</span>'
                  }</td>
                </tr>`)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container container--narrow prose">
        <h2>Choosing by what matters to you</h2>

        <h3>If you have never draped one</h3>
        <p>
          <strong>Cotton or georgette.</strong> Both grip themselves instead of sliding. Handloom
          cotton is the most forgiving fabric there is, and it goes in the washing machine. Georgette
          gives you the light, fluid look people usually want, with a crinkled surface that stops it
          slipping the way chiffon does.
        </p>

        <h3>If the room will be hot</h3>
        <p>
          <strong>Kota Doria, Chanderi or plain cotton.</strong> All under 300g, all open enough to
          breathe. Avoid pure silk and anything with dense embroidery — the weight is the problem, not
          the fibre.
        </p>

        <h3>If you want it to photograph well</h3>
        <p>
          <strong>Silk or satin for shine, organza for shape, sequins for low light.</strong> Matte
          fabrics like Mysore crepe and linen look wonderful in person and quieter in photographs.
          Sequin and zari work reads best under flash and in the evening.
        </p>

        <h3>If you want it to last decades</h3>
        <p>
          <strong>Handloom silk or handloom cotton.</strong> Both improve with age when stored
          properly. Polyester georgette and chiffon are practical and travel well, but they will not
          become heirlooms, and we would rather say so than imply otherwise.
        </p>

        <h3>If you are worried about creasing</h3>
        <p>
          <strong>Georgette resists it best.</strong> Linen and cotton crease readily and are meant
          to. Organza creases permanently, which is why we tell you to store it rolled rather than
          folded.
        </p>

        <p class="mt-6">
          <a class="link link--arrow" href="${url('/saree-guide/weaves/')}">Next: weaves and regional styles</a>
        </p>
      </div>
    </section>
  `;

  return guideShell({
    title: 'Fabrics compared',
    slug: 'fabrics',
    description: 'Silk, cotton, chiffon, georgette, organza and linen compared by weight, sheerness, warmth and how hard each is to drape.',
    lede: 'Fabric decides how a saree feels, how warm it is, and how hard it is to put on — far more than price does.',
    body
  });
}

/* ------------------------------ Weaves ---------------------------- */
export function weavesPage() {
  const list = weaves.filter((w) => w.id !== 'none');
  const body = html`
    <section class="section">
      <div class="container container--narrow">
        ${raw(
          notice(
            `<p><strong>How we word provenance claims</strong></p>
             <p>
               A weave name is a factual claim about how something was made, so we grade our
               confidence rather than assert it. Every product page says which of these applies:
             </p>
             <ul class="small mt-2">
               <li><strong>Handloom, supplier declared</strong> — the supplier states it in writing and names the cluster. We hold the declaration; we have not audited the loom.</li>
               <li><strong>Mill described, not verified</strong> — a mill described the weave to us and we could not confirm it.</li>
               <li><strong>Inspired by the tradition</strong> — the design references a tradition but is not made in it. Usually a print.</li>
               <li><strong>Powerloom woven</strong> — machine woven, even and lower cost.</li>
             </ul>`,
            { tone: 'accent', iconName: 'info' }
          )
        )}
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="grid grid--2" style="gap:var(--sp-6)">
          ${list.map((w) => {
            const items = products.filter((p) => p.weave === w.id);
            return raw(`
            <article id="${w.id}" style="border-top:2px solid var(--ink);padding-top:var(--sp-4)">
              <h2 class="h3">${esc(w.label)}</h2>
              <p class="eyebrow mt-2">${esc(w.region || 'Contemporary')}</p>
              <p class="mt-3">${esc(w.plain)}</p>
              ${
                w.marker
                  ? `<p class="small mt-3" style="color:var(--wine)"><strong>How to spot it:</strong> ${esc(w.marker)}</p>`
                  : ''
              }
              ${
                items.length
                  ? `<p class="small mt-3"><a class="link link--arrow" href="${url(
                      `/collections/sarees/?weave=${w.id}`
                    )}">${items.length} in stock</a></p>`
                  : `<p class="small muted mt-3">None in stock at the moment.</p>`
              }
            </article>`);
          })}
        </div>
      </div>
    </section>
  `;

  return guideShell({
    title: 'Weaves and regional styles',
    slug: 'weaves',
    description: 'Kanjivaram, Banarasi, Chanderi, Jamdani, ikat, patola and more — what defines each weave and how to recognise it.',
    lede: 'What actually makes a Kanjivaram a Kanjivaram, and how to check for yourself rather than taking anyone’s word for it.',
    body
  });
}

/* --------------------------- Ready to wear ------------------------ */
export function readyToWearPage() {
  const rtw = products.filter((p) => p.readyToWear && p.type === 'saree');
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="what">What is actually stitched</h2>
        <p>
          A ready-to-wear saree is a real saree that has had three things done to it. The pleats are
          folded and sewn permanently onto a fitted waistband. A concealed zip is set into the side
          seam. And the pallu is pre-pleated and stitched so it falls at a set length over the left
          shoulder.
        </p>
        <p>
          What is <em>not</em> different: the fabric, the border, the pallu design, the drape. Once
          it is on, it looks like a saree, because it is one. The pleats are usually deeper and more
          even than most people achieve by hand.
        </p>

        <h2 id="sizing">Why sizing matters here and not on an unstitched saree</h2>
        <p>
          An unstitched saree has no size — you pleat six metres of cloth to your own body. A
          ready-to-wear saree has a fitted waistband, so it does have a size, and it has to be the
          right one. We size to body measurements with 4cm of ease built in, and every product page
          carries the chart in centimetres and inches.
        </p>
        <p>
          <strong>Measure your waist where you want the saree to sit</strong> — usually the natural
          waist — and your hip at the fullest point. If you are between sizes, take the larger.
        </p>

        <h2 id="when-not">When ready to wear is the wrong choice</h2>
        <ul>
          <li><strong>If you want to re-drape it differently.</strong> The pleats are permanent, so regional drapes are off the table.</li>
          <li><strong>If your measurements are likely to change.</strong> There is 3cm of allowance in the waistband and no more.</li>
          <li><strong>If it is an heirloom piece.</strong> Converting a Kanjivaram is irreversible. Lovely to wear, impossible to undo.</li>
          <li><strong>If you want to learn.</strong> Draping is a genuinely satisfying skill and it takes one afternoon.</li>
        </ul>

        <h2 id="convert">Converting a saree you already own</h2>
        <p>
          We convert sarees to ready to wear for ${raw(formatMoney(services.readyToWearConversion.price))},
          which takes about ${services.readyToWearConversion.leadDays} working days on top of normal
          dispatch. We need three measurements — waist, hip, and waist-to-floor barefoot.
        </p>
        <p>
          It is irreversible, and it cannot be returned afterwards because it has been cut and sewn
          to your measurements. We say that next to the option before you tick it, not in the small
          print afterwards.
        </p>
        <p><a class="link link--arrow" href="${url('/saree-guide/tailoring/#conversion')}">Conversion detail and lead times</a></p>
      </div>
    </section>

    <section class="section section--sand">
      <div class="container">
        ${raw(sectionHead({ eyebrow: 'In stock', title: 'Ready-to-wear sarees', link: { label: 'Shop all', href: '/collections/ready-to-wear/' } }))}
        <div class="product-grid product-grid--4">
          ${rtw.map((p, i) => raw(productCard(p, { index: i })))}
        </div>
      </div>
    </section>
  `;

  return guideShell({
    title: 'How ready to wear works',
    slug: 'ready-to-wear',
    description: 'Pre-pleated sarees explained: what is stitched, how sizing works, when it is the wrong choice, and how conversion works.',
    lede: 'A saree with the pleats sewn in and a zip at the side. Two minutes to put on, and nobody can tell.',
    body,
    toc: toc([
      { id: 'what', label: 'What is actually stitched' },
      { id: 'sizing', label: 'Why sizing matters here' },
      { id: 'when-not', label: 'When it is the wrong choice' },
      { id: 'convert', label: 'Converting a saree you own' }
    ])
  });
}

/* ----------------------------- Tailoring -------------------------- */
export function tailoringPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        ${raw(
          notice(
            `<p><strong>The one thing to know before you order any of this.</strong></p>
             <p>
               Anything we cut or stitch to your measurements cannot be returned, because it has been
               made for you and cannot be sold to anybody else. That is stated next to each service on
               the product page before you tick it. If the finished item does not match the
               measurements you gave us, that is our error and we will put it right or refund you in
               full.
             </p>`,
            { tone: 'warn', iconName: 'alert' }
          )
        )}

        <h2 id="fall-and-pico">Fall and pico — ${raw(formatMoney(services.fallPico.price))}</h2>
        <p>
          Two separate jobs, almost always done together, and the single best ${raw(formatMoney(services.fallPico.price))}
          you can spend on a saree.
        </p>
        <p>
          <strong>Fall</strong> is a strip of cotton tape sewn inside the bottom edge along the length
          of the saree. It adds just enough weight for the hem to hang straight and the pleats to sit
          properly instead of flapping and riding up. On any light fabric the difference is obvious
          immediately.
        </p>
        <p>
          <strong>Pico</strong> is a narrow rolled hem finishing the raw cut edges so they cannot
          fray. A new saree usually arrives with unfinished edges, and without pico they will start to
          unravel within a few wearings.
        </p>
        <p>
          Adds ${services.fallPico.leadDays} working days before dispatch.
          <strong>Not returnable once stitched</strong> — the fabric is cut.
        </p>

        <h2 id="blouse-stitching">Blouse stitching — ${raw(formatMoney(services.blouseStitching.price))}</h2>
        <p>
          Most of our sarees include a blouse piece: 80 to 90cm of matching fabric, attached to the
          end of the saree, that arrives as <strong>flat cloth rather than a blouse</strong>. This
          service cuts and stitches it to your measurements.
        </p>
        <p>You choose a neckline and a sleeve length, and give us five measurements:</p>
        <ul>
          ${measurementFields.map((f) => raw(`<li><strong>${esc(f.label)}</strong> — ${esc(f.help)}</li>`))}
        </ul>
        <p>
          Adds ${services.blouseStitching.leadDays} working days. The finished blouse is fully lined,
          fastens with concealed hooks at the back, and has 3cm of seam allowance inside both side
          seams so a local tailor can take it in later.
        </p>
        <p>
          <a class="link link--arrow" href="${url('/saree-guide/measurements/')}">How to take each measurement</a>
        </p>

        <h2 id="conversion">Ready-to-wear conversion — ${raw(formatMoney(services.readyToWearConversion.price))}</h2>
        <p>
          We pre-pleat the saree, stitch the pleats onto a fitted waistband with a concealed side zip,
          and set the pallu so it stays where it is put. You step into it like a skirt.
        </p>
        <p>We need three measurements:</p>
        <ul>
          ${rtwMeasurementFields.map((f) => raw(`<li><strong>${esc(f.label)}</strong> — ${esc(f.help)}</li>`))}
        </ul>
        <p>
          Adds ${services.readyToWearConversion.leadDays} working days.
          <strong>It is irreversible</strong> — we cannot unpick it back to a plain saree afterwards —
          and it cannot be returned once made.
        </p>

        <h2 id="using-your-own-tailor">Using your own tailor instead</h2>
        <p>
          Completely reasonable, and often better if you already have somebody who knows your fit. The
          blouse piece is included with the saree either way, and you lose nothing by declining our
          stitching. A saree that has not been cut or stitched stays fully returnable for 30 days,
          which is worth weighing if you are not certain about the colour.
        </p>

        <h2 id="lead-times">Lead times, added up</h2>
        ${raw(
          `<div class="table-scroll" style="max-width:none">
            <table class="table">
              <caption>Working days added before dispatch, on top of normal handling. ${sampleTag('Sample')}</caption>
              <thead><tr><th scope="col">Service</th><th scope="col" class="numeric">Cost</th><th scope="col" class="numeric">Extra days</th><th scope="col">Measurements</th><th scope="col">Returnable</th></tr></thead>
              <tbody>
                ${Object.values(services)
                  .map(
                    (s) => `<tr>
                  <th scope="row">${esc(s.label)}</th>
                  <td class="numeric">${formatMoney(s.price)}</td>
                  <td class="numeric">+${s.leadDays}</td>
                  <td>${s.requiresMeasurements ? 'Yes' : 'No'}</td>
                  <td>No, once stitched</td>
                </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        )}
        <p class="mt-5">
          Product pages recalculate the delivery estimate as you tick each service, so you always see
          the real date rather than the base one.
        </p>
      </div>
    </section>
  `;

  return guideShell({
    title: 'Blouses and tailoring',
    slug: 'tailoring',
    description: 'Blouse stitching, fall and pico, and ready-to-wear conversion — costs, lead times, measurements needed and the effect on returns.',
    lede: 'Three optional services, what each one actually does, and what it costs you in money, days and returnability.',
    body,
    toc: toc([
      { id: 'fall-and-pico', label: 'Fall and pico' },
      { id: 'blouse-stitching', label: 'Blouse stitching' },
      { id: 'conversion', label: 'Ready-to-wear conversion' },
      { id: 'using-your-own-tailor', label: 'Using your own tailor' },
      { id: 'lead-times', label: 'Lead times, added up' }
    ])
  });
}

/* --------------------------- Measurements ------------------------- */
export function measurementsPage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="how">Before you start</h2>
        <ul>
          <li>Measure over light clothing or underwear, not over a jumper.</li>
          <li>Keep the tape level all the way round — check the back in a mirror.</li>
          <li>Snug, not tight. You should be able to slide one finger under the tape.</li>
          <li>Breathe normally. Do not hold your breath or pull your stomach in.</li>
          <li>Write them down in one unit and stick to it. Mixing them up is the commonest error, and it is the one our forms are designed to catch.</li>
        </ul>

        <h2 id="blouse">For a stitched blouse</h2>
        <dl class="spec-list">
          ${measurementFields.map(
            (f) => raw(`<div><dt>${esc(f.label)}</dt><dd>${esc(f.help)}<em>Accepted range ${f.minCm}–${f.maxCm}cm (${Math.round(
              f.minCm / 2.54
            )}–${Math.round(f.maxCm / 2.54)}in)</em></dd></div>`)
          )}
        </dl>

        <h2 id="rtw">For a ready-to-wear conversion</h2>
        <dl class="spec-list">
          ${rtwMeasurementFields.map(
            (f) => raw(`<div><dt>${esc(f.label)}</dt><dd>${esc(f.help)}<em>Accepted range ${f.minCm}–${f.maxCm}cm (${Math.round(
              f.minCm / 2.54
            )}–${Math.round(f.maxCm / 2.54)}in)</em></dd></div>`)
          )}
        </dl>

        <h2 id="chart">Size chart</h2>
        <p>
          These are <strong>body</strong> measurements, not garment measurements. Ready-to-wear
          sarees and stitched blouses add their own ease on top — 4cm at the waist for a saree, 4 to
          5cm at the bust for a blouse.
        </p>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        <div class="table-scroll">
          <table class="table">
            <caption>Body measurements in centimetres and inches.</caption>
            <thead>
              <tr>
                <th scope="col">UK size</th>
                <th scope="col" class="numeric">Bust</th>
                <th scope="col" class="numeric">Waist</th>
                <th scope="col" class="numeric">Hip</th>
              </tr>
            </thead>
            <tbody>
              ${sizeChart.map(
                (r) => raw(`<tr>
                <th scope="row">${esc(r.size)}</th>
                <td class="numeric">${r.bustCm}cm / ${r.bustIn}in</td>
                <td class="numeric">${r.waistCm}cm / ${r.waistIn}in</td>
                <td class="numeric">${r.hipCm}cm / ${r.hipIn}in</td>
              </tr>`)
              )}
            </tbody>
          </table>
        </div>

        <div class="container--narrow prose mt-6" style="padding:0">
          <h2 id="between">If you are between sizes</h2>
          <p>
            <strong>Take the larger one.</strong> Every stitched blouse we make has 3cm of seam
            allowance inside both side seams, so a tailor can take it in easily. Letting a garment
            out beyond that allowance is not possible.
          </p>

          <h2 id="unstitched">And if you are buying an unstitched saree?</h2>
          <p>
            Then none of this applies. An unstitched saree has no size — it is one length of cloth
            that you pleat to your own body, and the same saree fits a UK 6 and a UK 26. You only
            need measurements if you are adding blouse stitching or a ready-to-wear conversion.
          </p>

          <h2 id="help">Still not sure</h2>
          <p>
            Email us with your measurements and what you are ordering and we will tell you what we
            would stitch. We would rather spend five minutes now than remake a blouse later.
            <a class="link" href="mailto:${site.contact.email}">${site.contact.email}</a>
          </p>
        </div>
      </div>
    </section>
  `;

  return guideShell({
    title: 'Measurements',
    slug: 'measurements',
    description: 'How to take every measurement we ask for, in centimetres and inches, with the full UK size chart.',
    lede: 'Where the tape goes for each measurement, what range we expect, and what to do if you are between sizes.',
    body,
    toc: toc([
      { id: 'how', label: 'Before you start' },
      { id: 'blouse', label: 'For a stitched blouse' },
      { id: 'rtw', label: 'For a ready-to-wear conversion' },
      { id: 'chart', label: 'Size chart' },
      { id: 'between', label: 'If you are between sizes' },
      { id: 'unstitched', label: 'Buying an unstitched saree' }
    ])
  });
}

/* ------------------------------- Care ----------------------------- */
export function carePage() {
  const body = html`
    <section class="section">
      <div class="container container--narrow prose">
        <h2 id="first">Before the first wear</h2>
        <ul>
          <li>Add fall and pico if it does not already have them. Unfinished edges fray within a few wearings.</li>
          <li>Hang it for a day so fold creases drop out before you try to press them.</li>
          <li>Check the care line on the product page. "Dry clean only" usually means water will mark it, not that we are being cautious.</li>
        </ul>

        <h2 id="washing">Washing</h2>
        <p>
          <strong>Cotton and linen:</strong> hand wash cold, or machine wash at 30°C in a mesh bag on
          a gentle cycle. Wash a new indigo or high-contrast piece on its own for the first three
          washes — the dye will bleed, and that is normal rather than a fault.
        </p>
        <p>
          <strong>Silk and silk blends:</strong> dry clean unless the product page says otherwise.
          Ordinary laundry detergent contains enzymes that digest protein, and silk is a protein
          fibre, so a normal wash will dull it permanently. If a page does permit hand washing, use a
          pH-neutral, enzyme-free detergent in cold water, never wring, and dry flat in shade.
        </p>
        <p>
          <strong>Polyester georgette and chiffon:</strong> hand wash cold and hang to dry. They are
          the most practical fabrics we sell.
        </p>

        <h2 id="stains">Spills</h2>
        <p>
          Blot, never rub. Rubbing lifts surface fibres and leaves a dull patch that no cleaning will
          restore. Lift what you can with a dry cloth, then take it to a cleaner and tell them what
          it was — guessing is what sets stains permanently.
        </p>

        <h2 id="ironing">Ironing</h2>
        <ul>
          <li>Iron on the reverse, always, through a clean cotton cloth if there is any zari or embroidery.</li>
          <li>Never press directly onto zari. The metallic thread will flatten and lose its light, and it will not come back.</li>
          <li>Cotton and linen iron best while very slightly damp.</li>
          <li>Polyester melts. Use the lowest setting or a steamer.</li>
        </ul>

        <h2 id="storage">Storage — where most damage happens</h2>
        <ul>
          <li><strong>Never store in plastic.</strong> A plastic cover traps moisture against the fabric, and trapped damp is what yellows silk and tarnishes zari. Use a breathable cotton or muslin bag.</li>
          <li><strong>Refold once a year along different lines.</strong> A fold left in the same place for years becomes a permanent weak line, and zari cracks along it.</li>
          <li><strong>Roll organza and heavily sequinned pieces</strong> rather than folding them. Organza keeps creases permanently.</li>
          <li><strong>Keep it out of direct light.</strong> Sunlight fades natural dyes and yellows the natural gold of tussar.</li>
          <li><strong>Use cedar or dried neem in the wardrobe</strong> against moths, not mothballs against the fabric.</li>
        </ul>

        <h2 id="heirloom">Heavy silks, once a year</h2>
        <p>
          A Kanjivaram or a Paithani will outlive you if it is looked after. Air it once a year, refold
          it differently, and have it professionally cleaned only when it actually needs it — every dry
          clean takes a little life out of the fibre, so cleaning a saree "just in case" does more harm
          than leaving it alone.
        </p>
      </div>
    </section>
  `;

  return guideShell({
    title: 'Caring for your saree',
    slug: 'care',
    description: 'Washing, ironing, storing and repairing sarees — including why plastic covers are how silk yellows.',
    lede: 'Most saree damage happens in storage, not in wearing. Ten minutes of habit keeps a silk alive for decades.',
    body,
    toc: toc([
      { id: 'first', label: 'Before the first wear' },
      { id: 'washing', label: 'Washing' },
      { id: 'stains', label: 'Spills' },
      { id: 'ironing', label: 'Ironing' },
      { id: 'storage', label: 'Storage' },
      { id: 'heirloom', label: 'Heavy silks, once a year' }
    ])
  });
}

/* ----------------------------- Glossary --------------------------- */
const GLOSSARY = [
  ['Bandhani', 'A tie-dye technique from Kutch where thousands of tiny points are bound with thread before dyeing, leaving a field of small dots.'],
  ['Banarasi', 'Silk from Varanasi with dense raised brocade patterning, traditionally in metallic zari thread.'],
  ['Blouse piece', 'A length of matching fabric — usually 80 to 90cm — attached to the end of a saree, meant to be made up into a blouse. It arrives as flat cloth, not a blouse.'],
  ['Body', 'The long middle section of a saree, the part you pleat at the waist.'],
  ['Border', 'The decorated strip running the full length of both long edges of a saree. Gives weight and structure at the hem.'],
  ['Buti', 'A small woven motif scattered across the body of a saree. Chanderi is known for silver buti.'],
  ['Chanderi', 'A fine silk-cotton from Madhya Pradesh that is sheer, glossy and almost weightless.'],
  ['Fall', 'A strip of cotton tape sewn inside the bottom edge of a saree so the hem hangs straight instead of flapping.'],
  ['Georgette', 'A light crinkled crepe weave. Similar weight to chiffon but with more grip, which makes it far easier to drape.'],
  ['Ikat', 'A technique where threads are tied off and dyed before weaving, giving every shape a soft feathered edge that printing cannot reproduce.'],
  ['Jaal', 'An all-over net or trellis pattern covering the body of a saree.'],
  ['Jamdani', 'A Bengali technique where motifs are added by hand on the loom, one supplementary thread at a time, so the pattern appears to float in the cloth.'],
  ['Kanjivaram', 'A heavy silk from Kanchipuram where body and border are woven separately and joined, which is why the border colour can be entirely different.'],
  ['Katan', 'A pure silk yarn made of twisted filaments, used for the ground of many Banarasi sarees.'],
  ['Khat', 'The square checks in a Kota Doria weave.'],
  ['Kota Doria', 'An open square-checked weave from Rajasthan, exceptionally light and airy.'],
  ['Maheshwari', 'A light silk-cotton from Madhya Pradesh with a reversible striped border, designed to be worn either way round.'],
  ['Mysore crepe', 'Silk with heavily twisted threads, giving a fine pebbled surface, a matte sheen and a very fluid fall.'],
  ['Nivi', 'The most common modern drape: pleats at the front, pallu over the left shoulder. What our draping guide teaches.'],
  ['Organza', 'A crisp, sheer, papery fabric that holds its own shape, so pleats stand away from the body.'],
  ['Paithani', 'Silk from Maharashtra with a tapestry-woven pallu, often a peacock or lotus, and an oblique interlocked border.'],
  ['Pallu', 'The decorated end of a saree, the part that falls over your shoulder. Usually where the heaviest work is.'],
  ['Patola', 'A double ikat from Patan where both warp and weft threads are tie-dyed, so the design reads identically on both faces.'],
  ['Petticoat', 'An A-line underskirt worn beneath a saree. The pleats tuck into its waistband, and it stops a sheer saree being see-through.'],
  ['Pico', 'A narrow rolled hem finishing the raw cut edges of a saree so they cannot fray.'],
  ['Pleats', 'The folds gathered at the front of a saree and tucked into the petticoat. Five to seven wide pleats work better than many narrow ones.'],
  ['Pochampally', 'An ikat tradition from Telangana, usually working in bold geometry — diamonds, chevrons, stepped forms.'],
  ['Powerloom', 'Machine weaving. Even, fast and lower in cost than handloom, without the small irregularities of hand work.'],
  ['Ready to wear', 'A saree with the pleats stitched permanently onto a fitted waistband with a concealed zip. Takes about two minutes to put on.'],
  ['Sambalpuri', 'An Odisha ikat tradition, typically with shankha, chakra and flower motifs in a high-contrast palette.'],
  ['Saree', 'A single length of unstitched cloth, 5.5 to 6.5 metres long, draped around the body. Also spelled sari.'],
  ['Selvedge', 'The finished self-edge along the length of woven cloth, which does not need hemming.'],
  ['Slub', 'A thicker section in a thread, giving fabrics like tussar their uneven texture. A characteristic, not a flaw.'],
  ['Tussar', 'A wild silk with a deeper honey-gold tone and a drier, coarser texture than cultivated mulberry silk.'],
  ['Zari', 'Metallic thread — historically silver or gold, now usually a metallised polyester — woven in to make borders and motifs catch the light.']
];

export function glossaryPage() {
  const letters = [...new Set(GLOSSARY.map(([t]) => t[0].toUpperCase()))].sort();
  const body = html`
    <section class="section">
      <div class="container container--narrow">
        <nav aria-label="Jump to letter" class="cluster mb-6">
          ${letters.map((l) => raw(`<a class="btn btn--quiet btn--sm" href="#letter-${l}">${l}</a>`))}
        </nav>

        ${letters.map((l) =>
          raw(`
          <h2 class="h3 mt-6 mb-4" id="letter-${l}" style="border-bottom:1px solid var(--rule);padding-bottom:var(--sp-2)">${l}</h2>
          <dl class="spec-list">
            ${GLOSSARY.filter(([t]) => t[0].toUpperCase() === l)
              .map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`)
              .join('')}
          </dl>`)
        )}
      </div>
    </section>
  `;

  return guideShell({
    title: 'Glossary',
    slug: 'glossary',
    description: 'Every saree term we use, explained in plain English — from bandhani to zari.',
    lede: 'Every specialist word on this site, in plain English. If we use a term anywhere without explaining it, that is a bug — tell us.',
    body
  });
}

export { GLOSSARY };
