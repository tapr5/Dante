import axios from "axios";
import * as cheerio from "cheerio";

function extractAnimeInfo($, card) {
  try {
    const title = $(card).find("h3").text().trim() || "غير معروف";
    const aired = $(card).find(".anime-aired").text().trim() || "غير معروف";
    const ratingText = $(card).find(".badge").text().trim();
    const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
    const rating = ratingMatch ? ratingMatch[1] : "غير معروف";
    const imageUrl = $(card).find(".image.lazyactive").attr("data-src") || "";
    const watchUrl = $(card).find("a[href]").first().attr("href") || "";
    const animeType = $(card).find(".anime-type").text().trim() || "غير معروف";

    return { title, aired, rating, imageUrl, watchUrl, type: animeType };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "الرجاء إرسال اسم الأنمي (q)" });

  try {
    const url = `https://tv.animerco.org/?s=${encodeURIComponent(q)}`;
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(data);

    const results = [];
    $(".media-block").each((_, el) => {
      const info = extractAnimeInfo($, el);
      if (info) results.push(info);
    });

    res.status(200).json({ count: results.length, results });
  } catch (e) {
    res.status(500).json({ error: "فشل في الاتصال بالموقع", details: e.message });
  }
}
