import fetch from "node-fetch";

export default async function handler(req, res) {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing query parameter 'url'");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);

  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
}
