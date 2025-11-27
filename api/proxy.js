// api/proxy-html.js
import fetch from "node-fetch";
import pkg from "socks-proxy-agent";
const { SocksProxyAgent } = pkg;

const PROXY = process.env.SOCKS_PROXY || "socks5://165.101.189.3:1080";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).send("❌ الرجاء تمرير رابط عبر ?url=مثال");
    return;
  }

  const agent = new SocksProxyAgent(PROXY);

  try {
    const response = await fetch(url, { agent, timeout: 15000 });
    if (!response.ok) {
      throw new Error(`Bad response: ${response.status}`);
    }

    const html = await response.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(500).send(`
      <html>
      <body style="font-family:system-ui;padding:20px;direction:rtl">
        <h1>❌ فشل جلب الصفحة عبر البروكسي</h1>
        <p><b>URL:</b> ${url}</p>
        <p><b>Proxy:</b> ${PROXY}</p>
        <p><b>الخطأ:</b> ${String(err.message || err)}</p>
      </body>
      </html>
    `);
  }
}
