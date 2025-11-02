import axios from "axios";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
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
    const headers = {
      Accept: "*/*",
      Authorization: "Bearer Lg4kqBlLGL7tMqq7XT4qP4wXGctI0hOT",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    };

    const { data } = await axios.get(apiUrl, { headers });

    if (data.status !== "ok" || !data.data?.children)
      return res.status(404).json({ error: "لم يتم العثور على أي ملفات." });

    const files = Object.values(data.data.children).map((file) => ({
      name: file.name,
      thumbnail: file.thumbnail,
      link: file.link,
      size: formatBytes(file.size),
    }));

    res.status(200).json({
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

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
