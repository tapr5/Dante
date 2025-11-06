// pages/api/episodes.js
import fetch from "node-fetch";

// تم تغيير اسم الثابت الأصلي ليتناسب مع آلية الاحتياط
const PROXY_ALLORIGINS = "https://api.allorigins.win/get?url=";
const PROXY_VREDEN = "https://api.vreden.my.id/api/v1/tools/proxy?url=";
const EXTRA_PARAMS = "?lang=id-ID&region=hk";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

// --- استخراج معرف الأنمي من صفحة HTML (مع آلية احتياطية) ---
async function getAnimeId(animeUrl) {
  // تجربة البروكسي الأول (AllOrigins)
  let proxyUrl = `${PROXY_ALLORIGINS}${encodeURIComponent(animeUrl)}`;
  let html = "";

  try {
    let res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error(`فشل في جلب الصفحة عبر البروكسي الأول (AllOrigins) بحالة: ${res.status}`);

    let data = await res.json();
    html = data.contents || "";
  } catch (err) {
    console.error("❌ خطأ أثناء محاولة البروكسي الأول:", err.message);
    
    // تجربة البروكسي الثاني (Vreden) كبديل
    proxyUrl = `${PROXY_VREDEN}${encodeURIComponent(animeUrl)}${EXTRA_PARAMS}`;
    console.log("🔄 محاولة استخدام البروكسي البديل (Vreden)...");
    try {
      let res = await fetch(proxyUrl, { headers: HEADERS });
      if (!res.ok) throw new Error(`فشل في جلب الصفحة عبر البروكسي البديل (Vreden) بحالة: ${res.status}`);

      let data = await res.json();
      // في API Vreden، محتوى HTML قد يكون داخل data.result.content
      html = data.result?.content || "";
      if (!html) {
        // إذا لم يكن في data.result.content، قد يكون البروكسي البديل لا يعمل كما هو متوقع لجلب HTML
        throw new Error("البروكسي البديل لم يُرجع محتوى HTML صحيحًا.");
      }
    } catch (err) {
      console.error("❌ خطأ أثناء محاولة البروكسي البديل:", err.message);
      return null; // فشل كلا البروكسيين
    }
  }

  // البحث عن معرف الأنمي في كود HTML
  const match = html.match(
    /href=["']https:\/\/witanime\.you\/wp-json\/wp\/v2\/anime\/(\d+)["']/
  );
  if (match) return parseInt(match[1]);
  
  // محاولة نمط أكثر مرونة إذا فشل النمط الأول
  const flexibleMatch = html.match(/wp\/v2\/anime\/(\d+)/);
  if (flexibleMatch) return parseInt(flexibleMatch[1]);

  return null;
}

// --- جلب قائمة الحلقات (باستخدام بروكسي Vreden فقط) ---
async function getEpisodesFromApi(animeId) {
  const apiUrl = `https://witanime.you/wp-json/wp/v2/episode?anime=${animeId}&per_page=100`;
  const proxyUrl = `${PROXY_VREDEN}${encodeURIComponent(apiUrl)}${EXTRA_PARAMS}`;

  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب بيانات API عبر بروكسي Vreden");

    const data = await res.json();

    // ✅ في API Vreden، الحلقات موجودة داخل data.result.content
    if (!data.result || !Array.isArray(data.result.content)) {
      throw new Error("الـ API لم يُرجع بنية بيانات صحيحة");
    }

    const episodesData = data.result.content;

    const episodes = episodesData.map((ep) => ({
      id: ep.id,
      title: ep.title?.rendered || "بدون عنوان",
      url: ep.link || "#",
      date: ep.date || null,
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

  // 1. استخراج Anime ID (باستخدام آلية الاحتياط)
  const animeId = await getAnimeId(url);
  if (!animeId) {
    return res
      .status(502)
      .json({ error: "تعذر استخراج Anime ID من الرابط." });
  }

  // 2. جلب قائمة الحلقات (باستخدام بروكسي Vreden)
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
