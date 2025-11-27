import fetch from "node-fetch";
import pkg from "socks-proxy-agent";
import https from "https";

const { SocksProxyAgent } = pkg;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/119.0.0.0 Safari/537.36";

export default async function handler(req, res) {
  const { url, ip } = req.query;

  if (!url) return res.status(400).json({ error: "الرجاء تمرير رابط عبر ?url=" });

  const proxyUrl = ip
    ? `socks5://${ip}`
    : process.env.SOCKS_PROXY || null;

  if (!proxyUrl)
    return res.status(400).json({ error: "لم يتم تمرير ip= ولا يوجد SOCKS_PROXY في env" });

  // إعداد الوكيل
  const agent = new SocksProxyAgent(proxyUrl);

  // تجاهل شهادات SSL غير موثوقة
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  // دمج الـ agents (SocksProxy + HTTPS)
  const finalAgent = {
    ...httpsAgent,
    options: agent.options, // نستخدم إعدادات البروكسي
  };

  try {
    const response = await fetch(url, {
      agent: finalAgent,
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const body = await response.text();

    const headersObj = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    return res.status(200).json({
      proxy: proxyUrl,
      target: url,
      status: response.status,
      statusText: response.statusText,
      headers: headersObj,
      body,
    });
  } catch (err) {
    return res.status(500).json({
      proxy: proxyUrl,
      target: url,
      status: 500,
      error: err.message || String(err),
    });
  }
}
