import cloudscraper from "cloudscraper";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "يرجى إرسال باراميتر ?url=" });
    }

    // التأكد من صحة الرابط
    let safeUrl;
    try {
      safeUrl = new URL(url).href;
    } catch {
      return res.status(400).json({ error: "الرابط غير صالح" });
    }

    // جلب HTML
    const html = await cloudscraper.get(safeUrl);

    // إنشاء اسم ملف مؤقت
    const filename = `page-${uuidv4()}.html`;
    const filePath = path.join(process.cwd(), "public", "downloads", filename);

    // التأكد من وجود مجلد downloads
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // حفظ HTML في ملف
    fs.writeFileSync(filePath, html, "utf-8");

    // إرجاع رابط التحميل
    const downloadUrl = `/downloads/${filename}`;
    res.status(200).json({ downloadUrl });

  } catch (err) {
    console.error("❌ خطأ في fetchHtml:", err.message);
    res.status(500).json({ error: "فشل في جلب الصفحة", details: err.message });
  }
}
