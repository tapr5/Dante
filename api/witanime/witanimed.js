// app/api/episodes/route.js
import { NextResponse } from "next/server";

const PROXY = "https://api.allorigins.win/get?url=";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

// 🔹 استخراج معرف الأنمي من صفحة HTML
async function getAnimeId(animeUrl) {
  const proxyUrl = `${PROXY}${encodeURIComponent(animeUrl)}`;

  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل جلب الصفحة عبر البروكسي");

    const data = await res.json();
    const html = data.contents || "";

    const match = html.match(
      /href=["']https:\/\/witanime\.you\/wp-json\/wp\/v2\/anime\/(\d+)["']/
    );

    if (match) return parseInt(match[1]);
    return null;
  } catch (err) {
    console.error("خطأ أثناء استخراج ID:", err.message);
    return null;
  }
}

// 🔹 جلب قائمة الحلقات من واجهة API عبر البروكسي
async function getEpisodesFromApi(animeId) {
  const apiUrl = `https://witanime.you/wp-json/wp/v2/episode?anime=${animeId}&per_page=100`;
  const proxyUrl = `${PROXY}${encodeURIComponent(apiUrl)}`;

  try {
    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل جلب بيانات API عبر البروكسي");

    const data = await res.json();
    const content = data.contents;
    if (!content) throw new Error("محتوى API فارغ");

    const episodesData = JSON.parse(content);

    const episodes = episodesData.map((ep) => ({
      title: ep.title?.rendered || "بدون عنوان",
      url: ep.link || "#",
    }));

    // عكس الترتيب (الأقدم أولاً)
    return episodes.reverse();
  } catch (err) {
    console.error("خطأ أثناء جلب الحلقات:", err.message);
    return { error: err.message };
  }
}

// 🔹 نقطة النهاية الرئيسية
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const animeUrl = searchParams.get("url");

  if (!animeUrl) {
    return NextResponse.json(
      { error: "يجب تمرير معامل 'url' في الرابط." },
      { status: 400 }
    );
  }

  // 1. استخراج ID الأنمي
  const animeId = await getAnimeId(animeUrl);
  if (!animeId)
    return NextResponse.json(
      { error: "تعذر استخراج Anime ID من الرابط." },
      { status: 502 }
    );

  // 2. جلب الحلقات من API
  const episodes = await getEpisodesFromApi(animeId);
  if (episodes.error)
    return NextResponse.json(
      { error: episodes.error },
      { status: 502 }
    );

  // 3. إرجاع النتيجة النهائية
  return NextResponse.json({
    anime_url: animeUrl,
    extracted_anime_id: animeId,
    episode_count: episodes.length,
    episodes,
  });
}
