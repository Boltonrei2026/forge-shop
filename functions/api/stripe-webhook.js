// POST /api/stripe-webhook  (Stripe calls this after a successful payment)
// Kids' items -> Printful order. Adult items -> order alert to GHL (place at PODpartner by hand).
import { byId, colorLabel, fulfillmentOf, printfulVariantId, stripe, json } from "../_lib/catalog.js";

export async function onRequestPost({ request, env }) {
  const payload = await request.text();
  if (!(await validSignature(payload, request.headers.get("Stripe-Signature"), env.STRIPE_WEBHOOK_SECRET)))
    return json({ error: "bad signature" }, 400);

  const event = JSON.parse(payload);
  if (event.type !== "checkout.session.completed") return json({ ignored: event.type });
  const session = event.data.object;
  if (!session.metadata || session.metadata.source !== "forge-shop") return json({ ignored: "not a shop order" });
  if (session.payment_status !== "paid") return json({ ignored: "not paid" });

  const lines = await stripe(env, "GET", `/v1/checkout/sessions/${session.id}/line_items?limit=100&expand[]=data.price.product`);
  const ship = (session.collected_information && session.collected_information.shipping_details) || session.shipping_details || {};
  const addr = ship.address || {};
  const cust = session.customer_details || {};

  const printful = [], podpartner = [], problems = [];
  for (const li of lines.data) {
    const md = (li.price && li.price.product && li.price.product.metadata) || {};
    const p = byId(md.product_id);
    const item = { id: md.product_id, name: p ? p.name : li.description, color: md.color, colorLabel: colorLabel(md.color), size: md.size, qty: li.quantity };
    if (!p) { problems.push("Unknown product " + md.product_id); podpartner.push(item); continue; }
    (fulfillmentOf(p) === "printful" ? printful : podpartner).push(item);
  }

  // ---- Printful (automatic) ----
  let printfulStatus = printful.length ? "" : "none";
  if (printful.length) {
    const missing = printful.filter((i) => !printfulVariantId(i.id, i.color, i.size));
    if (missing.length || !env.PRINTFUL_TOKEN) {
      printfulStatus = "NOT SENT. Place by hand: " + (env.PRINTFUL_TOKEN ? "no Printful variant for " + missing.map(fmt).join("; ") : "PRINTFUL_TOKEN not set");
    } else {
      const confirm = env.PRINTFUL_CONFIRM === "true";
      const res = await fetch((env.PRINTFUL_API || "https://api.printful.com") + "/orders" + (confirm ? "?confirm=true" : ""), {
        method: "POST",
        headers: Object.assign({ Authorization: "Bearer " + env.PRINTFUL_TOKEN, "Content-Type": "application/json" },
          env.PRINTFUL_STORE_ID ? { "X-PF-Store-Id": env.PRINTFUL_STORE_ID } : {}),
        body: JSON.stringify({
          external_id: session.id.slice(-32),
          shipping: "STANDARD",
          recipient: {
            name: ship.name || cust.name, email: cust.email, phone: cust.phone || undefined,
            address1: addr.line1, address2: addr.line2 || undefined, city: addr.city,
            state_code: addr.state, country_code: addr.country, zip: addr.postal_code
          },
          items: printful.map((i) => ({ sync_variant_id: printfulVariantId(i.id, i.color, i.size), quantity: i.qty }))
        })
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok) printfulStatus = (confirm ? "Sent to Printful for printing" : "Created as a DRAFT in Printful. Review and confirm it") + " (Printful order " + (out.result && out.result.id) + ")";
      else if (/external/i.test(JSON.stringify(out))) printfulStatus = "Already sent to Printful (duplicate notice)";
      else printfulStatus = "FAILED, place by hand: " + ((out.error && out.error.message) || out.result || res.status);
    }
  }

  // ---- Order alert (GHL inbound webhook -> your email/text workflow) ----
  const alert = {
    order_id: session.id,
    order_total: ((session.amount_total || 0) / 100).toFixed(2),
    customer_name: ship.name || cust.name || "",
    customer_email: cust.email || "",
    customer_phone: cust.phone || "",
    ship_address: [addr.line1, addr.line2, [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    podpartner_items: podpartner.length ? podpartner.map(fmt).join("\n") : "none",
    podpartner_action: podpartner.length ? "PLACE THIS ORDER AT PODPARTNER" : "none",
    printful_items: printful.length ? printful.map(fmt).join("\n") : "none",
    printful_status: printfulStatus,
    problems: problems.join("; ") || "none"
  };
  if (env.GHL_WEBHOOK_URL) {
    await fetch(env.GHL_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(alert) }).catch(() => {});
  }
  return json({ ok: true, alert });
}

const fmt = (i) => `${i.qty} x ${i.name} | ${i.colorLabel} | ${i.size}`;

async function validSignature(payload, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")));
  const t = parts.t, sigs = header.split(",").filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + payload));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && timingSafe(s, hex));
}
function timingSafe(a, b) { let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
