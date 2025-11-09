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
    const apiUrl = `https://api.gofile.io/contents/${fileId}?wt=4fd6sg89d7s6&contentFilter=&page=1&pageSize=1000&sortField=name&sortDirection=1`;

    // نفس الـ headers التي سنستعملها للستريم أيضا
    const headers = {
      Accept: "*/*",
      Authorization: "Bearer Lg4kqBlLGL7tMqq7XT4qP4wXGctI0hOT",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    };

    // جلب بيانات الملفات
    const { data } = await axios.get(apiUrl, { headers });

    if (data.status !== "ok" || !data.data?.children)
      return res.status(404).json({ error: "لم يتم العثور على أي ملفات." });

    // نأخذ أول ملف mp4
    const file = Object.values(data.data.children).find((f) =>
      f.name.endsWith(".mp4")
    );
    if (!file)
      return res.status(404).json({ error: "لا يوجد فيديو MP4 للعرض." });

    const videoUrl = file.link;

    // ⚡ ستريم الفيديو بنفس Authorization وUser-Agent
    const agent = new https.Agent({ rejectUnauthorized: false });

    const streamReq = https.get(
      videoUrl,
      {
        agent,
        headers: {
          ...headers,
          Range: req.headers.range || "", // لدعم seek في الفيديو
        },
      },
      (videoRes) => {
        if (![200, 206].includes(videoRes.statusCode)) {
          res
            .status(videoRes.statusCode || 500)
            .send(`HTTP Error: ${videoRes.statusCode}`);
          return;
        }

        // تمرير رؤوس الفيديو كما هي
        res.writeHead(videoRes.statusCode, {
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
          "Content-Length": videoRes.headers["content-length"],
          "Content-Range": videoRes.headers["content-range"],
          "Content-Disposition": `inline; filename="${filename || file.name}"`,
        });

        // تمرير الستريم مباشرة
        videoRes.pipe(res);
      }
    );

    streamReq.on("error", (err) => {
      console.error("❌ خطأ أثناء الستريم:", err.message);
      res.status(500).json({ error: "فشل في تشغيل الستريم", details: err.message });
    });
  } catch (error) {
    console.error("❌ خطأ عام:", error.message);
    res.status(500).json({
      error: "حدث خطأ أثناء معالجة الطلب",
      details: error.message,
    });
  }
}
