// /pages/api/animerco.js
import cloudscraper from "cloudscraper";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // السماح فقط بـ GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "يرجى تمرير رابط الحلقة (url) في query" });
    }

    // 1️⃣ جلب الصفحة الرئيسية
    const html = await cloudscraper.get(url);
    const $ = cheerio.load(html);

    // بيانات أساسية
    const title = $("title").text().replace(" - Animerco", "").trim() || "غير معروف";
    const description = $('meta[name="description"]').attr("content")?.trim() || "غير معروف";
    const publishDate = $(".publish-date").text().replace("أضيفت في", "").trim() || "غير معروف";
    const image = $('meta[property="og:image"]').attr("content") || null;

    // 2️⃣ استخراج روابط التحميل من الجدول
    let downloads = [];
    $("#download tbody tr").each((i, el) => {
      const tds = $(el).find("td");
      if (tds.length < 4) return;

      const quality = $(tds[2]).text().trim();
      const language = $(tds[3]).text().trim();
      const server = $(tds[1]).text().trim();
      const waitLink = $(tds[0]).find("a").attr("href");

      if (!waitLink) return;

      downloads.push({
        server,
        quality,
        language,
        waitPage: waitLink,
      });
    });

    // 3️⃣ جلب صفحات الانتظار واستخراج الروابط الحقيقية
    for (let d of downloads) {
      try {
        const waitHtml = await cloudscraper.get(d.waitPage);
        const _$ = cheerio.load(waitHtml);
        const encoded = _$("#link").attr("data-url");
        if (encoded) {
          d.directLink = Buffer.from(encoded, "base64").toString("utf-8");
        } else {
          d.directLink = d.waitPage; // fallback
        }
      } catch (err) {
        console.error("⚠️ خطأ في جلب صفحة الانتظار:", err.message);
        d.directLink = d.waitPage;
      }
    }

    // 4️⃣ النتيجة النهائية
    return res.status(200).json({
      metadata: {
        title,
        description,
        publishDate,
        image,
        url,
        scrapedAt: new Date().toISOString(),
      },
      downloads,
      totalDownloads: downloads.length,
    });
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    return res.status(500).json({
      error: "❌ حدث خطأ أثناء المعالجة",
      details: err.message,
    });
  }
}
