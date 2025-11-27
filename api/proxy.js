// api/proxy.js
import fetch from "node-fetch";
import pkg from "socks-proxy-agent";
const { SocksProxyAgent } = pkg;

// User-Agent حديث
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/119.0.0.0 Safari/537.36";

export default async function handler(req, res) {
  const { url, ip } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "الرجاء تمرير رابط عبر ?url=",
    });
  }

  // اختر البروكسي من ip= أو من env
  const proxyUrl = ip
    ? `socks5://${ip}`
    : process.env.SOCKS_PROXY || null;

  // إذا لا يوجد بروكسي → أعيد خطأ
  if (!proxyUrl) {
    return res.status(400).json({
      error: "لم يتم تمرير ip= ولا يوجد SOCKS_PROXY في env",
    });
  }

  const agent = new SocksProxyAgent(proxyUrl);

  try {
    const response = await fetch(url, {
      agent,
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const body = await response.text();

    // headers → object
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
