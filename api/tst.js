// pages/api/extract.js
import axios from "axios";

/**
 * Extract video slug/UUID from a page that includes window.__NUXT__ data.
 * Strategy:
 * 1) Try to find `video: { ... slug: "..." ... }` using a regex.
 * 2) If not found, fallback to the first UUID-looking string on the page.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: true, message: "Missing url query parameter" });
  }

  try {
    // fetch page (set a user-agent to reduce chance of blocks)
    const resp = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 15000,
    });

    const html = resp.data;

    // 1) Try to find video.slug inside a window.__NUXT__ script block using a targeted regex.
    // This regex looks for "video" object then slug: "uuid"
    const videoSlugRegex =
      /video\s*:\s*\{[^}]*?slug\s*:\s*["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["'][^}]*\}/is;

    let match = html.match(videoSlugRegex);
    if (match && match[1]) {
      return res.status(200).json({ slug: match[1], method: "videoSlugRegex" });
    }

    // 2) Sometimes the slug appears as `"slug":"..."` somewhere in the script object
    const slugKeyRegex = /["']slug["']\s*:\s*["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/i;
    match = html.match(slugKeyRegex);
    if (match && match[1]) {
      return res.status(200).json({ slug: match[1], method: "slugKeyRegex" });
    }

    // 3) Fallback: return the first UUID-like token found anywhere in page
    match = html.match(UUID_RE);
    if (match && match[0]) {
      return res
        .status(200)
        .json({ slug: match[0], method: "firstUuidFallback", note: "fallback - first UUID on page" });
    }

    // If nothing found
    return res.status(404).json({ error: true, message: "slug/uuid not found on page" });
  } catch (err) {
    console.error("extract error:", err?.message ?? err);
    return res.status(500).json({ error: true, message: "Failed to fetch or parse page", details: err?.message });
  }
}
