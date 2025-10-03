import cloudscraper from "cloudscraper";

async function parseBody(req) {
  if (req.body && Object.keys(req.body).length) return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { resolve({ raw: data }); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseBody(req);
    const { targetUrl, message, headers } = body;

    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).json({ error: "missing or invalid targetUrl" });
    }

    const contentType =
      (headers && (headers["content-type"] || headers["Content-Type"])) ||
      "application/json";

    const postBody = contentType.includes("application/json")
      ? (typeof message === "string" ? message : JSON.stringify(message ?? {}))
      : (typeof message === "string" ? message : String(message ?? ""));

    const options = {
      method: "POST",
      uri: targetUrl,
      body: postBody,
      headers: { ...(headers || {}), "content-type": contentType },
      encoding: null, // 🔑 مهم → يخلي الرد raw (Buffer)
      gzip: true,
      followAllRedirects: true,
      resolveWithFullResponse: true
    };

    const response = await cloudscraper.request(options);

    // إعادة كل headers من السيرفر الأصلي تقريبًا
    Object.entries(response.headers || {}).forEach(([k, v]) => {
      if (typeof v === "string") res.setHeader(k, v);
    });

    res.status(response.statusCode || 200).send(response.body);

  } catch (err) {
    return res.status(500).json({ error: "request failed", details: err?.message ?? String(err) });
  }
  }
