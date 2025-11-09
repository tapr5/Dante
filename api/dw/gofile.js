import axios from "axios";
import https from "https";

export default async function handler(req, res) {
  try {
    const { url, filename } = req.query;
    if (!url)
      return res.status(400).json({ error: "يرجى تمرير رابط GoFile في ?url=" });

    // استخراج ID من الرابط
    const match = url.match(/\/d\/([a-zA-Z0-9]+)/);
    if (!match)
      return res
        .status(400)
        .json({ error: "الرابط غير صالح، لم يتم العثور على ID." });

    const fileId = match[1];
    const apiUrl = `https://api.gofile.io/contents/${fileId}`;
    const headers = {
      Accept: "*/*",
      Authorization: "Bearer Lg4kqBlLGL7tMqq7XT4qP4wXGctI0hOT",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    };

    // جلب بيانات الملفات من GoFile
    const { data } = await axios.get(apiUrl, { headers });
    if (data.status !== "ok" || !data.data?.children)
      return res.status(404).json({ error: "لم يتم العثور على أي ملفات." });

    // أخذ أول فيديو MP4 موجود
    const file = Object.values(data.data.children).find(f => f.name.endsWith(".mp4"));
    if (!file) return res.status(404).json({ error: "لا يوجد فيديو MP4 للعرض." });

    const videoUrl = file.link;

    // ⚡ ستريم مباشر للفيديو
    const agent = new https.Agent({ rejectUnauthorized: false });

    https.get(
      videoUrl,
      { agent, headers: { "User-Agent": headers["User-Agent"] } },
      (videoResponse) => {
        if (videoResponse.statusCode !== 200 && videoResponse.statusCode !== 206) {
          return res.status(500).send(`HTTP Error: ${videoResponse.statusCode}`);
        }

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${filename || file.name}"`
        );

        videoResponse.pipe(res);
      }
    ).on("error", (err) => res.status(500).send(err.message));

  } catch (error) {
    console.error("❌ خطأ في ستريم GoFile:", error.message);
    res.status(500).json({
      error: "فشل في ستريم الفيديو من GoFile",
      details: error.message,
    });
  }
}
