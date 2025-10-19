// /app/api/direct/route.js أو /pages/api/direct.js
import axios from "axios";
import ProxyAgent from "proxy-agent";

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
let PROXY_POOL = [];
let LAST_PROXY_FETCH = 0;
const PROXY_TTL_MS = 1000 * 60 * 3; // إعادة جلب البروكسي كل 3 دقائق

async function fetchProxiesFromSource() {
  try {
    const res = await axios.get(PROXY_SOURCE, { timeout: 8000 });
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : raw?.data?.proxies || raw?.proxies || [];
    const filtered = list
      .filter((p) => {
        const httpsOk = (String(p.https || p.is_https || "").toLowerCase() === "yes") || (String(p.protocol || "").toLowerCase().includes("https"));
        const elite = (String(p.anonymity || p.anonymous || "").toLowerCase().includes("elite") || String(p.level || "").toLowerCase() === "elite");
        return httpsOk && elite && (p.ip || p.host) && (p.port || p.p);
      })
      .map((p) => {
        const ip = p.ip || p.host;
        const port = p.port || p.p;
        return { url: `http://${ip}:${port}`, meta: p };
      });
    return filtered;
  } catch (err) {
    console.error("fetchProxiesFromSource error:", err.message || err);
    return [];
  }
}

// فحص البروكسي بسرعة
async function probeProxy(proxyUrl, timeout = 7000) {
  try {
    const agent = new ProxyAgent(proxyUrl);
    await axios.get("https://gateway.anime-rift.com/healthcheck", {
      httpsAgent: agent,
      timeout,
      validateStatus: () => true,
    });
    return true;
  } catch {
    return false;
  }
}

async function refreshProxyPoolIfNeeded() {
  const now = Date.now();
  if (now - LAST_PROXY_FETCH < PROXY_TTL_MS && PROXY_POOL.length > 0) return;
  LAST_PROXY_FETCH = now;

  const candidates = await fetchProxiesFromSource();
  const healthy = [];
  const limit = Math.min(candidates.length, 12);
  for (let i = 0; i < limit; i++) {
    const p = candidates[i];
    const ok = await probeProxy(p.url, 5000);
    if (ok) healthy.push({ url: p.url, lastChecked: Date.now(), meta: p.meta });
  }

  if (healthy.length > 0) {
    PROXY_POOL = healthy;
    console.log("Proxy pool refreshed:", PROXY_POOL.map((p) => p.url));
  } else {
    console.warn("No healthy proxies found, keeping old pool length:", PROXY_POOL.length);
  }
}

function pickProxyRoundRobin(attempt = 0) {
  if (!PROXY_POOL.length) return null;
  const idx = attempt % PROXY_POOL.length;
  return PROXY_POOL[idx].url;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url, `https://${req.headers.get('host')}`);
    const id = searchParams.get("id");
    const quality = searchParams.get("quality") || "360P";
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400 });

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
      const agent = proxy ? new ProxyAgent(proxy) : undefined;

      try {
        const { data } = await axios.get(url, {
          headers,
          httpsAgent: agent,
          timeout: 20000,
        });

        return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        console.error(`Attempt ${attempt + 1} failed (proxy=${proxy || "none"}):`, status || err.message);

        if (status && status >= 400 && status < 500) {
          return new Response(JSON.stringify({ error: err.response?.data || err.message }), {
            status: status,
            headers: { "Content-Type": "application/json" },
          });
        }
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
