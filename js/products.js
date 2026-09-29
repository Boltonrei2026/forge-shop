/* ------------------------------------------------------------------
   SITE SETTINGS
   Image paths are relative to this site (e.g. "images/products/..."). Any "" is an empty slot: put a
   path or URL between the quotes. Empty slots show a quiet labeled placeholder.
   ------------------------------------------------------------------ */
var SITE = {
  showHeader: true,             // false if your GHL page already has a header (a floating cart button appears instead)

  logoUrl: "",                  // >>> ADD: put your logo at images/brand/logo.png and set this to "images/brand/logo.png"
  logoAlt: "Forge Learning Academy",

  heroImage: "images/hero/family-sunset.webp",
  heroImageSmall: "images/hero/family-sunset-768.webp",   // lighter version for phones (optional)
  heroImageIsProduct: false,    // true only when the hero is a shirt mockup on white
  heroImageAlt: "A family sitting on a rock ledge at sunset, wearing Forge Learning Academy shirts",

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
    men:   { label: "Men",   title: "Men's collection",   intro: "Built for the ones who lead at home.", banner: "" },
    women: { label: "Women", title: "Women's collection", intro: "For the women building something that lasts.", banner: "" },
    boys:  { label: "Boys",  title: "Boys' collection",   intro: "Made for the boys learning to lead.", banner: "" },
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
  black: { label: "Black", hex: "#4A4A4A" },
  bright_red: { label: "Red",          hex: "#D42343" },
  pink:       { label: "Pink",         hex: "#F4D1D4" },
  forest:     { label: "Forest Green", hex: "#23443D" },
  olive:      { label: "Olive",        hex: "#6C7856" },
  cream:      { label: "Cream",        hex: "#F4E9CF" },
  slate:      { label: "Slate",        hex: "#575F5C" },
  heather:    { label: "Heather Gray", hex: "#C7C8C6" },
  charcoal:   { label: "Charcoal",     hex: "#5B5B5B" },
  light_blue: { label: "Light Blue",   hex: "#C2D4E3" },
  natural:    { label: "Natural",      hex: "#F8ECDC" },
  sport_grey: { label: "Sport Grey",   hex: "#CECECE" },
  white:      { label: "White",        hex: "#FFFFFF" },
  royal:      { label: "Royal",        hex: "#386CC2" }
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
      black: { front: "images/products/forged-for-more/black-front.webp", back: "images/products/forged-for-more/black-back.webp" },
      navy:  { front: "images/products/forged-for-more/navy-front.webp", back: "images/products/forged-for-more/navy-back.webp" },
      red:   { front: "images/products/forged-for-more/red-front.webp", back: "images/products/forged-for-more/red-back.webp" }
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
      black: { front: "images/products/as-iron-sharpens-iron/black-front.webp", back: "images/products/as-iron-sharpens-iron/black-back.webp" },
      navy:  { front: "images/products/as-iron-sharpens-iron/navy-front.webp", back: "images/products/as-iron-sharpens-iron/navy-back.webp" },
      red:   { front: "images/products/as-iron-sharpens-iron/red-front.webp", back: "images/products/as-iron-sharpens-iron/red-back.webp" }
    }
  },
  {
    id: "mama-builds-brighter-tomorrows",
    name: "Mama Builds Brighter Tomorrows",
    price: 35,                                  // CONFIRM PRICE
    categories: ["women", "faith"],
    description: "MAMA BUILDS BRIGHTER TOMORROWS with a heart on the front. FAITH FAMILY FREEDOM on the back.",
    sizes: ["S", "M", "L", "XL", "2XL"],        // CONFIRM SIZES
    colors: {
      bright_red: { front: "images/products/mama-builds-brighter-tomorrows/bright_red-front.webp", back: "images/products/mama-builds-brighter-tomorrows/bright_red-back.webp" },
      pink:       { front: "images/products/mama-builds-brighter-tomorrows/pink-front.webp", back: "images/products/mama-builds-brighter-tomorrows/pink-back.webp" },
      cream:      { front: "images/products/mama-builds-brighter-tomorrows/cream-front.webp", back: "images/products/mama-builds-brighter-tomorrows/cream-back.webp" },
      black:      { front: "images/products/mama-builds-brighter-tomorrows/black-front.webp", back: "images/products/mama-builds-brighter-tomorrows/black-back.webp" },
      navy:       { front: "images/products/mama-builds-brighter-tomorrows/navy-front.webp", back: "images/products/mama-builds-brighter-tomorrows/navy-back.webp" },
      charcoal:   { front: "images/products/mama-builds-brighter-tomorrows/charcoal-front.webp", back: "images/products/mama-builds-brighter-tomorrows/charcoal-back.webp" },
      forest:     { front: "images/products/mama-builds-brighter-tomorrows/forest-front.webp", back: "images/products/mama-builds-brighter-tomorrows/forest-back.webp" }
    }
  },
  {
    id: "home-is-the-classroom",
    name: "Home Is the Classroom",
    price: 35,                                  // CONFIRM PRICE
    categories: ["women", "secular"],
    description: "FORGE chest logo on the front. HOME IS THE CLASSROOM illustration on the back.",
    sizes: ["S", "M", "L", "XL", "2XL"],        // CONFIRM SIZES
    colors: {
      olive:    { front: "images/products/home-is-the-classroom/olive-front.webp", back: "images/products/home-is-the-classroom/olive-back.webp" },
      cream:    { front: "images/products/home-is-the-classroom/cream-front.webp", back: "images/products/home-is-the-classroom/cream-back.webp" },
      navy:     { front: "images/products/home-is-the-classroom/navy-front.webp", back: "images/products/home-is-the-classroom/navy-back.webp" },
      black:    { front: "images/products/home-is-the-classroom/black-front.webp", back: "images/products/home-is-the-classroom/black-back.webp" },
      slate:    { front: "images/products/home-is-the-classroom/slate-front.webp", back: "images/products/home-is-the-classroom/slate-back.webp" },
      heather:  { front: "images/products/home-is-the-classroom/heather-front.webp", back: "images/products/home-is-the-classroom/heather-back.webp" }
    }
  },
  {
    id: "learn-build-lead",
    name: "Learn Build Lead",
    price: 25,                                  // CONFIRM PRICE
    categories: ["boys", "secular"],
    description: "LEARN BUILD LEAD on the front. A BRIGHTER GENERATION with the Forge anvil on the back.",
    sizes: ["XS", "S", "M", "L", "XL"],         // youth sizes, CONFIRM
    colors: {
      light_blue: { front: "images/products/learn-build-lead/light_blue-front.webp", back: "images/products/learn-build-lead/light_blue-back.webp" },
      bright_red: { front: "images/products/learn-build-lead/bright_red-front.webp", back: "images/products/learn-build-lead/bright_red-back.webp" },
      natural:    { front: "images/products/learn-build-lead/natural-front.webp", back: "images/products/learn-build-lead/natural-back.webp" },
      sport_grey: { front: "images/products/learn-build-lead/sport_grey-front.webp", back: "images/products/learn-build-lead/sport_grey-back.webp" },
      charcoal:   { front: "images/products/learn-build-lead/charcoal-front.webp", back: "images/products/learn-build-lead/charcoal-back.webp" },
      white:      { front: "images/products/learn-build-lead/white-front.webp", back: "images/products/learn-build-lead/white-back.webp" }
    }
  },
  {
    id: "forge-knight",
    name: "Forge Knight",
    price: 25,                                  // CONFIRM PRICE
    categories: ["boys", "secular"],
    description: "FORGE chest logo on the front. The Forge knight with FORGE LEARNING ACADEMY on the back.",
    sizes: ["XS", "S", "M", "L", "XL"],         // youth sizes, CONFIRM
    colors: {
      navy:       { front: "images/products/forge-knight/navy-front.webp", back: "images/products/forge-knight/navy-back.webp" },
      royal:      { front: "images/products/forge-knight/royal-front.webp", back: "images/products/forge-knight/royal-back.webp" },
      black:      { front: "images/products/forge-knight/black-front.webp", back: "images/products/forge-knight/black-back.webp" },
      charcoal:   { front: "images/products/forge-knight/charcoal-front.webp", back: "images/products/forge-knight/charcoal-back.webp" },
      bright_red: { front: "images/products/forge-knight/bright_red-front.webp", back: "images/products/forge-knight/bright_red-back.webp" }
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
