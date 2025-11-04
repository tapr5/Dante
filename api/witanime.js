// pages/api/decrypt.js  (أو handler.js)
import axios from "axios";
import * as cheerio from "cheerio";
import { Buffer } from "buffer";

// رؤوس لمحاكاة متصفح حقيقي
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

/* تحويل سداسي -> بايتات */
function toArray(hexStr) {
  const bytes = [];
  if (!hexStr) return bytes;
  for (let i = 0; i < hexStr.length; i += 2) {
    const part = hexStr.substring(i, i + 2);
    if (!part) continue;
    const v = parseInt(part, 16);
    if (!Number.isNaN(v)) bytes.push(v);
  }
  return bytes;
}

/* XOR decryption */
function process(rawHex, secret) {
  let out = "";
  const data = toArray(rawHex);
  const keylen = secret.length || 1;
  for (let i = 0; i < data.length; i++) {
    out += String.fromCharCode(data[i] ^ secret.charCodeAt(i % keylen));
  }
  return out;
}

/* استخراج المتغيرات من سكربت HTML */
function extractJsVars(scriptContent) {
  const varsData = {};
  const varNames = ["_m", "_t", "_s"];
  for (let i = 0; i < 12; i++) varNames.push(`_p${i}`);

  for (const name of varNames) {
    const regex = new RegExp(
      `var\\s+${name}\\s*=\\s*(\\[.*?\\]|\\{.*?\\}|".*?"|'.*?');`,
      "s"
    );
    const match = scriptContent.match(regex);
    if (!match) continue;
    let valueStr = match[1].replace(/\n|\t/g, "").trim();

    // إزالة الاقتباسات الخارجية إن وجدت
    if (
      (valueStr.startsWith('"') && valueStr.endsWith('"')) ||
      (valueStr.startsWith("'") && valueStr.endsWith("'"))
    ) {
      valueStr = valueStr.substring(1, valueStr.length - 1);
    }

    try {
      const valueJsonStr =
        (valueStr.startsWith("{") || valueStr.startsWith("["))
          ? valueStr.replace(/'/g, '"')
          : valueStr;
      varsData[name] = JSON.parse(valueJsonStr);
    } catch (e) {
      varsData[name] = valueStr;
    }
  }

  return varsData;
}

/* دالة جلب HTML: تحاول جلبه مباشرة ثم تسقط إلى allorigins عند الفشل */
async function fetchHtmlWithFallback(originalUrl) {
  // أولاً حاول الوصول مباشرة
  try {
    const resp = await axios.get(originalUrl, {
      headers: HEADERS,
      timeout: 20000,
      maxRedirects: 5,
      decompress: true,
      validateStatus: (s) => true, // سنتعامل مع الحالة يدوياً
    });

    // إذا نجح (200) أو غيره من حالات القبول (مثلاً 2xx-3xx) نأخذ المحتوى
    if (resp.status >= 200 && resp.status < 400 && resp.data) {
      return { html: resp.data, via: "direct", status: resp.status };
    }
    // إن كان الرد خطأ من السيرفر الهدف (مثل 403/503) ننتقل للبروكسي
  } catch (err) {
    // تجاوز الخطأ للانتقال إلى allorigins
  }

  // استخدم allorigins كـ fallback
  try {
    const encoded = encodeURIComponent(originalUrl);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encoded}`;
    const resp2 = await axios.get(proxyUrl, {
      headers: HEADERS,
      timeout: 25000,
      validateStatus: (s) => s < 500,
    });

    if (resp2.status >= 200 && resp2.status < 500 && resp2.data) {
      return { html: resp2.data, via: "allorigins", status: resp2.status };
    }

    throw new Error(`allorigins returned status ${resp2.status}`);
  } catch (e) {
    throw new Error(`فشل في جلب المحتوى (direct & proxy): ${e.message}`);
  }
}

/* الدالة الرئيسية لفك الروابط */
export async function decryptWitanimeLinksFromHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);

  // العثور على وسم السكربت المشفر (قد يختلف الاسم حسب الموقع)
  const scriptTag = $("#lkgx-js-extra");
  if (!scriptTag || !scriptTag.html()) {
    throw new Error("لم يتم العثور على وسم السكريبت المشفر (#lkgx-js-extra).");
  }
  const scriptHtml = scriptTag.html();
  const varsData = extractJsVars(scriptHtml);

  if (!varsData || !varsData._m || !varsData._t || !varsData._s) {
    throw new Error("فشل في استخراج المتغيرات الأساسية (_m, _t, _s).");
  }

  // فك مفتاح base64
  const secretB64 = (varsData._m && (varsData._m.r || varsData._m)) || null;
  if (!secretB64 || typeof secretB64 !== "string") {
    throw new Error("المفتاح السري غير موجود أو ليس من نوع string.");
  }

  let secret;
  try {
    secret = Buffer.from(secretB64, "base64").toString("utf-8");
  } catch (e) {
    throw new Error("فشل في فك base64 للمفتاح السري: " + e.message);
  }

  // أسماء السيرفرات (اختياري للعرض)
  const serverNames = [];
  $(".episode-download-container .quality-list .notice").each((i, el) => {
    const t = $(el).text().trim();
    if (t) serverNames.push(t);
  });

  // عدد الروابط
  let totalLinks = 0;
  try {
    totalLinks = parseInt(varsData._t.l || varsData._t, 10);
  } catch (e) {
    totalLinks = 12;
  }

  const finalLinks = [];

  for (let i = 0; i < totalLinks; i++) {
    const pVarName = `_p${i}`;
    const chunks = varsData[pVarName];
    if (!chunks) continue;
    const seqRawData = varsData._s;
    if (!Array.isArray(seqRawData) || i >= seqRawData.length) continue;
    const seqRaw = seqRawData[i];

    // فك seq
    let seq;
    try {
      const seqJson = process(seqRaw, secret);
      seq = JSON.parse(seqJson);
      if (!Array.isArray(seq)) throw new Error("seq ليس مصفوفة");
    } catch (e) {
      continue;
    }

    // فك كل chunk
    let decryptedChunks;
    try {
      decryptedChunks = chunks.map((chunk) => process(chunk, secret));
    } catch (e) {
      continue;
    }

    // ترتيب الأجزاء
    const arranged = new Array(seq.length).fill("");
    for (let j = 0; j < seq.length; j++) {
      const pos = seq[j];
      if (typeof pos === "number" && pos < decryptedChunks.length) {
        arranged[pos] = decryptedChunks[j];
      }
    }

    const finalLink = arranged.join("");
    if (!finalLink) continue;

    const name = serverNames[i] || `رابط ${i + 1}`;
    finalLinks.push({ server: name, link: finalLink });
  }

  if (finalLinks.length === 0) {
    throw new Error("لم يتم فك أي روابط تحميل.");
  }

  return finalLinks;
}

/* API handler */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const url = req.query.url;
  if (!url) {
    return res
      .status(400)
      .json({ success: false, error: "الرجاء تمرير المعامل ?url=" });
  }

  try {
    // جلب HTML (يحاول direct ثم allorigins)
    const { html, via, status } = await fetchHtmlWithFallback(String(url));

    // فك الروابط اعتماداً على الـ HTML
    let links;
    try {
      links = await decryptWitanimeLinksFromHtml(html);
    } catch (e) {
      // إن فشل فك الروابط، نُرجع html مع رسالة الخطأ لسهولة التصحيح
      return res.status(200).json({
        success: false,
        note:
          "تم جلب HTML بنجاح، لكن فشل فك الروابط. راجع details لمزيد من المعلومات.",
        fetch: { via, status },
        htmlSnippet: html.substring(0, 4000), // لا نُرجع كامل الصفحة لتقليل الحجم، نُظهر مقتطف
        details: e.message,
      });
    }

    // النتيجة النهائية: نُرجع html (مقتطف) + روابط
    return res.status(200).json({
      success: true,
      fetch: { via, status },
      episodeUrl: url,
      links,
      // إذا أردت كامل الـ HTML أزل .substring
      htmlSnippet: html.substring(0, 4000),
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "فشل في جلب الصفحة أو فك تشفيرها",
      details: e.message,
    });
  }
}
