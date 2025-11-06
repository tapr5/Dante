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

    // رابط proxy مع الرابط النهائي كما طلبت
    const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://witanime.you/wp-json/wp/v2/anime?slug=${slug}`
    )}`;

    // جلب JSON من proxy
    const { data } = await axios.get(apiUrl);

    // إعادة JSON كما هو
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
