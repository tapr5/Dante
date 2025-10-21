import axios from "axios";

export default async function handler(req, res) {
  try {
    const { url } = req.query; // مثال: https://gofile.io/d/7av96X
    if (!url) {
      return res.status(400).json({ error: "يرجى تمرير رابط GoFile في ?url=" });
    }

    // استخراج ID من الرابط
    const match = url.match(/\/d\/([a-zA-Z0-9]+)/);
    if (!match) {
      return res.status(400).json({ error: "الرابط غير صالح، لم يتم العثور على ID." });
    }

    const fileId = match[1];
    const apiUrl = `https://api.gofile.io/contents/${fileId}?wt=4fd6sg89d7s6&contentFilter=&page=1&pageSize=1000&sortField=name&sortDirection=1`;

    const headers = {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "fr-FR,fxq=0.7",
      Authorization: "Bearer KP7yA28ChZttCtRCfHwq2J5m8ud2jXfh",
      Connection: "keep-alive",
      Host: "api.gofile.io",
      Origin: "https://gofile.io",
      Referer: "https://gofile.io/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "Sec-GPC": "1",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    };

    const { data } = await axios.get(apiUrl, { headers });

    res.status(200).json({
      id: fileId,
      apiUrl,
      data,
    });
  } catch (error) {
    console.error("❌ خطأ في جلب بيانات GoFile:", error.message);
    res.status(500).json({
      error: "فشل في جلب البيانات من GoFile",
      details: error.message,
    });
  }
}
