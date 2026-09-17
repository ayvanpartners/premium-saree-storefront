/* ------------------------------------------------------------------ *
 * Contact form. Validates properly, then says plainly that no backend
 * is connected — rather than showing a success message for a message
 * that was never sent.
 * ------------------------------------------------------------------ */

import { setFieldError, focusFirstError, announce } from './ui.mjs';

const form = document.querySelector('[data-contact-form]');
const ok = document.querySelector('[data-contact-ok]');

if (form) {
  const rules = {
    cname: (v) => (v.trim() ? null : 'Enter your name so we know who we are replying to.'),
    cemail: (v) =>
      !v.trim()
        ? 'Enter your email address so we can reply.'
        : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
          ? null
          : 'That does not look like an email address. Check for a missing @ or a typo in the domain.',
    cmessage: (v) =>
      !v.trim()
        ? 'Tell us what you need and we will take it from there.'
        : v.trim().length < 10
          ? 'A little more detail will get you a more useful reply.'
          : null
  };

  for (const [id, rule] of Object.entries(rules)) {
    const input = document.getElementById(id);
    if (!input) continue;
    const run = () => {
      const message = rule(input.value);
      setFieldError(input, message);
      return !message;
    };
    input.addEventListener('blur', run);
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') run();
    });
    input.__validate = run;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    for (const id of Object.keys(rules)) {
      const input = document.getElementById(id);
      if (input && input.__validate && !input.__validate()) valid = false;
    }
    if (!valid) {
      announce('Some details need attention before this can be sent.');
      focusFirstError(form);
      if (ok) ok.hidden = true;
      return;
    }

    if (ok) {
      ok.innerHTML =
        'Your message passed validation — but <strong>nothing has been sent</strong>, because no email backend is connected to this demonstration. In a live build this would reach the customer service inbox and you would get a reply within one working day.';
      ok.hidden = false;
      ok.style.color = 'var(--warn)';
      ok.setAttribute('role', 'status');
      ok.focus?.();
    }
    announce('Validation passed. Nothing was sent — this is a demonstration with no email backend.');
  });
}
