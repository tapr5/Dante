// api/proxy-json.js
import fetch from "node-fetch";
import pkg from "socks-proxy-agent";
const { SocksProxyAgent } = pkg;

const PROXY = process.env.SOCKS_PROXY || "socks5://165.101.189.3:1080";

// User-Agent مخصص (يمكن تغييره حسب الحاجة)
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/119.0.0.0 Safari/537.36";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "الرجاء تمرير رابط عبر ?url=مثال" });
    return;
  }

  const agent = new SocksProxyAgent(PROXY);

  try {
    const response = await fetch(url, {
      agent,
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    // قراءة body كنص
    const body = await response.text();

    // تحويل الهيدرز إلى JSON
    const headersObj = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    res.status(200).json({
      status: response.status,
      statusText: response.statusText,
      headers: headersObj,
      body
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      statusText: "Proxy Error",
      proxy: PROXY,
      error: err.message || err.toString()
    });
  }
}
