import axios from "axios";

/**
 * API: /api/gofile?url=https://gofile.io/d/5GKPff
 * يرجع بيانات مختصرة (اسم، صورة، حجم، رابط مباشر)
 */
export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "يرجى تمرير رابط GoFile في ?url=" });
    }

    // استخراج ID من الرابط (مثل 5GKPff)
    const match = url.match(/\/d\/([a-zA-Z0-9]+)/);
    if (!match) {
      return res.status(400).json({ error: "الرابط غير صالح، لم يتم العثور على ID." });
    }

    const fileId = match[1];
    const apiUrl = `https://api.gofile.io/contents/${fileId}?wt=4fd6sg89d7s6&contentFilter=&page=1&pageSize=1000&sortField=name&sortDirection=1`;

    const headers = {
      Accept: "*/*",
      Authorization: "Bearer KP7yA28ChZttCtRCfHwq2J5m8ud2jXfh",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    };

    // جلب بيانات GoFile
    const { data } = await axios.get(apiUrl, { headers });

    // التحقق من أن الاستجابة ناجحة
    if (data.status !== "ok" || !data.data?.children) {
      return res.status(404).json({ error: "لم يتم العثور على أي ملفات." });
    }

    // استخراج الملفات
    const files = Object.values(data.data.children).map((file) => ({
      name: file.name,
      thumbnail: file.thumbnail,
      link: file.link,
      size: formatBytes(file.size),
    }));

    res.status(200).json({
      folderId: fileId,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error("❌ خطأ في جلب بيانات GoFile:", error.message);
    res.status(500).json({
      error: "فشل في جلب البيانات من GoFile",
      details: error.message,
    });
  }
}

// دالة لتحويل الحجم إلى صيغة مقروءة (MB, GB, ...)
function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
