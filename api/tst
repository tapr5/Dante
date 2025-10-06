// /pages/api/mangaDetails.js
import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // السماح فقط بـ GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "يرجى تمرير رابط المانجا (url) في query" });
    }

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(response.data);

    const pickMeta = (name) =>
      $(`meta[property="${name}"]`).attr("content") ||
      $(`meta[name="${name.replace("og:", "")}"]`).attr("content") ||
      "";

    const title = pickMeta("og:title") || $("title").text().trim();
    const description =
      pickMeta("og:description") || $('meta[name="description"]').attr("content") || "";
    const cover = pickMeta("og:image") || $("img").first().attr("src") || "";

    const genres = [];
    $(".subtitle a, .genres a, .genre a").each((i, el) => {
      const t = $(el).text().trim();
      if (t) genres.push(t);
    });

    const extra = {};
    $(".manga-info .info, .info, .manga-details li, .detail-row").each((i, el) => {
      const textLine = $(el).text().trim();
      if (!textLine) return;
      const parts = textLine
        .split(/:|—|\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        const key = parts[0].replace(/\s+/g, " ").trim();
        const value = parts.slice(1).join(":").trim();
        extra[key] = value;
      }
    });

    const imagesSet = new Set();
    $("img").each((i, img) => {
      const src = $(img).attr("src") || $(img).attr("data-src") || "";
      if (src && !src.startsWith("data:")) {
        imagesSet.add(src.startsWith("http") ? src : new URL(src, url).href);
      }
    });
    const images = Array.from(imagesSet).slice(0, 20);

    let chapter1 = "";
    $("a").each((i, a) => {
      if (chapter1) return;
      const href = $(a).attr("href") || "";
      const textA = $(a).text().replace(/\s+/g, " ").trim();
      if (/\/\d+$/.test(href) && /\/1$/.test(href)) {
        chapter1 = href.startsWith("http") ? href : new URL(href, url).href;
        return;
      }
      if (/الفصل\s*الاول|الفصل\s*1|chapter\s*1/i.test(textA) && href) {
        chapter1 = href.startsWith("http") ? href : new URL(href, url).href;
        return;
      }
    });

    if (!chapter1) {
      const possible = $('a[href*="/series/"]')
        .filter((i, el) => {
          const h = $(el).attr("href") || "";
          return /\/1$/.test(h) || /\/series\/[^\/]+\/1/.test(h);
        })
        .first();
      if (possible && possible.attr && possible.attr("href")) {
        const h = possible.attr("href");
        chapter1 = h.startsWith("http") ? h : new URL(h, url).href;
      }
    }

    res.status(200).json({
      title,
      description,
      cover,
      genres: [...new Set(genres)],
      extra,
      images,
      chapter1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "❌ حدث خطأ أثناء استخراج معلومات المانجا",
      details: err.message || err,
    });
  }
}
