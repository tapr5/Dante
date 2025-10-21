// pages/api/mp4upload.js
import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: true,
      message: "يرجى تمرير ?url=<رابط_mp4upload>"
    });
  }

  try {
    // 1️⃣ تحميل الصفحة الأولى
    const first = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(first.data);
    const op = $('input[name="op"]').val();
    const id = $('input[name="id"]').val();
    const fname = $('input[name="fname"]').val();

    if (!id || !fname) {
      return res.status(404).json({
        error: true,
        message: "لم يتم العثور على بيانات التحميل داخل الصفحة."
      });
    }

    // 2️⃣ محاكاة الضغط على زر Free Download
    const second = await axios.post(
      url,
      new URLSearchParams({
        op,
        id,
        fname,
        method_free: "Free Download",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    // 3️⃣ إعادة HTML داخل JSON
    return res.status(200).json({
      status: "success",
      file: fname,
      html: second.data, // الصفحة الكاملة كما هي
    });

  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء معالجة الرابط.",
      details: err.message,
    });
  }
}
