// pages/api/episodes.js
import fetch from "node-fetch";

const PROXY = "https://api.allorigins.win/get?url=";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

// --- استخراج معرف الأنمي من صفحة HTML ---
async function getAnimeId(animeUrl) {
  const proxyUrl = `${PROXY}${encodeURIComponent(animeUrl)}`;
  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب الصفحة عبر البروكسي");

    const data = await res.json();
    const html = data.contents || "";

    // البحث عن معرف الأنمي في كود HTML
    const match = html.match(
      /href=["']https:\/\/witanime\.you\/wp-json\/wp\/v2\/anime\/(\d+)["']/
    );
    if (match) return parseInt(match[1]);
    return null;
  } catch (err) {
    console.error("❌ خطأ أثناء استخراج Anime ID:", err.message);
    return null;
  }
}

// --- جلب قائمة الحلقات ---
async function getEpisodesFromApi(animeId) {
  const apiUrl = `https://witanime.you/wp-json/wp/v2/episode?anime=${animeId}&per_page=100`;
  const proxyUrl = `${PROXY}${encodeURIComponent(apiUrl)}`;

  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب بيانات API عبر البروكسي");

    const data = await res.json();
    const content = data.contents;
    if (!content) throw new Error("الـ API أرجع محتوى فارغ");

    const episodesData = JSON.parse(content);

    const episodes = episodesData.map((ep) => ({
      title: ep.title?.rendered || "بدون عنوان",
      url: ep.link || "#",
    }));

    // عكس الترتيب (من الأقدم للأحدث)
    return episodes.reverse();
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الحلقات:", err.message);
    return { error: err.message };
  }
}

// --- نقطة النهاية الرئيسية ---
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ error: "يرجى تمرير معامل 'url' في الرابط." });
  }

  // 1. استخراج Anime ID
  const animeId = await getAnimeId(url);
  if (!animeId) {
    return res
      .status(502)
      .json({ error: "تعذر استخراج Anime ID من الرابط." });
  }

  // 2. جلب قائمة الحلقات
  const episodes = await getEpisodesFromApi(animeId);
  if (episodes.error) {
    return res.status(502).json({ error: episodes.error });
  }

  // 3. إرسال النتيجة النهائية
  return res.status(200).json({
    anime_url: url,
    extracted_anime_id: animeId,
    episode_count: episodes.length,
    episodes,
  });
}
