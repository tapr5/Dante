// pages/api/mp4upload.js
import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: true,
      message: "❌ يرجى تمرير ?url=<رابط_mp4upload>",
    });
  }

  try {
    // 1️⃣ تحميل الصفحة الأولى
    const first = await axios.get(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": url
      },
    });

    const $ = cheerio.load(first.data);

    // استخراج القيم الأساسية من الفورم
    const op = $('input[name="op"]').val() || "download2";
    const id = $('input[name="id"]').val();
    const rand = $('input[name="rand"]').val() || "";
    const referer = url;
    const method_free = "Free Download";
    const method_premium = "";
    const fname = $('input[name="fname"]').val() || "unknown.mp4";

    if (!id) {
      return res.status(404).json({
        error: true,
        message: "⚠️ لم يتم العثور على معرف الملف (id) داخل الصفحة.",
      });
    }

    // 2️⃣ محاكاة الضغط على "Free Download"
    const second = await axios.post(
      url,
      new URLSearchParams({
        op,
        id,
        rand,
        referer,
        method_free,
        method_premium,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": url,
        },
      }
    );

    // 3️⃣ تحليل الصفحة الثانية لاستخراج رابط التحميل المباشر
    const $$ = cheerio.load(second.data);
    const directLink = $$('a.btn.btn-primary.btn-block').attr("href");

    // 4️⃣ الرد النهائي
    return res.status(200).json({
      status: "success",
      file: fname,
      id,
      directLink: directLink || null,
      html: second.data, // HTML الكامل كمرجع
    });

  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء معالجة الرابط.",
      details: err.message,
    });
  }
}
