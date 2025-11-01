import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "الرجاء إرسال رابط الأنمي (url)" });

  try {
    const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(data);

    const details = {
      type: "غير معروف",
      seasons: "غير معروف",
      episodes: "غير معروف",
      episodeDuration: "غير معروف",
      genres: [],
      story: "غير متوفر",
      seasonsList: [],
    };

    $(".media-info li").each((_, li) => {
      const text = $(li).text().trim();
      const val = $(li).find("span").text().trim();
      if (text.includes("النوع:")) details.type = val;
      else if (text.includes("المواسم:")) details.seasons = val;
      else if (text.includes("الحلقات:")) details.episodes = val;
      else if (text.includes("مدة الحلقة:")) details.episodeDuration = val;
    });

    $(".genres .badge").each((_, g) => details.genres.push($(g).text().trim()));
    details.story = $(".content p").first().text().trim() || "غير متوفر";

    $(".media-seasons li").each((_, s) => {
      const title = $(s).find("h3").text().trim();
      const status = $(s).find(".badge").text().trim();
      const seasonUrl = $(s).find("a[href]").attr("href");
      const poster = $(s).find(".poster").attr("data-src");
      if (title) details.seasonsList.push({ title, status, url: seasonUrl, poster });
    });

    res.status(200).json(details);
  } catch (e) {
    res.status(500).json({ error: "فشل في جلب التفاصيل", details: e.message });
  }
}
