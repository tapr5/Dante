import axios from "axios";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "يرجى إرسال رابط الأنمي" });
    }

    // استخراج slug من الرابط
    const match = url.match(/\/anime\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: "تعذر استخراج Anime slug من الرابط." });
    }
    const slug = match[1];

    // رابط Witanime مباشرة
    const apiUrl = `https://witanime.you/wp-json/wp/v2/anime?slug=${slug}`;

    // جلب JSON مباشرة مع User-Agent
    const { data } = await axios.get(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
