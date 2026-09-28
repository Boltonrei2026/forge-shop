/* ------------------------------------------------------------------
   SITE SETTINGS
   Image paths are relative to this site (e.g. "images/products/..."). Any "" is an empty slot: put a
   path or URL between the quotes. Empty slots show a quiet labeled placeholder.
   ------------------------------------------------------------------ */
var SITE = {
  showHeader: true,             // false if your GHL page already has a header (a floating cart button appears instead)

  logoUrl: "",                  // >>> ADD: put your logo at images/brand/logo.png and set this to "images/brand/logo.png"
  logoAlt: "Forge Learning Academy",

  heroImage: "images/products/forged-for-more/navy-back.webp",  // swap for a lifestyle/campaign photo when you have one (portrait, 1600x2000+)
  heroImageIsProduct: true,     // true = show on white, uncropped (for shirt mockups). Set false for a real photo.
  heroImageAlt: "Forged For More tee in navy, back view",

  tryForgeUrl: "#",             // >>> PASTE: your free-trial link

  nav: [                        // >>> PASTE: your real page URLs
    { label: "Home",       url: "https://forgelearningacademy.com" },
    { label: "Curriculum", url: "#" },
    { label: "Free Trial", url: "#" },
    { label: "Resources",  url: "#" },
    { label: "Shop",       url: "#fm-shop", current: true }
  ],

  /* Collections, in page order. A collection gets its own section as soon
     as at least one product lists it in `categories`. Until then it shows
     dimmed in the "Shop the collection" bar. `banner` is optional. */
  collections: {
    men:   { label: "Men",   title: "Men's collection",   intro: "Two designs. Built with purpose.", banner: "" },
    women: { label: "Women", title: "Women's collection", intro: "", banner: "" },
    boys:  { label: "Boys",  title: "Boys' collection",   intro: "", banner: "" },
    girls: { label: "Girls", title: "Girls' collection",  intro: "", banner: "" }
  },

  /* Large editorial lines placed after each collection, in order. */
  statements: ["A brighter generation.", "Forged for more.", "Built with purpose."],

  checkoutUrl: "",              // leave "" until checkout is connected (see guide)
  currency: "USD",
  storageKey: "forge-merch-cart-v1"
};

/* Design filter shown next to the collection links. */
var TRACKS = [
  { id: "all",     label: "All" },
  { id: "faith",   label: "Faith" },
  { id: "secular", label: "Secular" }
];

/* COLOR LIBRARY: add a color once here, then use its key in any product. */
var COLORS = {
  navy:  { label: "Navy",  hex: "#4A5771" },
  red:   { label: "Red",   hex: "#A54A4A" },
  black: { label: "Black", hex: "#4A4A4A" }
};

/* PRODUCTS: one entry = one product. Each color has its own front + back image.
   categories: which collection(s) it appears in (men/women/boys/girls)
   plus its design track (faith or secular). */
var PRODUCTS = [
  {
    id: "forged-for-more",
    name: "Forged For More",
    price: 35,
    categories: ["men", "secular"],
    description: "Vertical FORGED down the front. FORGED FOR MORE across the back with Forge branding and A BRIGHTER GENERATION.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: {
      navy:  { front: "images/products/forged-for-more/navy-front.webp", back: "images/products/forged-for-more/navy-back.webp" },
      red:   { front: "images/products/forged-for-more/red-front.webp", back: "images/products/forged-for-more/red-back.webp" },
      black: { front: "images/products/forged-for-more/black-front.webp", back: "images/products/forged-for-more/black-back.webp" }
    }
  },
  {
    id: "as-iron-sharpens-iron",
    name: "As Iron Sharpens Iron",
    price: 35,
    categories: ["men", "faith"],
    description: "White cross with PROVERBS 27:17 on the front. The full verse on the back.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: {
      navy:  { front: "images/products/as-iron-sharpens-iron/navy-front.webp", back: "images/products/as-iron-sharpens-iron/navy-back.webp" },
      red:   { front: "images/products/as-iron-sharpens-iron/red-front.webp", back: "images/products/as-iron-sharpens-iron/red-back.webp" },
      black: { front: "images/products/as-iron-sharpens-iron/black-front.webp", back: "images/products/as-iron-sharpens-iron/black-back.webp" }
    }
  }
];

/* CHECKOUT HOOK
   order = { items:[{id,name,color,colorLabel,size,qty,unitPrice,lineTotal}], subtotal, currency }
   Return true if you handled checkout. See the guide for options. */
function forgeMerchCheckout(order) {
  if (SITE.checkoutUrl) {
    window.location.href = SITE.checkoutUrl;
    return true;
  }
  return false; // not connected yet: the cart shows an honest notice
}
