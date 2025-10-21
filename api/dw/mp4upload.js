// pages/api/mp4upload.js
import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url || !url.includes("mp4upload.com"))
      return res.status(400).json({ error: "يرجى تمرير رابط mp4upload صحيح" });

    // استخراج ID من الرابط
    const match = url.match(/\/([a-zA-Z0-9]+)$/);
    const fileId = match ? match[1] : null;
    if (!fileId)
      return res.status(400).json({ error: "تعذر استخراج معرف الملف من الرابط" });

    const postUrl = `https://www.mp4upload.com/${fileId}`;

    // إعداد البيانات التي تُرسل في POST
    const form = new URLSearchParams({
      op: "download2",
      id: fileId,
      rand: "",
      referer: "https://animelek.live/",
      method_free: "Free Download",
      method_premium: "",
    });

    // تنفيذ الطلب
    const { data } = await axios.post(postUrl, form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: postUrl,
        Origin: "https://www.mp4upload.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    // استخراج الرابط من صفحة الرد
    const $ = cheerio.load(data);
    const directLink = $("a[href$='.mp4']").attr("href");

    if (!directLink)
      return res.status(404).json({ error: "تعذر العثور على رابط التحميل" });

    return res.status(200).json({
      status: "success",
      fileId,
      directLink,
    });
  } catch (err) {
    console.error("خطأ:", err.message);
    return res.status(500).json({
      error: "حدث خطأ أثناء معالجة الرابط",
      details: err.message,
    });
  }
}
