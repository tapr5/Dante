import cloudscraper from "cloudscraper";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "يرجى إرسال باراميتر ?url=" });

    // التأكد من صحة الرابط
    let safeUrl;
    try {
      safeUrl = new URL(url).href;
    } catch {
      return res.status(400).json({ error: "الرابط غير صالح" });
    }

    // جلب HTML
    const html = await cloudscraper.get(safeUrl);

    // إرسال HTML كملف قابل للتحميل مباشرة
    res.setHeader("Content-Disposition", `attachment; filename="page.html"`);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);

  } catch (err) {
    console.error("❌ خطأ في fetchHtml:", err.message);
    res.status(500).json({ error: "فشل في جلب الصفحة", details: err.message });
  }
}
