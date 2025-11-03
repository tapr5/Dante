// handler.js
import axios from "axios";
import * as cheerio from "cheerio";
import { Buffer } from "buffer";

/* رؤوس لتقليد متصفح */
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

/* تحويل سداسي -> بايتات */
function toArray(hexStr) {
  const bytes = [];
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
  const keylen = secret.length;
  for (let i = 0; i < data.length; i++) {
    out += String.fromCharCode(data[i] ^ secret.charCodeAt(i % keylen));
  }
  return out;
}

/* استخراج متغيرات من سكربت HTML */
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

    // حاول parse كـ JSON، قم بتحويل ' الى " إذا لزم
    try {
      const valueJsonStr =
        (valueStr.startsWith("{") || valueStr.startsWith("["))
          ? valueStr.replace(/'/g, '"')
          : valueStr;
      varsData[name] = JSON.parse(valueJsonStr);
    } catch (e) {
      // إذا لم يكن JSON خزن النص كما هو
      varsData[name] = valueStr;
    }
  }

  return varsData;
}

/* جلب HTML — يدعم allorigins proxy تلقائياً إذا مررنا URL صفحة مباشرة */
async function fetchHtmlThroughAllOrigins(originalUrl) {
  // إذا المستخدم أعطى رابط allorigins مسبقًا فاستعمله كما هو
  if (originalUrl.startsWith("https://api.allorigins.win/raw?url=")) {
    const resp = await axios.get(originalUrl, { headers: HEADERS, timeout: 20000 });
    return resp.data;
  }

  const encoded = encodeURIComponent(originalUrl);
  const proxyUrl = `https://api.allorigins.win/raw?url=${encoded}`;
  const resp = await axios.get(proxyUrl, { headers: HEADERS, timeout: 20000 });
  return resp.data;
}

/* الدالة الرئيسية لفك الروابط */
export async function decryptWitanimeLinks(url) {
  if (!url || typeof url !== "string") {
    throw new Error("يجب تمرير رابط صالح (string) كوسيط.");
  }

  let htmlContent;
  try {
    htmlContent = await fetchHtmlThroughAllOrigins(url);
  } catch (e) {
    throw new Error(`فشل في جلب محتوى الصفحة عبر allorigins: ${e.message}`);
  }

  const $ = cheerio.load(htmlContent);

  // العثور على الوسم الذي يحتوي المتغيرات (مذكور في الكود الأصلي)
  const scriptTag = $("#lkgx-js-extra");
  if (!scriptTag || !scriptTag.html()) {
    throw new Error("لم يتم العثور على وسم السكريبت المشفر (#lkgx-js-extra).");
  }

  const scriptHtml = scriptTag.html();
  const varsData = extractJsVars(scriptHtml);

  if (!varsData || !varsData._m || !varsData._t || !varsData._s) {
    throw new Error(
      "فشل في استخراج المتغيرات الأساسية (_m, _t, _s) من السكربت."
    );
  }

  // الحصول على المفتاح السري (مشفر base64 عادة في _m.r أو _m)
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

  // جمع أسماء السيرفرات إن وُجدت (للعرض)
  const serverNames = [];
  $(".episode-download-container .quality-list .notice").each((i, el) => {
    const t = $(el).text().trim();
    if (t) serverNames.push(t);
  });

  // تحديد عدد الروابط من _t.l أو _t
  let totalLinks = 0;
  try {
    totalLinks = parseInt(varsData._t.l || varsData._t, 10);
  } catch (e) {
    // fallback
    totalLinks = Array.from({ length: 12 }).length;
  }

  const finalLinks = [];

  for (let i = 0; i < totalLinks; i++) {
    const pVarName = `_p${i}`;
    const chunks = varsData[pVarName];
    if (!chunks) continue;
    const seqRawData = varsData._s;
    if (!Array.isArray(seqRawData) || i >= seqRawData.length) continue;
    const seqRaw = seqRawData[i];

    // فك تسلسل seq
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

    // تركيب الأجزاء حسب seq
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

/* API handler (مثال لصفحة /api/decrypt) */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const { url } = req.query;
  if (!url) {
    return res
      .status(400)
      .json({ success: false, error: "الرجاء تمرير المعامل url" });
  }

  try {
    const links = await decryptWitanimeLinks(String(url));
    return res.status(200).json({ success: true, episodeUrl: url, links });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: "فشل في فك تشفير الروابط",
      details: e.message,
    });
  }
}
