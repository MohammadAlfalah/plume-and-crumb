/* =============================================================================
   Plume & Crumb — app logic
   Renders the page from window.PNC (content.config.js), wires the nav, reveals,
   gallery lightbox, custom-order form, and boots the 3D hero. Everything degrades
   gracefully; nothing here is required for the page to be readable.
   ============================================================================= */
import { initHero } from './hero3d.js';

const C = window.PNC || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (t, props = {}, kids = []) => {
  const n = document.createElement(t);
  for (const k in props) {
    if (k === 'class') n.className = props[k];
    else if (k === 'html') n.innerHTML = props[k];
    else if (k === 'text') n.textContent = props[k];
    else if (k in n && k !== 'href') n[k] = props[k];
    else n.setAttribute(k, props[k]);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => c && n.append(c));
  return n;
};
const esc = (s) => String(s == null ? '' : s);

/* ---------- warm SVG placeholder (used when a gallery photo isn't set yet) ---------- */
const GLYPHS = [
  '<path d="M40 130c10-40 40-70 80-70 35 0 55 25 55 25s-30-5-55 10-30 45-55 55-30-5-25-20z" fill="rgba(168,95,34,.5)"/>',
  '<circle cx="110" cy="100" r="52" fill="none" stroke="rgba(168,95,34,.5)" stroke-width="6"/><circle cx="110" cy="100" r="24" fill="rgba(178,58,72,.45)"/>',
  '<rect x="62" y="78" width="96" height="60" rx="8" fill="rgba(168,95,34,.45)"/><path d="M62 96c12-14 84-14 96 0" stroke="rgba(255,247,232,.6)" stroke-width="6" fill="none"/>',
];
const GRADS = [['#FFF7E8', '#E9B36B'], ['#FBF4E9', '#D98E3F'], ['#FCE5D0', '#C9772E'], ['#FFF1D6', '#E0A45A'], ['#F7EAD8', '#D98E3F'], ['#FFEFD2', '#B9772F']];
function placeholder(i) {
  const [a, b] = GRADS[i % GRADS.length];
  const glyph = GLYPHS[i % GLYPHS.length];
  const h = 150 + (i % 3) * 50;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 ${h}'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs>
    <rect width='220' height='${h}' fill='url(#g)'/>
    <g transform='translate(0 ${(h - 200) / 2})'>${glyph}</g></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/* ---------- brand + hero ---------- */
function applyBrand() {
  const b = C.brand || {};
  if (b.name) { $$('.wordmark, #wordmark').forEach((n) => (n.textContent = b.name)); document.title = `${b.name} — ${b.descriptor || 'Pastry'}`; }
  if (b.descriptor) $('#heroDescriptor').textContent = b.descriptor;
  if (b.tagline) $('#hero-title').innerHTML = esc(b.tagline).replace(/\.\s+/, '.<br>');
  const h = C.hero || {};
  if (h.cta) { const cta = $('#heroCta'); cta.textContent = h.cta.label || cta.textContent; cta.href = h.cta.href || '#order'; }
  if (h.caption) $('#heroCaption').textContent = h.caption;
  if (window.matchMedia('(pointer: coarse)').matches) $('#heroCaption').textContent = 'scroll to explore'; // no drag-orbit on touch
  if (h.fallbackImage) $('#heroFallback').src = h.fallbackImage;
}

/* ---------- story ---------- */
function applyStory() {
  const s = C.story || {};
  if (s.heading) $('#story-title').textContent = s.heading;
  if (Array.isArray(s.body)) $('#storyBody').replaceChildren(...s.body.map((p, i) => el('p', { text: p, class: i ? '' : '' })));
  if (s.pullQuote) $('#pullQuote').textContent = s.pullQuote;
}

/* ---------- menu ---------- */
function applyMenu() {
  const m = C.menu || {};
  if (m.note) $('#menuNote').textContent = m.note;
  const wrap = $('#menuCats');
  (m.categories || []).forEach((cat) => {
    const items = (cat.items || []).map((it) => {
      const priceEl = it.price === 'request'
        ? el('span', { class: 'price price-request', text: 'On request' })
        : (it.price ? el('span', { class: 'price', text: it.price, 'aria-label': it.price.length + ' of 3 price level' }) : null);
      return el('li', { class: 'menu-card' + (it.featured ? ' is-featured' : '') }, [
        it.badge ? el('span', { class: 'menu-badge', text: it.badge }) : null,
        el('div', { class: 'menu-card-top' }, [el('h4', { text: it.name }), priceEl]),
        it.desc ? el('p', { text: it.desc }) : null,
        el('a', { class: 'req-link', href: '#order', 'data-item': it.name, text: 'Request this' }),
      ]);
    });
    wrap.append(el('div', { class: 'menu-cat reveal' }, [
      el('h3', { class: 'menu-cat-name', text: cat.name }),
      el('ul', { class: 'menu-items' }, items),
    ]));
  });
  // menu item -> prefill the order form
  $$('.req-link', wrap).forEach((a) => a.addEventListener('click', () => prefillOrder(a.dataset.item)));
}

/* ---------- gallery + lightbox ---------- */
let lb, lbImg, lbCap, gallery = [], lbIndex = 0;
function applyGallery() {
  gallery = (C.gallery || []).map((g, i) => ({ src: g.src || placeholder(i), alt: g.alt || 'Pastry from Plume & Crumb' }));
  const grid = $('#galleryGrid');
  gallery.forEach((g, i) => {
    const img = el('img', { src: g.src, alt: g.alt, loading: 'lazy', decoding: 'async' });
    const btn = el('button', { class: 'gallery-item', type: 'button', 'aria-label': `View: ${g.alt}` }, img);
    btn.addEventListener('click', () => openLightbox(i));
    grid.append(btn);
  });
  buildLightbox();
}
function buildLightbox() {
  lbImg = el('img', { alt: '' });
  lbCap = el('p', { id: 'lb-caption', class: 'lb-cap' });
  const close = el('button', { class: 'lb-close', type: 'button', 'aria-label': 'Close', html: '✕' });
  const prev = el('button', { class: 'lb-prev', type: 'button', 'aria-label': 'Previous image', html: '‹' });
  const next = el('button', { class: 'lb-next', type: 'button', 'aria-label': 'Next image', html: '›' });
  lb = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'lb-caption' }, [close, prev, next, lbImg, lbCap]);
  document.body.append(lb);
  close.addEventListener('click', closeLightbox);
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') {  // trap focus inside the dialog
      const f = [$('.lb-close', lb), $('.lb-prev', lb), $('.lb-next', lb)];
      const i = f.indexOf(document.activeElement);
      const ni = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
      f[ni].focus(); e.preventDefault();
    }
  });
}
let lastFocus = null;
function openLightbox(i) { lbIndex = i; showLb(); lb.classList.add('open'); lastFocus = document.activeElement; $('.lb-close', lb).focus(); }
function closeLightbox() { lb.classList.remove('open'); if (lastFocus && lastFocus.isConnected) lastFocus.focus(); else document.body.focus(); }
function step(d) { lbIndex = (lbIndex + d + gallery.length) % gallery.length; showLb(); }
function showLb() { lbImg.src = gallery[lbIndex].src; lbImg.alt = gallery[lbIndex].alt; lbCap.textContent = gallery[lbIndex].alt; }

/* ---------- social (optional) ---------- */
function applySocial() {
  const s = C.social || {};
  const ig = s.instagram || {}, tt = s.tiktok || {};
  // footer links
  if (ig.url) { $('#footIg').href = ig.url; } else $('#footIg').remove();
  if (tt.url) { $('#footTt').href = tt.url; } else $('#footTt').remove();
  const sec = $('#social');
  if (!s.enabled) { sec.remove(); $$('.dotnav a[href="#social"], #navMenu a[data-social]').forEach((n) => n.remove()); return; }
  sec.hidden = false;
  if (s.heading) $('#social-title').textContent = s.heading;
  if (s.blurb) $('#socialBlurb').textContent = s.blurb;
  const grid = $('#socialGrid');
  const card = (plat, handle, url, poster, i) => {
    const inner = [];
    if (poster) inner.push(el('img', { class: 'poster', src: poster, alt: `${plat} video by ${handle || 'us'}`, loading: 'lazy' }));
    const facade = el('a', { class: 'social-facade', href: url || '#', target: '_blank', rel: 'noopener' }, [
      el('span', { class: 'play', html: '▶' }),
      el('span', { class: 'plat', text: plat }),
      el('span', { class: 'handle', text: handle || '' }),
    ]);
    inner.push(facade);
    return el('div', { class: 'social-card' }, inner);
  };
  grid.append(card('Instagram', ig.handle, ig.url, ig.poster, 0));
  grid.append(card('TikTok', tt.handle, tt.url, tt.poster, 1));
  grid.append(el('div', { class: 'social-follow' }, el('a', { class: 'btn', href: ig.url || tt.url || '#', target: '_blank', rel: 'noopener', text: 'Follow along' })));
}

/* ---------- order form ---------- */
function applyOrder() {
  const o = C.order || {};
  if (o.heading) $('#order-title').textContent = o.heading;
  if (o.blurb) $('#orderBlurb').textContent = o.blurb;
  const occ = $('#f-occasion'), bud = $('#f-budget'), prod = $('#f-product'), contact = $('#f-contact');
  (o.occasions || []).forEach((v) => occ.append(el('option', { value: v, text: v })));
  (o.budgets || []).forEach((v) => bud.append(el('option', { value: v, text: v })));
  const products = o.products || ['Cake', 'Tart or dessert', 'Pastry box / assortment', 'Croissants & viennoiserie', 'Wedding / event', 'Other'];
  const contacts = o.contactMethods || ['Email', 'Phone call', 'Text message'];
  if (prod) products.forEach((v) => prod.append(el('option', { value: v, text: v })));
  if (contact) contacts.forEach((v) => contact.append(el('option', { value: v, text: v })));
  const form = $('#orderForm');
  // keep the native (no-JS) submit target in sync with the config
  if (o.endpoint) { form.setAttribute('action', o.endpoint); form.setAttribute('enctype', 'application/x-www-form-urlencoded'); }
  else if (o.email) form.setAttribute('action', 'mailto:' + o.email);

  // deep link: ?item=Name prefills
  const params = new URLSearchParams(location.search);
  if (params.get('item')) prefillOrder(params.get('item'), false);

  form.addEventListener('submit', (e) => onSubmit(e, o));
}
function prefillOrder(item, scroll = true) {
  if (!item) return;
  const msg = $('#f-message');
  if (msg && !msg.value) msg.value = `I'd love to order: ${item}.`;
  if (scroll) { location.hash = '#order'; setTimeout(() => $('#f-name').focus(), 400); }
}
async function onSubmit(e, o) {
  const form = e.currentTarget;
  const status = $('#formStatus');
  status.className = 'form-status'; status.textContent = '';
  // honeypot: silently accept + drop bots
  if (form.querySelector('[name="_gotcha"]').value) { e.preventDefault(); status.className = 'form-status ok'; status.textContent = 'Thanks!'; return; }
  // basic validation
  if (!form.checkValidity()) { return; /* let the browser show native messages */ }
  e.preventDefault();
  const data = new FormData(form);
  const btn = $('#formSubmit'); const label = btn.textContent;

  if (o.endpoint) {
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch(o.endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (res.ok) {
        form.reset();
        status.className = 'form-status ok';
        status.textContent = "Thank you — your request is in. We'll be in touch by email soon.";
      } else throw new Error('bad status');
    } catch {
      status.className = 'form-status err';
      status.innerHTML = `Something went wrong sending that. Please email us at <a href="mailto:${esc(o.email)}">${esc(o.email)}</a>.`;
    } finally { btn.disabled = false; btn.textContent = label; }
  } else {
    // no endpoint configured → open the visitor's email app, prefilled
    const lines = [];
    for (const [k, v] of data.entries()) { if (k === '_gotcha' || !v) continue; lines.push(`${k}: ${v}`); }
    const subject = `Custom order request — ${data.get('name') || ''}`.trim();
    const href = `mailto:${o.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    btn.disabled = true; btn.textContent = 'Opening email…';
    status.className = 'form-status ok';
    status.innerHTML = `Opening your email app… if nothing happens, email us at <a href="mailto:${esc(o.email)}">${esc(o.email)}</a>.`;
    form.reset();
    setTimeout(() => { window.location.href = href; btn.disabled = false; btn.textContent = label; }, 80);
  }
}

/* ---------- visit ---------- */
function applyVisit() {
  const v = C.visit || {};
  if (v.blurb) $('#visitBlurb').textContent = v.blurb;
  if (v.address) $('#visitAddress').textContent = v.address;
  const today = new Date().getDay(); // 0=Sun
  const order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const tbody = $('#hoursTable tbody');
  (v.hours || []).forEach((row) => {
    const tr = el('tr', {}, [el('td', { text: row.d }), el('td', { text: row.h })]);
    if (order[today] && row.d && order[today].toLowerCase() === String(row.d).toLowerCase()) tr.className = 'today';
    tbody.append(tr);
  });
  const q = encodeURIComponent(v.mapsQuery || v.address || 'pastry shop');
  $('#mapsLink').href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  if (v.phone) { const pl = $('#phoneLink'); pl.href = `tel:${v.phone.replace(/[^0-9+]/g, '')}`; pl.textContent = v.phone; }
  // click-to-load map (no third-party request until asked)
  $('#mapFacade').addEventListener('click', function () {
    const f = el('iframe', { src: `https://www.google.com/maps?q=${q}&output=embed`, title: 'Map', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade' });
    this.replaceWith(f);
  });
}

/* ---------- footer ---------- */
function applyFooter() {
  $('#footYear').textContent = '© ' + new Date().getFullYear();
  if (C.footer && C.footer.credit) $('#footCredit').textContent = C.footer.credit;
}

/* ---------- scroll: reveals, dot-nav active, topbar ---------- */
function wireScroll() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // reveal-in
  const revObs = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((n) => (reduced ? n.classList.add('in') : revObs.observe(n)));

  // dot-nav active section
  const sections = $$('main section[id]');
  const navObs = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (e.isIntersecting) {
        $$('.dotnav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: 0.5 });
  sections.forEach((s) => navObs.observe(s));

  // topbar background after hero
  const topbar = $('.topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ---------- boot ---------- */
/* ---------- mobile dropdown menu ---------- */
function wireNav() {
  const toggle = $('#navToggle'), menu = $('#navMenu');
  if (!toggle || !menu) return;
  const close = () => { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('nav-open'); };
  const open = () => { menu.hidden = false; toggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('nav-open'); const f = menu.querySelector('a'); if (f) f.focus(); };
  toggle.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); } });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) close(); });
}

/* ---------- craft band + hero pastry switcher ---------- */
function applyCraft() {
  const grid = $('#craftGrid'); if (!grid) return;
  const items = C.craft || [];
  if (!items.length) { const s = $('#craft'); if (s) s.remove(); return; }
  items.forEach((c) => grid.append(el('li', { class: 'craft-item reveal' }, [
    el('h3', { class: 'craft-title', text: c.title }),
    el('p', { text: c.body }),
  ])));
}
/* light / warm-dark theme toggle — flips the page tokens AND the 3D backdrop wash together */
function wireTheme() {
  const btn = $('#themeToggle'), root = document.documentElement;
  let mode = 'light'; try { mode = localStorage.getItem('pnc_bg') === 'dark' ? 'dark' : 'light'; } catch (e) {}
  const apply = (m, persist) => {
    mode = m === 'dark' ? 'dark' : 'light';
    root.dataset.bg = mode;
    if (btn) {
      btn.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    if (window.__setHeroTheme) window.__setHeroTheme(mode);   // sync the 3D backdrop (once the hero is up)
    if (persist) { try { localStorage.setItem('pnc_bg', mode); } catch (e) {} }
  };
  apply(mode, false);   // reconcile button + page with the persisted choice on load
  if (btn) btn.addEventListener('click', () => apply(mode === 'dark' ? 'light' : 'dark', true));
}

function boot() {
  try { applyBrand(); applyStory(); applyCraft(); applyMenu(); applyGallery(); applySocial(); applyOrder(); applyVisit(); applyFooter(); wireNav(); wireTheme(); wireScroll(); }
  catch (err) { console.warn('Plume & Crumb: content render issue', err); }
  // the 3D hero is purely decorative; if it can't run, the static image shows.
  try { initHero(); } catch (err) { console.warn('Plume & Crumb: 3D hero unavailable, using static fallback', err); document.querySelector('.backdrop').classList.add('is-static'); }
}
boot();
