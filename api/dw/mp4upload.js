import axios from "axios";
import https from "https";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "الطريقة غير مسموحة" });
  }

  try {
    const videoUrl = req.query.url;
    const filename = req.query.filename;

    if (!videoUrl) {
      return res
        .status(400)
        .json({ success: false, error: "الرجاء إدخال رابط mp4upload." });
    }

    // استخراج ID من الرابط
    const match = videoUrl.match(/\/([a-zA-Z0-9]+)$/);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, error: "لم أستطع استخراج ID من الرابط." });
    }

    const id = match[1];
    const embedUrl = `https://www.mp4upload.com/embed-${id}.html`;

    // جلب صفحة الـ embed
    const { data: html } = await axios.get(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Referer: "https://www.mp4upload.com/",
      },
      timeout: 20000,
    });

    // استخراج رابط الفيديو mp4 المباشر
    const regex = /src:\s*"([^"]+\.mp4)"/;
    const matchVideo = html.match(regex);

    if (!matchVideo || !matchVideo[1]) {
      return res
        .status(404)
        .json({ success: false, error: "تعذر استخراج رابط الفيديو." });
    }

    const videoDirectUrl = matchVideo[1];

    // ⚡ تدفق الفيديو مباشرة للمشاهدة
    const agent = new https.Agent({ rejectUnauthorized: false });

    https.get(
      videoDirectUrl,
      {
        agent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Encoding": "identity",
          Referer: "https://www.mp4upload.com/",
        },
      },
      (videoResponse) => {
        if (videoResponse.statusCode !== 200 && videoResponse.statusCode !== 206) {
          return res.status(500).send(`HTTP Error: ${videoResponse.statusCode}`);
        }

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${filename || "video.mp4"}"`
        );

        videoResponse.pipe(res);
      }
    ).on("error", (err) => res.status(500).send(err.message));

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "حدث خطأ أثناء معالجة الفيديو.",
    });
  }
}
