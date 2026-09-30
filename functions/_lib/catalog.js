// Shared by the checkout and webhook functions. Reads the same product data the shop uses.
import catalog from "../../js/products.js";
import printfulVariants from "../../data/printful-variants.json";

export const { SITE, COLORS, PRODUCTS, SHIPPING } = catalog;

export const byId = (id) => PRODUCTS.find((p) => p.id === id);
export const colorLabel = (k) => (COLORS[k] && COLORS[k].label) || k;

// Kids' shirts print at Printful, adult shirts at PODpartner (a product can override with fulfillment: "...")
export function fulfillmentOf(p) {
  if (p.fulfillment) return p.fulfillment;
  return p.categories.some((c) => c === "boys" || c === "girls") ? "printful" : "podpartner";
}

export const printfulMapped = (id) => !!printfulVariants[id];

export function printfulVariantId(productId, color, size) {
  const m = printfulVariants[productId];
  return (m && m[color + "|" + size]) || null;
}

// Stripe expects form-encoded bodies with bracket keys
export function formEncode(obj, prefix, out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") formEncode(v, key, out);
    else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  }
  return out.join("&");
}

export async function stripe(env, method, path, body) {
  const res = await fetch((env.STRIPE_API || "https://api.stripe.com") + path, {
    method,
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? formEncode(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Stripe: " + ((data.error && data.error.message) || res.status));
  return data;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
