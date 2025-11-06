import fetch from "node-fetch";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

// دالة للحصول على Anime ID مباشرة عبر API
async function getAnimeIdDirect(slug) {
  try {
    const apiUrl = `https://witanime.you/wp-json/wp/v2/anime?slug=${slug}`;
    const res = await fetch(apiUrl, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب البيانات من API");

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    return data[0].id; // ID الأنمي
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    return null;
  }
}

// --- استخدام الدالة ---
const slug = "one-piece"; // ضع هنا slug الأنمي من الرابط
getAnimeIdDirect(slug).then((id) => {
  if (id) console.log("معرف الأنمي:", id);
  else console.log("تعذر استخراج معرف الأنمي");
});
