// pages/api/episodes.js
import fetch from "node-fetch";

// 🧩 إعدادات البروكسي و الهيدر
const PROXY_VREDEN = "https://api.vreden.my.id/api/v1/tools/proxy?url=";
const EXTRA_PARAMS = "?lang=id-ID&region=hk";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

// --- استخراج معرف الأنمي من صفحة HTML ---
async function getAnimeId(animeUrl) {
  const proxyUrl = `${PROXY_VREDEN}${encodeURIComponent(animeUrl)}${EXTRA_PARAMS}`;
  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب الصفحة عبر البروكسي");

    const data = await res.json();
    const html = data.result?.content || "";

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

// --- جلب قائمة الحلقات عبر بروكسي Vreden ---
async function getEpisodesFromApi(animeId) {
  const apiUrl = `https://witanime.you/wp-json/wp/v2/episode?anime=${animeId}&per_page=100`;
  const proxyUrl = `${PROXY_VREDEN}${encodeURIComponent(apiUrl)}${EXTRA_PARAMS}`;

  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب بيانات API عبر بروكسي Vreden");

    const data = await res.json();

    // ✅ البيانات الحقيقية موجودة داخل data.result.content (مصفوفة)
    if (!data.result || !Array.isArray(data.result.content)) {
      throw new Error("الـ API لم يُرجع بنية بيانات صحيحة");
    }

    const episodesData = data.result.content;

    const episodes = episodesData.map(ep => ({
      id: ep.id,
      title: ep.title?.rendered || "بدون عنوان",
      url: ep.link || "#",
      date: ep.date || null
    }));

    // ترتيب من الأقدم إلى الأحدث
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
