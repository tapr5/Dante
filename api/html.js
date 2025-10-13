import cloudscraper from "cloudscraper";

/**
 * API: /api/fetchHtml?url=<رابط>
 * يرجع HTML الخام للصفحة المطلوبة
 */
export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "يرجى إرسال باراميتر ?url=" });
    }

    // ✅ ترميز الرابط لتفادي الخطأ ERR_UNESCAPED_CHARACTERS
    const safeUrl = encodeURI(url);

    // جلب الصفحة عبر cloudscraper
    const html = await cloudscraper.get(safeUrl);

    // إرجاع html خام
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);

  } catch (err) {
    console.error("❌ خطأ في fetchHtml:", err.message);
    res.status(500).json({ error: "فشل في جلب الصفحة", details: err.message });
  }
}
