import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://witanime.you/";
const PROXY_URL = "http://217.154.201.164:7763/api/proxy?url=";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
};

/**
 * جلب HTML مباشرة أو عبر بروكسي
 */
async function fetchHtml(url) {
  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    if (response.status === 200) return response.data;
  } catch {}

  // إذا فشل الجلب المباشر، نستخدم البروكسي
  const proxiedUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
  try {
    const response = await axios.get(proxiedUrl, {
      headers: HEADERS,
      timeout: 15000,
    });
    if (response.status !== 200)
      throw new Error(`فشل عبر البروكسي: ${response.status}`);
    return response.data;
  } catch (e) {
    throw new Error(`فشل في جلب الصفحة: ${e.message}`);
  }
}

/**
 * استخراج نتائج البحث
 */
export async function searchAnime(query) {
  if (!query) return [];

  const searchUrl = `${BASE_URL}?search_param=animes&s=${encodeURIComponent(
    query
  )}`;
  const htmlContent = await fetchHtml(searchUrl);
  const $ = cheerio.load(htmlContent);

  const results = [];

  $(".anime-list-content .anime-card-container").each((i, el) => {
    const element = $(el);

    const link = element.find(".anime-card-poster a.overlay").attr("href");
    const title = element.find(".anime-card-title h3 a").text().trim();
    const status = element.find(".anime-card-status a").text().trim();
    const poster = element
      .find(".anime-card-poster img")
      .attr("src")
      ?.trim()
      .replace(/\?.*$/, ""); // إزالة أي query من الصورة

    if (title && link) {
      results.push({
        title,
        url: link.startsWith("http") ? link : BASE_URL + link,
        status: status || "غير معروف",
        poster: poster || "غير متوفر",
      });
    }
  });

  return results;
}

/**
 * دالة Serverless API
 */
export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { q } = req.query;
  if (!q)
    return res
      .status(400)
      .json({ error: "الرجاء إرسال كلمة البحث (q) كمعامل استعلام." });

  try {
    const results = await searchAnime(q);
    res.status(200).json({
      success: true,
      query: q,
      count: results.length,
      results,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: "فشل في عملية البحث",
      details: e.message,
    });
  }
}
