// api/proxy-ip.js
import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";

/**
 * اقرأ البروكسي من متغير بيئة لتجنّب كتابة البيانات الحساسة في الكود.
 * إذا لم تجده سيستخدم البروكسي الذي أعطيتَه سابقاً.
 */
const PROXY = process.env.SOCKS_PROXY || "socks5://165.101.189.3:1080";

export default async function handler(req, res) {
  const agent = new SocksProxyAgent(PROXY);

  try {
    // نجرب نجيب الـ IP عبر خدمة بسيطة
    const response = await fetch("https://api.ipify.org?format=json", {
      agent,
      // وقت انتظار معقول حتى لا يتعلّق السيرفر
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Bad response from ip service: ${response.status}`);
    }

    const data = await response.json();
    const ip = data.ip || "unknown";

    const html = `<!doctype html>
<html lang="ar">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Proxy Test</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 24px; direction: rtl; }
    .card { border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); padding: 18px; max-width:720px; margin:auto; }
    h1 { margin: 0 0 8px 0; }
    p { margin: 6px 0; }
    .ok { color: #096; font-weight: 600; }
    .fail { color: #c00; font-weight: 600; }
    small { color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <h1>نتيجة اختبار البروكسي</h1>
    <p>IP الظاهر عبر البروكسي: <strong>${ip}</strong></p>
    <p>Proxy: <small>${PROXY}</small></p>
    <p>الوقت: <small>${new Date().toLocaleString()}</small></p>
    <p class="ok">✅ نجح الاتصال عبر البروكسي (حسب api.ipify.org)</p>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    // صفحة خطأ مفيدة للمشاهدة من المتصفح
    const htmlErr = `<!doctype html>
<html lang="ar">
<head><meta charset="utf-8"/><title>Proxy Error</title></head>
<body style="font-family:system-ui;padding:20px;direction:rtl">
  <h1>فشل الاتصال عبر البروكسي</h1>
  <p><strong>Proxy:</strong> ${PROXY}</p>
  <p><strong>الخطأ:</strong> ${String(err.message || err)}</p>
  <p>تأكد من أن البروكسي يعمل، وأنه يسمح باتصالات HTTPS، أو جرّب بروكسي آخر.</p>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(500).send(htmlErr);
  }
}
