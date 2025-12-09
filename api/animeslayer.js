export default async function handler(req, res) {
  try {
    const url =
      "https://anslayer.com/anime/public/animes/get-published-animes?json=%7B%22_offset%22%3A0%2C%22_limit%22%3A30%2C%22_order_by%22%3A%22latest_first%22%2C%22list_type%22%3A%22filter%22%2C%22anime_name%22%3A%22one%20piece%22%2C%22just_info%22%3A%22Yes%22%7D";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "okhttp/3.12.13",
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "client-id": "android-app2",
        "client-secret": "7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd",
        "accept": "application/*+json"
      }
    });

    const data = await response.json();

    res.status(200).json({
      success: true,
      source: "anslayer",
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
