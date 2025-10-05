// /pages/api/animerco.js
import * as cheerio from "cheerio";

// نستدعي cloudscraper بـ require
const cloudscraper = require("cloudscraper");

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "يرجى إدخال رابط الحلقة ?url=" });
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // 1️⃣ جلب الصفحة بـ cloudscraper
    const response = await cloudscraper.get({ uri: url, headers });
    const $ = cheerio.load(response);

    // بيانات أساسية
    const title =
      $("title").text().replace(" - Animerco", "").trim() || "غير معروف";
    const description =
      $('meta[name="description"]').attr("content")?.trim() || "غير معروف";
    const publishDate =
      $(".publish-date").text().replace("أضيفت في", "").trim() || "غير معروف";
    const image = $('meta[property="og:image"]').attr("content") || null;

    // 2️⃣ استخراج روابط التحميل
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

    // 3️⃣ جلب الروابط المباشرة من صفحات الانتظار
    for (let d of downloads) {
      try {
        const waitHtml = await cloudscraper.get({
          uri: d.waitPage,
          headers,
          timeout: 10000,
        });
        const _$ = cheerio.load(waitHtml);
        const encoded = _$("#link").attr("data-url");
        if (encoded) {
          const buff = Buffer.from(encoded, "base64");
          d.directLink = buff.toString("utf-8");
        } else {
          d.directLink = d.waitPage; // fallback
        }
      } catch (err) {
        console.error("⚠️ خطأ في جلب رابط الانتظار:", d.waitPage, err.message);
        d.directLink = d.waitPage;
      }
    }

    const result = {
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
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء المعالجة", details: err.message });
  }
      }
