import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // السماح فقط لـ GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed, only GET" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "يرجى تمرير رابط الحلقة (url) في query" });

    // جلب صفحة الحلقة
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(html);

    // بيانات الحلقة
    const title = $("title").text().trim().replace(" - Animeluxe", "") || "غير معروف";
    const description = $('meta[name="description"]').attr("content")?.trim() || "غير معروف";
    const publishDate = $('meta[property="article:published_time"]').attr("content")?.split("T")[0] || "غير معروف";
    const image = $('meta[property="og:image"]').attr("content") || $("img").first().attr("src") || null;

    // روابط التحميل
    const downloads = [];
    $("a.download-link").each((i, el) => {
      const encodedUrl = $(el).attr("data-url");
      if (!encodedUrl) return;

      const directLink = Buffer.from(encodedUrl, "base64").toString("utf-8");
      const row = $(el).closest("tr");
      const server = row.find(".favicon").attr("data-src")?.split("domain=")[1]?.split(".")[0] || "غير معروف";
      const quality = row.find(".badge.dark").text().trim() || "غير معروف";
      const language = row.find(".flag span").text().trim() || "غير معروف";

      downloads.push({
        server: server.charAt(0).toUpperCase() + server.slice(1),
        quality,
        language,
        directLink,
      });
    });

    res.status(200).json({
      metadata: { title, description, publishDate, image, url, scrapedAt: new Date().toISOString() },
      downloads,
      totalDownloads: downloads.length,
    });
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء التحليل", details: err.message });
  }
}
