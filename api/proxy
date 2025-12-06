import fetch from "node-fetch";
import pkg from "socks-proxy-agent";
const { SocksProxyAgent } = pkg;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/119.0.0.0 Safari/537.36";

export default async function handler(req, res) {
  const { url, ip } = req.query;

  if (!url)
    return res.status(400).json({ error: "الرجاء تمرير رابط عبر ?url=" });

  if (!ip)
    return res.status(400).json({ error: "الرجاء تمرير ip= بروكسي SOCKS5" });

  const proxyUrl = `socks5://${ip}`;

  // agent الصحيح
  const agent = new SocksProxyAgent(proxyUrl);

  // تعطيل SSL
  agent.options.rejectUnauthorized = false;

  try {
    const response = await fetch(url, {
      agent,
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "*/*",
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
      ok: response.ok,
      headers: headersObj,
      body,
    });
  } catch (err) {
    return res.status(500).json({
      proxy: proxyUrl,
      target: url,
      status: 500,
      error: err.message,
    });
  }
}
