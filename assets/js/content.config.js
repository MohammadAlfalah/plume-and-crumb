/* =============================================================================
   PLUME & CRUMB — CONTENT CONFIG
   -----------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO MAKE THE SITE YOURS.
   Change the text, menu, photos, hours, social handles, and the order-form
   endpoint below. No coding needed — just edit the values inside the quotes.

   Quick start:
     1. brand.name / tagline           → your shop's name + line
     2. menu.categories                → your real items
     3. gallery                        → your real photos (drop files in assets/img/)
     4. social                         → your Instagram + TikTok (or set enabled:false)
     5. order.endpoint                 → paste a Formspree/Web3Forms URL so the
                                         request form emails you (see README)
     6. visit                          → address, phone, hours
   ============================================================================= */
window.PNC = {
  brand: {
    name: "Plume & Crumb",
    descriptor: "Artisan Pastry",
    tagline: "Baked light. Served warm.",
  },

  hero: {
    // Leave null to use the built-in procedural pastry (no 3D file needed).
    // To use a real model, export a small Draco-compressed .glb and put its path here.
    model: null,
    caption: "drag to orbit · scroll to explore",
    // Shown to anyone whose device can't run the 3D (and used as the social/OG image).
    fallbackImage: "assets/img/hero-fallback.svg",
    cta: { label: "Request a custom cake", href: "#order" },
  },

  story: {
    heading: "Made by hand, in small batches",
    body: [
      "Plume & Crumb is a small pastry kitchen built on one stubborn idea: that a croissant should be light enough to feel like air and honest enough to taste like butter. Every batch is laminated, proofed, and baked by hand — no shortcuts, no day-olds.",
      "We bake in small numbers so each piece gets the attention it deserves, and we change the case with the seasons. Come early; the good stuff goes fast.",
    ],
    pullQuote: "Folded by hand, one layer at a time.",
  },

  // A few craftsmanship cues. Honest, brand-voice placeholders — edit freely.
  craft: [
    { title: "Laminated by hand", body: "Every croissant is folded, rested, and shaped by hand — never machine-rolled, never frozen." },
    { title: "Baked fresh each morning", body: "We bake in small numbers daily. When a tray's gone, it's gone — so what's in the case is always fresh." },
    { title: "Made to order", body: "Cakes and larger orders are custom. Tell us the occasion and we build it around you." },
  ],

  menu: {
    // `price`: "$" / "$$" / "$$$" shows a discreet price-level dot. Use "request" for
    //  custom items so the card reads "Pricing on request" instead. `badge` adds a small
    //  label (Signature / Seasonal / Best seller / Custom …). `featured` highlights the card.
    note: "Everything is made fresh, in small batches — most mornings sell out. Pricing is on request, so tell us what you have in mind.",
    categories: [
      {
        name: "Viennoiserie",
        items: [
          { id: "croissant", name: "Butter Croissant", desc: "Forty-eight hours, twenty-seven layers, one perfect shatter.", price: "$", badge: "Signature", featured: true },
          { id: "pain-au-chocolat", name: "Pain au Chocolat", desc: "Two batons of dark chocolate in laminated dough.", price: "$" },
          { id: "kouign-amann", name: "Kouign-Amann", desc: "Caramelized, crackly, faintly salty. The baker's favorite.", price: "$", badge: "Best seller" },
        ],
      },
      {
        name: "Cakes",
        items: [
          { id: "celebration-cake", name: "Celebration Cake", desc: "Custom layers for birthdays, weddings, and good news.", price: "request", badge: "Custom", featured: true },
          { id: "olive-oil-cake", name: "Olive Oil & Citrus", desc: "Tender, fragrant, not too sweet. Keeps beautifully.", price: "$$" },
        ],
      },
      {
        name: "Tarts",
        items: [
          { id: "fruit-tart", name: "Seasonal Fruit Tart", desc: "Vanilla custard and whatever's ripe this week.", price: "$$", badge: "Seasonal" },
          { id: "lemon-tart", name: "Lemon Tart", desc: "Sharp, silky curd in a sablé shell.", price: "$$" },
          { id: "ganache-tart", name: "Dark Chocolate Ganache", desc: "Single-origin chocolate, flaky sea salt.", price: "$$" },
        ],
      },
      {
        name: "Seasonal",
        items: [
          { id: "morning-bun", name: "Morning Bun", desc: "Croissant dough, orange sugar, made for coffee.", price: "$", badge: "Weekends" },
          { id: "galette", name: "Stone-Fruit Galette", desc: "Rustic, jammy, only when the fruit is right.", price: "$$", badge: "Seasonal" },
        ],
      },
    ],
  },

  // Drop real photos in assets/img/ and point src at them (e.g. "assets/img/croissant.jpg").
  // Leave src empty ("") to show a tasteful on-brand placeholder. alt text is REQUIRED.
  gallery: [
    { src: "", alt: "A tray of golden, freshly baked butter croissants." },
    { src: "", alt: "A seasonal fruit tart topped with glazed berries." },
    { src: "", alt: "A baker laminating dough on a marble counter." },
    { src: "", alt: "A dark chocolate ganache tart with flaky sea salt." },
    { src: "", alt: "A custom celebration cake with soft buttercream." },
    { src: "", alt: "Morning buns dusted in orange sugar, fresh from the oven." },
  ],

  social: {
    enabled: true,                 // set to false to remove the whole "Watch us bake" section
    heading: "Watch us bake",
    blurb: "We film the good parts — the slow fold of the lamination, the rise, the first warm cut. Follow along to watch each batch come together.",
    instagram: { handle: "@plumeandcrumb", url: "https://instagram.com/", poster: "" },
    tiktok: { handle: "@plumeandcrumb", url: "https://www.tiktok.com/", poster: "" },
  },

  order: {
    heading: "Request a custom order",
    blurb: "Tell us about your occasion and we'll get back to you with options and pricing. This is a request, not a checkout — nothing is charged here.",
    // PASTE YOUR FORM ENDPOINT to receive submissions by email (see README — Formspree/Web3Forms/Netlify).
    // Leave empty ("") and the form will open the visitor's email app to send you the details instead.
    endpoint: "",
    email: "hello@plumeandcrumb.example",
    occasions: ["Birthday", "Wedding", "Anniversary", "Celebration", "Corporate", "Just because", "Other"],
    budgets: ["Under $50", "$50–$100", "$100–$250", "$250–$500", "$500+", "Not sure yet"],
  },

  visit: {
    heading: "Visit",
    blurb: "Find us, or just say hi.",
    address: "123 Baker Street, Your City, ST 00000",
    mapsQuery: "artisan pastry shop", // used for the "Open in Maps" link + the embedded map
    phone: "(555) 123-4567",
    hours: [
      { d: "Monday", h: "Closed" },
      { d: "Tuesday", h: "7am – 2pm" },
      { d: "Wednesday", h: "7am – 2pm" },
      { d: "Thursday", h: "7am – 2pm" },
      { d: "Friday", h: "7am – 3pm" },
      { d: "Saturday", h: "8am – 3pm" },
      { d: "Sunday", h: "8am – 1pm" },
    ],
  },

  footer: {
    credit: "Baked with care.",
  },
};
