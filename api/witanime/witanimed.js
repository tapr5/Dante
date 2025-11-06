import fetch from "node-fetch";

const PROXY = "https://api.allorigins.win/get?url="; // البروكسي لجلب HTML
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
};

async function getAnimeId(animeUrl) {
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(animeUrl)}`, { headers: HEADERS });
    if (!res.ok) throw new Error("فشل في جلب الصفحة");

    const data = await res.json();
    const html = data.contents || "";

    // محاولة استخراج الـ ID من رابط API مباشر أو من JSON في الصفحة
    let match = html.match(/href=["']https:\/\/witanime\.you\/wp-json\/wp\/v2\/anime\/(\d+)["']/);
    if (!match) {
      // محاولة ثانية: البحث عن JSON في الصفحة
      match = html.match(/"anime":\s*{[^}]*"id":\s*(\d+)/);
    }

    if (match) return parseInt(match[1]);
    return null;
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    return null;
  }
}

// --- استخدام الدالة ---
const url = "ضع_رابط_الأنمي_هنا";
getAnimeId(url).then((id) => {
  if (id) console.log("معرف الأنمي:", id);
  else console.log("تعذر استخراج معرف الأنمي");
});
