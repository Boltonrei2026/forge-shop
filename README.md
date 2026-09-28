# Forge Shop

Static storefront for Forge Learning Academy apparel. Plain HTML/CSS/JS, hosted free on Cloudflare Pages. No build step.

```
index.html              page markup
css/store.css           all styling (brand colors at the top)
js/products.js          SITE settings, colors, PRODUCTS, checkout hook  <- the file you edit
js/store.js             store logic (no edits needed)
images/products/<product-id>/<color>-<front|back>.webp
images/brand/           put your logo here
_headers                cache rules for Cloudflare
```

## First deploy (one time)

1. Create an empty GitHub repo named `forge-shop` under Boltonrei2026 (no README, no .gitignore).
2. Unzip this folder to `C:\Users\Bolto\forge-shop`, then in PowerShell:
   ```powershell
   cd C:\Users\Bolto\forge-shop
   git init
   git add .
   git commit -m "Forge Shop v1"
   git branch -M main
   git remote add origin https://github.com/Boltonrei2026/forge-shop.git
   git push -u origin main
   ```
3. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > pick `forge-shop`.
   - Framework preset: None
   - Build command: leave empty
   - Build output directory: `/`
   - Save and Deploy. You get a `forge-shop.pages.dev` link.
4. Custom domain: in the Pages project > Custom domains > add `shop.forgelearningacademy.com`.
   - If forgelearningacademy.com's DNS is on Cloudflare, it's automatic.
   - If DNS is elsewhere (registrar or GHL), add a CNAME record: name `shop`, target `forge-shop.pages.dev`.
5. In GHL, point the website's Shop menu link to `https://shop.forgelearningacademy.com`.

## Updating

Edit files, then:
```powershell
cd C:\Users\Bolto\forge-shop
git add .
git commit -m "describe the change"
git push
```
Cloudflare redeploys automatically in about a minute.

## Adding the logo

Save a light/white version as `images/brand/logo.png`, then in `js/products.js` set `logoUrl: "images/brand/logo.png"`.

## Adding a product

1. Export front and back mockups for each color at the same framing as the current ones (square, shirt filling most of the frame, white background).
2. Save as `images/products/<product-id>/<color>-front.webp` and `<color>-back.webp` (PNG or JPG also work; just match the path).
3. Copy an entry in `PRODUCTS` in `js/products.js`:
   ```js
   {
     id: "created-to-do-great-things",
     name: "Created To Do Great Things",
     price: 25,
     categories: ["boys", "faith"],     // collections: men, women, boys, girls; track: faith or secular
     description: "One or two short sentences.",
     sizes: ["2T", "3T", "4T", "5T"],
     colors: {
       navy: { front: "images/products/created-to-do-great-things/navy-front.webp",
               back:  "images/products/created-to-do-great-things/navy-back.webp" }
     }
   }
   ```
- New color: add it once to `COLORS` with a label and swatch hex.
- A collection (Women, Boys, Girls) gets its own section automatically once one product lists it. Until then it shows dimmed in the collection bar.
- The men's intro says "Two designs." Update `SITE.collections.men.intro` when you add a third.
- `SITE.statements` holds the big editorial lines shown after each collection.

## Hero image

The hero currently shows the Forged For More navy back mockup on white. When you have a lifestyle/campaign photo, set `heroImage` to its path and `heroImageIsProduct: false` so it fills the half edge to edge.

## Checkout

Checkout is not connected. Pressing it shows an honest notice and fires a `forge-merch:checkout` browser event with the full order (useful as a demand signal). Connect it in `forgeMerchCheckout(order)` in `js/products.js`. Options:

1. **Order request form (fastest for validation):** send the order summary to a GHL form URL as a query parameter mapped to a hidden field, then invoice manually.
2. **Stripe Checkout (real multi-item cart):** add a Cloudflare Pages Function at `functions/api/checkout.js` that prices the cart from your own product list (never trust browser prices), creates a Stripe Checkout Session with shipping collected there, and returns the URL. Same repo, same deploy, free tier.
3. **Printful:** once paid, create the Printful order from that same function, or place it by hand while volume is low.
