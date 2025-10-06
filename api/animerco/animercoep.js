import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "الرجاء إرسال رابط الموسم (url)" });

  try {
    const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);

    const episodes = [];
    $(".episodes-lists li").each((_, ep) => {
      const number = $(ep).attr("data-number") || "غير معروف";
      const title = $(ep).find(".image.lazyactive").attr("title") || "بدون عنوان";
      const imageUrl = $(ep).find(".image.lazyactive").attr("data-src") || "";
      const watchUrl = $(ep).find("a[href]").first().attr("href") || "";
      const fullTitle = $(ep).find("h3").text().trim();
      episodes.push({ number, title, imageUrl, watchUrl, fullTitle });
    });

    res.status(200).json({ count: episodes.length, episodes });
  } catch (e) {
    res.status(500).json({ error: "فشل في جلب الحلقات", details: e.message });
  }
}
