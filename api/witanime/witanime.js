import axios from "axios";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "يرجى إرسال رابط الأنمي" });
    }

    // استخراج الـ slug من الرابط
    const match = url.match(/\/anime\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: "تعذر استخراج Anime slug من الرابط." });
    }
    const slug = match[1];

    // رابط مباشر بدون proxy
    const apiUrl = `http://217.154.201.164:7763/api/witanime?url=${slug}`;

    // جلب JSON مباشرة
    const { data } = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
      }
    });

    // إعادة JSON كما هو
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
