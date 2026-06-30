# Plume & Crumb — a 3D, immersive site for a pastry shop

A first-class showcase website for an artisan pastry shop, built as a fast, static site with an interactive 3D centerpiece. A procedurally-shaded laminated pastry floats in warm light; you can orbit it, and as you scroll it drifts, shrinks, and warms toward golden hour. There's a menu, a gallery, an optional "watch us bake" section for Instagram/TikTok, and a custom-order request form.

> **"Plume & Crumb" is a placeholder name.** Everything — name, menu, photos, hours, social, the order email — lives in one file: [`assets/js/content.config.js`](assets/js/content.config.js). Edit that and the site is yours. No build step, no framework.

## What makes it different

- **A real 3D hero, not a video.** One shader-lit pastry + drifting flour/berry/chocolate motes + soft light beams. It needs no 3D model file to look good — though you can drop one in later.
- **It stays smooth.** Tiny draw count, pauses when the tab is hidden, auto-downgrades if a device struggles, and renders at a sensible resolution on phones.
- **It never breaks.** No WebGL? It shows a tasteful static image. Reduced-motion turned on? It calms to a single still pose. No JavaScript at all? The page is still readable and the contact info works.
- **Accessible & fast.** Semantic HTML, keyboard-navigable, real text over the canvas (so it loads instantly and screen readers get content, never the 3D).

## See it locally

ES modules need to be served over `http://` (not opened as a file). From this folder, run any static server:

```bash
# Python (already on most machines)
python -m http.server 8123

# …or Node
npx --yes serve -l 8123 .
```

Then open <http://localhost:8123>.

## Make it yours (the only file you edit)

Open [`assets/js/content.config.js`](assets/js/content.config.js) and change the values:

1. **Name & tagline** — `brand.name`, `brand.tagline`.
2. **Menu** — `menu.categories`. Add/remove items; each has a name, description, and an optional `"$"` price indicator (it's request-only, never a checkout).
3. **Photos** — drop images into `assets/img/` and set each `gallery[].src` to its path (e.g. `"assets/img/croissant.jpg"`). Leave `src: ""` and a tasteful placeholder shows instead. **`alt` text is required** (it describes the photo for screen readers and Google).
4. **Instagram / TikTok** — `social`. Set the handles and URLs, or set `social.enabled: false` to remove that whole section. Add a `poster` image path to show a thumbnail behind the play button.
5. **Hours, address, phone** — `visit`.

## Make the order form actually email you

The form works with **no backend** via a free form service. Pick one, paste its URL into `order.endpoint`:

- **Formspree** (easiest): make a form at [formspree.io](https://formspree.io), copy your endpoint (`https://formspree.io/f/abcdwxyz`) into `order.endpoint`.
- **Web3Forms**: get a free access key at [web3forms.com](https://web3forms.com), set `order.endpoint` to `https://api.web3forms.com/submit`, and add your key — in `index.html`, inside the `<form>`, add `<input type="hidden" name="access_key" value="YOUR-KEY">`.
- **Netlify Forms** (if you host on Netlify): on the `<form>` in `index.html` add `netlify` and `name="order"`, plus a hidden `<input type="hidden" name="form-name" value="order">`.

**Leave `order.endpoint` empty** and the form falls back to opening the visitor's email app, pre-addressed to `order.email`. So it works even before you set anything up.

## Deploy it (free)

It's just static files — host anywhere:

- **Netlify**: drag this folder onto [app.netlify.com/drop](https://app.netlify.com/drop). Done.
- **Vercel**: `vercel` in this folder, or import the repo at [vercel.com](https://vercel.com).
- **GitHub Pages**: push to a repo → Settings → Pages → deploy from the branch root.
- **Cloudflare Pages**: connect the repo; no build command, output directory `/`.

## Swap the pastry for a real 3D model (optional)

The hero looks great as-is from shaders. To use a real model, export a small **Draco-compressed `.glb`** (a croissant, a cake — keep it under a few thousand triangles), put it in `assets/`, and set `hero.model` in the config to its path. It lazy-loads behind the procedural pastry, so the page is never blocked waiting for it.

## How it's built

- `index.html` — semantic structure + the fixed 3D canvas behind the content.
- `assets/css/styles.css` — all styling; palette and type are CSS variables at the top.
- `assets/js/content.config.js` — **your content** (the file you edit).
- `assets/js/hero3d.js` — the Three.js hero (shaders, particles, scroll, fallbacks).
- `assets/js/app.js` — renders the page from the config; nav, gallery lightbox, form.

Three.js loads from a pinned CDN via an import map — no install, no build.

## Tech

Plain HTML / CSS / JavaScript · [Three.js](https://threejs.org) (ES modules, CDN) · Google Fonts (Fraunces + Inter) · zero build step.

## License

MIT.
