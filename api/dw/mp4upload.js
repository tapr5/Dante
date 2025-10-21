// pages/api/mp4upload.js
import axios from "axios";
import * as cheerio from "cheerio";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url)
    return res.status(400).json({
      error: true,
      message: "❌ يرجى تمرير ?url=<رابط_mp4upload>",
    });

  try {
    // 1️⃣ تحميل الصفحة الأولى
    const first = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://animelek.live/",
      },
    });

    const $ = cheerio.load(first.data);
    const op = $('input[name="op"]').val() || "download2";
    const id = $('input[name="id"]').val();
    const rand = $('input[name="rand"]').val() || "";
    const fname = $('input[name="fname"]').val() || "unknown.mp4";

    if (!id)
      return res.status(404).json({
        error: true,
        message: "⚠️ لم يتم العثور على معرف الملف (id) داخل الصفحة.",
      });

    await sleep(5000); // انتظار تقليدي

    // 2️⃣ إرسال الطلب الثاني (Free Download)
    const second = await axios.post(
      url,
      new URLSearchParams({
        op,
        id,
        rand,
        referer: "https://animelek.live/",
        method_free: "Free Download",
        method_premium: "",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://animelek.live/",
        },
        responseType: "text", // ← مهم جدًا
        decompress: true, // ← لفك ضغط gzip
        maxRedirects: 5, // ← لتتبّع إعادة التوجيه التلقائية
        validateStatus: () => true, // ← حتى نقدر نقرأ الرد أياً كان الكود
      }
    );

    // 3️⃣ تحليل الردّ (مهما كان نوعه)
    let html = second.data;
    let directLink = null;

    try {
      const $$ = cheerio.load(html);
      directLink = $$('a.btn.btn-primary.btn-block').attr("href") || null;
    } catch {
      // إذا لم يكن HTML، نخزّنه كما هو
      html = html.toString();
    }

    // 4️⃣ الرد النهائي
    return res.status(200).json({
      status: "success",
      file: fname,
      id,
      directLink,
      raw: html.substring(0, 4000), // فقط أول 4000 حرف للمعاينة
      contentType: second.headers["content-type"],
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء معالجة الرابط.",
      details: err.message,
    });
  }
}
