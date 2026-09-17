/* ------------------------------------------------------------------ *
 * UI primitives: focus management, drawers, dialogs, toasts and the
 * screen-reader live region.
 *
 * Accessibility decisions worth knowing about:
 *  - Opening a drawer moves focus into it, traps Tab inside it, and
 *    returns focus to the trigger on close.
 *  - Escape closes the topmost layer only.
 *  - Scroll is locked on <body> while a layer is open, and the scroll
 *    position is restored afterwards.
 *  - Toasts never steal focus. Text goes to a polite live region so a
 *    screen reader hears it without the keyboard moving.
 * ------------------------------------------------------------------ */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

export function focusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

let scrollY = 0;
let openLayers = 0;

function lockScroll() {
  if (openLayers === 0) {
    scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.dataset.scrollLocked = 'true';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }
  openLayers += 1;
}

function unlockScroll() {
  openLayers = Math.max(0, openLayers - 1);
  if (openLayers === 0) {
    delete document.body.dataset.scrollLocked;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  }
}

/* ------------------------------ Drawers --------------------------- */
const stack = [];

export function openDrawer(id, trigger) {
  const drawer = document.getElementById(id);
  if (!drawer) return;
  const overlay = document.querySelector('[data-overlay]');

  drawer.dataset.open = 'true';
  drawer.removeAttribute('inert');
  if (overlay) {
    overlay.hidden = false;
    // Next frame so the opacity transition has a starting point.
    requestAnimationFrame(() => {
      overlay.dataset.open = 'true';
    });
  }
  lockScroll();

  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  stack.push({ id, trigger, type: 'drawer' });

  const first = focusables(drawer)[0];
  (first || drawer).focus({ preventScroll: true });
  drawer.addEventListener('keydown', trapKeydown);
}

export function closeDrawer(id) {
  const entry = id ? stack.find((s) => s.id === id) : stack[stack.length - 1];
  if (!entry) return;
  const drawer = document.getElementById(entry.id);
  if (!drawer) return;

  drawer.dataset.open = 'false';
  drawer.removeEventListener('keydown', trapKeydown);
  const idx = stack.indexOf(entry);
  if (idx > -1) stack.splice(idx, 1);

  if (entry.trigger) {
    entry.trigger.setAttribute('aria-expanded', 'false');
    entry.trigger.focus({ preventScroll: true });
  }

  const overlay = document.querySelector('[data-overlay]');
  if (overlay && stack.length === 0) {
    overlay.dataset.open = 'false';
    const hide = () => {
      if (stack.length === 0) overlay.hidden = true;
    };
    // Match the CSS transition, but do not depend on the event firing.
    setTimeout(hide, 360);
  }
  unlockScroll();
  // Leave the panel out of the accessibility tree once it is off-screen.
  setTimeout(() => {
    if (drawer.dataset.open !== 'true') drawer.setAttribute('inert', '');
  }, 360);
}

export function closeAllDrawers() {
  while (stack.length) closeDrawer(stack[stack.length - 1].id);
}

function trapKeydown(e) {
  if (e.key !== 'Tab') return;
  const root = e.currentTarget;
  const items = focusables(root);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function isDrawerOpen(id) {
  return stack.some((s) => s.id === id);
}

/* ------------------------------ Dialogs --------------------------- */
export function openDialog(id, trigger) {
  const dialog = document.getElementById(id);
  if (!dialog || typeof dialog.showModal !== 'function') return null;
  dialog.__trigger = trigger || document.activeElement;
  dialog.showModal();
  return dialog;
}

export function closeDialog(dialog) {
  if (!dialog) return;
  dialog.close();
}

document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-close-dialog]');
  if (closer) {
    const dialog = closer.closest('dialog');
    closeDialog(dialog);
  }
});

document.addEventListener('close', (e) => {
  const dialog = e.target;
  if (dialog instanceof HTMLDialogElement && dialog.__trigger) {
    dialog.__trigger.focus({ preventScroll: true });
    dialog.__trigger = null;
  }
});

/* Click on the backdrop closes the dialog. */
document.addEventListener('mousedown', (e) => {
  if (e.target instanceof HTMLDialogElement && e.target.open) {
    const box = e.target.getBoundingClientRect();
    const inside =
      e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
    if (!inside) e.target.close();
  }
});

/* ------------------------------- Escape --------------------------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const openNative = document.querySelector('dialog[open]');
  if (openNative) return; // <dialog> handles its own Escape.
  if (stack.length) {
    e.preventDefault();
    closeDrawer();
    return;
  }
  // Fall through to panels that manage themselves (mega nav, search).
  document.dispatchEvent(new CustomEvent('ui:escape'));
});

/* ------------------------------- Toasts --------------------------- */
let toastId = 0;

export function toast(message, { tone = 'ok', action = null, duration = 6000, title = null } = {}) {
  const region = document.querySelector('[data-toast-region]');
  announce(`${title ? title + '. ' : ''}${message}`);
  if (!region) return;

  const id = `toast-${++toastId}`;
  const el = document.createElement('div');
  el.className = `toast${tone === 'err' ? ' toast--err' : ''}`;
  el.id = id;

  const body = document.createElement('div');
  body.className = 'toast__body';
  if (title) {
    const strong = document.createElement('strong');
    strong.textContent = title;
    body.append(strong);
  }
  body.append(document.createTextNode(message));

  if (action) {
    body.append(document.createTextNode(' '));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = action.label;
    btn.style.textDecoration = 'underline';
    btn.addEventListener('click', () => {
      action.onClick();
      remove();
    });
    body.append(btn);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss notification');
  close.textContent = '×';
  close.addEventListener('click', remove);

  el.append(body, close);
  region.append(el);

  let timer = setTimeout(remove, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => {
    timer = setTimeout(remove, 2500);
  });

  function remove() {
    clearTimeout(timer);
    el.remove();
  }

  return remove;
}

/* --------------------------- Live region -------------------------- */
let announceTimer = null;

export function announce(text) {
  const region = document.querySelector('[data-sr-live]');
  if (!region) return;
  // Clearing first makes repeat announcements of the same string speak.
  region.textContent = '';
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    region.textContent = text;
  }, 60);
}

/* --------------------------- Small helpers ------------------------ */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Field-level error display, tied to the input for screen readers. */
export function setFieldError(input, message) {
  if (!input) return;
  const target =
    document.querySelector(`[data-error-for="${input.id}"]`) ||
    input.parentElement.querySelector('.field__error');
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (target) {
      target.textContent = message;
      target.hidden = false;
      if (!target.id) target.id = `${input.id}-error`;
      const described = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (!described.includes(target.id)) {
        input.setAttribute('aria-describedby', [...described, target.id].join(' '));
      }
    }
  } else {
    input.removeAttribute('aria-invalid');
    if (target) {
      target.textContent = '';
      target.hidden = true;
      const described = (input.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((idRef) => idRef && idRef !== target.id);
      if (described.length) input.setAttribute('aria-describedby', described.join(' '));
      else input.removeAttribute('aria-describedby');
    }
  }
}

/** Move focus to the first invalid field and announce a summary. */
export function focusFirstError(form) {
  const first = form.querySelector('[aria-invalid="true"]');
  if (!first) return false;
  first.focus({ preventScroll: false });
  first.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  return true;
}
