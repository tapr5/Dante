// route.js
import axios from "axios";
import HttpsProxyAgent from "https-proxy-agent";

/**
 * Config:
 * ضع القيم الحقيقية في متغيرات البيئة (process.env)
 * - ANIME_AUTHORIZATION
 * - ANIME_INTEGRITY
 * - X_DEVICE_ID
 * - DEVICE_RELEASE_VERSION (مثلاً "3.5.1")
 * - USER_AGENT (مثلاً "Dart/3.8 (dart:io)")
 */

const PROXY_SOURCE = "https://api.nekolabs.my.id/tools/free-proxy";
let PROXY_POOL = []; // [{ url: "http://ip:port", lastChecked: Date }]
let LAST_PROXY_FETCH = 0;
const PROXY_TTL_MS = 1000 * 60 * 3; // إعادة جلب البروكسي كل 3 دقائق

async function fetchProxiesFromSource() {
  try {
    const res = await axios.get(PROXY_SOURCE, { timeout: 8000 });
    // --- تكييف الاستجابة إن اختلف الشكل ---
    // مثال متوقع: res.data = [{ ip: "66.201.7.213", port: "3128", https: "yes", anonymity: "elite proxy", ... }, ...]
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : raw?.data || raw?.proxies || [];
    const filtered = list
      .filter((p) => {
        const httpsOk = (String(p.https || p.is_https || p.protocol || "").toLowerCase() === "yes" || String(p.protocol || "").toLowerCase().includes("https"));
        const elite = (String(p.anonymity || p.anonymous || "").toLowerCase().includes("elite") || String(p.level || "").toLowerCase() === "elite");
        return httpsOk && elite && (p.ip || p.host) && (p.port || p.p);
      })
      .map((p) => {
        const ip = p.ip || p.host;
        const port = p.port || p.p;
        // لو البروكسي يحتاج auth استخدم user:pass@ip:port
        return { url: `http://${ip}:${port}`, meta: p };
      });

    return filtered;
  } catch (err) {
    console.error("fetchProxiesFromSource error:", err.message || err);
    return [];
  }
}

// فحص سريع لبروكسي — نتأكد أنها تعمل عبر طلب صغير إلى موقع هدف
async function probeProxy(proxyUrl, timeout = 7000) {
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    // نعمل طلب بسيط مع timeout قصير
    const resp = await axios.get("https://gateway.anime-rift.com/healthcheck", {
      httpsAgent: agent,
      timeout,
      validateStatus: () => true, // نسمح بكل الرموز لأننا فقط نريد اتصال TCP/HTTPS ناجح
    });
    // إذا استجابت الخادم بأي رمز أو رد (حتى 4xx) نعتبر البروكسي صالحًا للاتصال الشبكي
    return true;
  } catch (err) {
    return false;
  }
}

async function refreshProxyPoolIfNeeded() {
  const now = Date.now();
  if (now - LAST_PROXY_FETCH < PROXY_TTL_MS && PROXY_POOL.length > 0) return;
  LAST_PROXY_FETCH = now;
  const candidates = await fetchProxiesFromSource();
  const healthy = [];
  // نفحص أول N بروكسيات فقط لتسريع العملية
  const limit = Math.min(candidates.length, 12);
  for (let i = 0; i < limit; i++) {
    const p = candidates[i];
    try {
      const ok = await probeProxy(p.url, 5000);
      if (ok) healthy.push({ url: p.url, lastChecked: Date.now(), meta: p.meta });
    } catch (e) { /* تجاهل */ }
  }
  if (healthy.length > 0) {
    PROXY_POOL = healthy;
    console.log("Proxy pool refreshed:", PROXY_POOL.map(p => p.url));
  } else {
    console.warn("No healthy proxies found (kept old pool length:", PROXY_POOL.length, ")");
  }
}

function pickProxyRoundRobin(attempt = 0) {
  if (!PROXY_POOL.length) return null;
  const idx = attempt % PROXY_POOL.length;
  return PROXY_POOL[idx].url;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const quality = searchParams.get("quality") || "360P";
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });

    // تحديث البروكسيات عند الحاجة
    await refreshProxyPoolIfNeeded();

    const url = `https://gateway.anime-rift.com/api/v3/library/episode/source/direct_link/${id}?action=download&quality=${quality}${sessionId ? `&sessionId=${sessionId}` : ""}`;

    const headers = {
      "x-device-release-version": process.env.DEVICE_RELEASE_VERSION || "3.5.1",
      "user-agent": process.env.USER_AGENT || "Dart/3.8 (dart:io)",
      "accept-encoding": "gzip, deflate",
      "authorization": process.env.ANIME_AUTHORIZATION || "Bearer_REPLACE_ME",
      "integrity": process.env.ANIME_INTEGRITY || "Bearer_REPLACE_ME",
      "content-type": "application/json; charset=UTF-8",
      "accept": "application/json",
      "host": "gateway.anime-rift.com",
      "x-device-timezone": new Date().toISOString(),
      "x-device-id": process.env.X_DEVICE_ID || "REPLACE_DEVICE_ID",
      "x-device-language": "en",
      "x-platform": "Mobile",
    };

    const maxRetries = Math.max(2, PROXY_POOL.length || 2);
    let lastErr = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const proxy = pickProxyRoundRobin(attempt);
      const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : undefined;

      try {
        const { data } = await axios.get(url, {
          headers,
          httpsAgent,
          timeout: 15_000,
        });

        // نجاح
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        console.error(`Attempt ${attempt + 1} failed (proxy=${proxy || "none"}):`, status || err.message);

        // إذا خطأ 4xx => مشكلة هيدرز (authorization/integrity) — أعد الرد بالمحتوى
        if (status && status >= 400 && status < 500) {
          return new Response(JSON.stringify({ error: err.response?.data || err.message }), {
            status: status,
            headers: { "Content-Type": "application/json" },
          });
        }

        // خلاف ذلك استمر وجرّب بروكسي آخر
      }
    }

    return new Response(JSON.stringify({ error: "All attempts failed", details: lastErr?.message || null }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("API route unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
