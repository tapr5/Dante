import cloudscraper from "cloudscraper";
import cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "الرجاء إرسال رابط الأنمي (url)" });

  try {
    const data = await cloudscraper.get(url);
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
      const label = $(li).clone().children().remove().end().text().trim();
      const val = $(li).find("span").text().trim();
      if (label.includes("النوع")) details.type = val;
      if (label.includes("المواسم")) details.seasons = val;
      if (label.includes("الحلقات")) details.episodes = val;
      if (label.includes("مدة الحلقة")) details.episodeDuration = val;
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
