// /pages/api/akinator.js
import axios from "axios";
import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    // 1️⃣ جلب HTML
    const url = "https://ar.akinator.com/game";
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(response.data);
    const html = $.html();

    // 2️⃣ استخراج session و signature
    const sessionMatch = html.match(/session[=:]"?([0-9]+)"?/);
    const signatureMatch = html.match(/signature[=:]"?([A-Za-z0-9+/=]+)"?/);

    const session = sessionMatch ? sessionMatch[1] : null;
    const signature = signatureMatch ? signatureMatch[1] : null;

    if (!session || !signature) {
      return res.status(500).json({ error: "ما قدرش نلقى session أو signature" });
    }

    // 3️⃣ طلب جديد للسيرفر (srv12 مثلاً)
    const newSessionUrl = `https://srv12.akinator.com/ws/new_session?partner=1&player=website-desktop&session=${session}&signature=${encodeURIComponent(signature)}`;
    const apiRes = await axios.get(newSessionUrl);

    const srv = apiRes.data.parameters?.urlWs || "غير معروف";

    // 4️⃣ إرسال البيانات كـ JSON للـ frontend
    res.status(200).json({
      session,
      signature,
      srv,
      message: "تم استخراج البيانات بنجاح ✅",
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
