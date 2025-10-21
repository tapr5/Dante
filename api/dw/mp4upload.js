// pages/api/mp4upload.js
import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send("<h2>❌ يرجى تمرير ?url=رابط_mp4upload</h2>");
  }

  try {
    // الخطوة 1: تحميل الصفحة الأولى
    const first = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const $ = cheerio.load(first.data);
    const op = $('input[name="op"]').val();
    const id = $('input[name="id"]').val();
    const fname = $('input[name="fname"]').val();

    if (!id || !fname) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(404).send("<h3>⚠️ لم يتم العثور على بيانات التحميل داخل الصفحة.</h3>");
    }

    // الخطوة 2: محاكاة ضغط زر “Free Download”
    const second = await axios.post(url, new URLSearchParams({
      op,
      id,
      fname,
      method_free: "Free Download"
    }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
    });

    // إرجاع HTML كما هو (الصفحة الثانية من mp4upload)
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(second.data);

  } catch (err) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(`
      <h2>🚫 خطأ أثناء معالجة الرابط</h2>
      <pre>${err.message}</pre>
    `);
  }
}
