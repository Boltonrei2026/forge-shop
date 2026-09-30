// POST /api/checkout  { items: [{ id, color, size, qty }] }  ->  { url } of a Stripe Checkout page
import { SITE, SHIPPING, byId, colorLabel, stripe, json } from "../_lib/catalog.js";

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Checkout isn't configured yet." }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!items.length) return json({ error: "Your cart is empty." }, 400);

  // Prices always come from the product data on the server, never from the browser
  const tax = env.AUTOMATIC_TAX === "true";
  const line_items = [];
  let subtotal = 0;
  for (const it of items) {
    const p = byId(it.id);
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 0));
    if (!p || !p.colors[it.color] || !p.sizes.includes(it.size)) return json({ error: "An item in your cart is no longer available. Please remove it and try again." }, 400);
    const cents = Math.round(p.price * 100);
    subtotal += cents * qty;
    const image = new URL(p.colors[it.color].front, SITE_URL(env, request)).href;
    line_items.push({
      quantity: qty,
      price_data: {
        currency: (SITE.currency || "USD").toLowerCase(),
        unit_amount: cents,
        tax_behavior: tax ? "exclusive" : undefined,
        product_data: {
          name: p.name,
          description: `${colorLabel(it.color)}, size ${it.size}`,
          images: { 0: image },
          tax_code: tax ? "txcd_30011000" : undefined,
          metadata: { product_id: p.id, color: it.color, size: it.size }
        }
      }
    });
  }

  const free = subtotal >= SHIPPING.freeOver * 100;
  const session = await stripe(env, "POST", "/v1/checkout/sessions", {
    mode: "payment",
    line_items: Object.fromEntries(line_items.map((li, i) => [i, li])),
    shipping_address_collection: { allowed_countries: Object.fromEntries(SHIPPING.countries.map((c, i) => [i, c])) },
    shipping_options: { 0: { shipping_rate_data: {
      display_name: free ? "Free standard shipping" : "Standard shipping",
      type: "fixed_amount",
      fixed_amount: { amount: free ? 0 : Math.round(SHIPPING.flatRate * 100), currency: "usd" },
      tax_behavior: tax ? "exclusive" : undefined,
      tax_code: tax ? "txcd_92010001" : undefined
    } } },
    automatic_tax: tax ? { enabled: "true" } : undefined,
    phone_number_collection: { enabled: "true" },
    metadata: { source: "forge-shop" },
    payment_intent_data: { metadata: { source: "forge-shop" } },
    success_url: SITE_URL(env, request) + "/order/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: SITE_URL(env, request) + "/"
  }).catch((e) => ({ error: e.message }));

  if (session.error) return json({ error: "We couldn't start checkout. Please try again in a minute." , detail: session.error }, 502);
  return json({ url: session.url });
}

function SITE_URL(env, request) { return (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, ""); }
