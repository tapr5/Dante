import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return new Response(JSON.stringify({ error: "Missing ?url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = new URLSearchParams({ url: target }).toString();

    const headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Content-Type": "application/x-www-form-urlencoded",
      "cache-control": "max-age=0",
      "sec-ch-ua": `"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"`,
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": `"Android"`,
      "origin": "https://trevorfox.com",
      "upgrade-insecure-requests": "1",
      "sec-gpc": "1",
      "accept-language": "en-US,en;q=0.7",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "sec-fetch-dest": "document",
      "referer": "https://trevorfox.com/tools/source-viewer/",
      "priority": "u=0, i",
    };

    const response = await axios.post(
      "https://trevorfox.com/view-source/",
      body,
      { headers, decompress: true, timeout: 30000 }
    );

    return new Response(
      JSON.stringify({ html: response.data }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message,
        status: error.response?.status || 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
