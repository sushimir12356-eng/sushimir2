const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const reply = (statusCode, body) => ({ statusCode, headers: {...corsHeaders, "Content-Type":"application/json"}, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders, body: "" };
  if (event.httpMethod !== "POST") return reply(405, {error:"Method not allowed"});
  const token = process.env.BOT_TOKEN, chatId = process.env.ADMIN_CHAT_ID;
  if (!token || !chatId) return reply(500, {error:"Telegram integration is not configured"});
  try {
    const o = JSON.parse(event.body || "{}");
    if (!o.name || !/^\+380\d{9}$/.test(o.phone || "") || !Array.isArray(o.items) || !o.items.length) return reply(400,{error:"Invalid order"});
    if (o.items.length > 40 || o.items.some(i => !i.name || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 50 || !Number.isFinite(i.price) || i.price < 0)) return reply(400,{error:"Invalid items"});
    const total = o.items.reduce((s,i)=>s+i.quantity*i.price,0);
    const lines = o.items.map(i=>`• ${String(i.name).slice(0,100)} ×${i.quantity} — ${(i.quantity*i.price).toLocaleString("uk-UA")} грн`);
    const text = [
      "📦 <b>НОВЕ ЗАМОВЛЕННЯ</b>",
      `👤 Клієнт: ${escapeHtml(o.name).slice(0,160)}`,
      `📞 Телефон: ${escapeHtml(o.phone)}`,
      `💬 Telegram: ${escapeHtml(o.telegram || "—").slice(0,100)}`,
      `📍 Спосіб: ${escapeHtml(o.fulfillment || "—")}`,
      `📝 Коментар: ${escapeHtml(o.comment || "—").slice(0,700)}`,
      "",
      "🛒 <b>Склад замовлення:</b>", ...lines,
      "", `💰 <b>Всього: ${total.toLocaleString("uk-UA")} грн</b>`
    ].join("\n");
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({chat_id:chatId,text,parse_mode:"HTML"})
    });
    const result = await tg.json();
    if (!tg.ok || !result.ok) return reply(502,{error:"Telegram delivery failed"});
    return reply(200,{ok:true});
  } catch (e) {
    return reply(400,{error:"Invalid request"});
  }
};
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
