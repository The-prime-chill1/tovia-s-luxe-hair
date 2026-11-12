import { withSupabase } from "npm:@supabase/server@^1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");
const ADMIN_EMAILS = (Deno.env.get("ADMIN_NOTIFICATION_EMAILS") || "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const money = (value: unknown) => `₦${Number(value || 0).toLocaleString("en-NG")}`;

function orderEmail(record: Record<string, unknown>) {
  const items = Array.isArray(record.items) ? record.items : [];
  const itemRows = items.map((item: Record<string, unknown>) => `
    <li>${escapeHtml(item.name)} — ${escapeHtml(item.length)} × ${escapeHtml(item.quantity)} (${money(Number(item.salePrice || 0) * Number(item.quantity || 0))})</li>
  `).join("");
  return {
    subject: `New order ${record.order_number} — ${money(record.total)}`,
    html: `<h1>New Tovia’s order</h1>
      <p><strong>Order ID:</strong> ${escapeHtml(record.order_number)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(record.customer_name)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(record.phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(record.email)}</p>
      <p><strong>Delivery address:</strong> ${escapeHtml(record.address)}, ${escapeHtml(record.city)}, ${escapeHtml(record.state)}</p>
      <p><strong>Total:</strong> ${money(record.total)}</p>
      <p><strong>Order note:</strong> ${escapeHtml(record.notes || "None")}</p>
      <h2>Items</h2><ul>${itemRows}</ul>
      <p>Sign in to the secure admin dashboard to contact the customer and update payment or delivery status.</p>`,
  };
}

function messageEmail(record: Record<string, unknown>) {
  return {
    subject: `New customer message — ${record.topic}`,
    html: `<h1>New Tovia’s enquiry</h1>
      <p><strong>Name:</strong> ${escapeHtml(record.name)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(record.phone)}</p>
      <p><strong>Topic:</strong> ${escapeHtml(record.topic)}</p>
      <p><strong>Message:</strong></p><p>${escapeHtml(record.message)}</p>
      <p>Open the secure admin dashboard to review the message.</p>`,
  };
}

const handler = async (request: Request): Promise<Response> => {
  if (!RESEND_API_KEY || !FROM_EMAIL || !ADMIN_EMAILS.length) {
    return Response.json({ error: "Email notification secrets are incomplete." }, { status: 500 });
  }

  const payload = await request.json();
  if (payload.type !== "INSERT" || !["orders", "messages"].includes(payload.table) || !payload.record) {
    return Response.json({ error: "Unsupported webhook payload." }, { status: 400 });
  }

  const content = payload.table === "orders" ? orderEmail(payload.record) : messageEmail(payload.record);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: ADMIN_EMAILS, subject: content.subject, html: content.html }),
  });

  const result = await response.json();
  if (!response.ok) return Response.json({ error: "Email provider rejected the notification.", details: result }, { status: 502 });
  return Response.json({ delivered: true, id: result.id });
};

export default { fetch: withSupabase({ auth: "secret" }, handler) };
