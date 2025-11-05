// pages/api/fetch.js
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

/**
 * إعدادات قابلة للتعديل
 */
const PROXY_INFO_URL =
  process.env.PROXY_INFO_URL ||
  "https://api.vreden.my.id/api/v1/tools/proxy?url=https://ipwho.is/?lang=id-ID&region=fr";
const COMMON_PROXY_PORTS = [3128, 8080, 8000, 8888, 1080];
const PROBE_TIMEOUT = 4000;
const FETCH_TIMEOUT = 20000;

/** جلب معلومات البروكسي من الـ endpoint المزوّد */
async function getProxyInfo() {
  try {
    const resp = await axios.get(PROXY_INFO_URL, { timeout: 7000 });
    const data = resp.data;

    const ip =
      data?.result?.content?.ip ||
      data?.result?.server?.ip ||
      data?.content?.ip ||
      data?.ip ||
      null;

    const port =
      data?.result?.server?.port ||
      data?.result?.proxy?.port ||
      data?.proxy?.port ||
      null;

    return { ip, port, raw: data };
  } catch (err) {
    return { ip: null, port: null, raw: null, error: err.message || String(err) };
  }
}

/** نجرب منافذ شائعة لنرى أيها يعمل كبروكسي */
async function probeProxyPort(ip, ports = COMMON_PROXY_PORTS) {
  if (!ip) return null;
  for (const port of ports) {
    try {
      const proxyUrl = `http://${ip}:${port}`;
      const agent = new HttpsProxyAgent(proxyUrl);

      const testResp = await axios.get("https://example.com/", {
        httpAgent: agent,
        httpsAgent: agent,
        timeout: PROBE_TIMEOUT,
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (testResp && typeof testResp.status === "number") {
        return { port, proxyUrl };
      }
    } catch (err) {
      // تجاهل الأخطاء وجرب المنفذ التالي
    }
  }
  return null;
}

/** الدالة الرئيسية لمعالجة الطلب */
export default async function handler(req, res) {
  // فقط GET مسموح
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { url } = req.query;
  if (!url || (!(url.startsWith("http://") || url.startsWith("https://")))) {
    return res.status(400).json({ error: "invalid_url", message: "Provide full url starting with http:// or https://" });
  }

  // 1) جلب info البروكسي
  const proxyInfo = await getProxyInfo();

  // إذا لم يُعطِنا الـ endpoint ip، نجرب طلب مباشر
  if (!proxyInfo.ip) {
    try {
      const direct = await axios.get(url, { timeout: FETCH_TIMEOUT, responseType: "text" });
      res.setHeader("X-Used-Proxy", "none");
      return res.status(200).send(direct.data);
    } catch (err) {
      return res.status(500).json({ error: "fetch_direct_failed", message: err.message || String(err), proxyInfo });
    }
  }

  // 2) استخدم الـ port إن وُجد، أو نجرّب المنافذ الشائعة
  let usedProxy = null;
  if (proxyInfo.port) {
    const proxyUrl = `http://${proxyInfo.ip}:${proxyInfo.port}`;
    try {
      const agent = new HttpsProxyAgent(proxyUrl);
      await axios.get(url, { httpAgent: agent, httpsAgent: agent, timeout: PROBE_TIMEOUT, validateStatus: () => true });
      usedProxy = { ip: proxyInfo.ip, port: proxyInfo.port, proxyUrl };
    } catch (err) {
      // سنجرب المنافذ الشائعة بعد ذلك
    }
  }

  if (!usedProxy) {
    const probe = await probeProxyPort(proxyInfo.ip, COMMON_PROXY_PORTS);
    if (probe) {
      usedProxy = { ip: proxyInfo.ip, port: probe.port, proxyUrl: probe.proxyUrl };
    }
  }

  // 3) إذا لم نوجد بروكسي عامل، نرجع الطلب المباشر (مع تحذير)
  if (!usedProxy) {
    try {
      const direct = await axios.get(url, { timeout: FETCH_TIMEOUT, responseType: "text" });
      res.setHeader("X-Used-Proxy", "none-found");
      res.setHeader("X-Proxy-Info", JSON.stringify(proxyInfo.raw || {}));
      return res.status(200).send(direct.data);
    } catch (err) {
      return res.status(502).json({
        error: "no_working_proxy_and_direct_failed",
        message: err.message || String(err),
        proxyInfo
      });
    }
  }

  // 4) استخدم البروكسي لجلب الـ HTML
  try {
    const agent = new HttpsProxyAgent(usedProxy.proxyUrl);
    const response = await axios.get(url, {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: FETCH_TIMEOUT,
      responseType: "text",
      maxRedirects: 5,
      validateStatus: null,
    });

    res.setHeader("X-Used-Proxy", `${usedProxy.ip}:${usedProxy.port}`);
    res.setHeader("X-Proxy-Raw", JSON.stringify(proxyInfo.raw || {}));
    return res.status(response.status || 200).send(response.data);
  } catch (err) {
    return res.status(500).json({
      error: "fetch_via_proxy_failed",
      message: err.message || String(err),
      usedProxy
    });
  }
                                                                                                 }
