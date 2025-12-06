export default async function handler(req, res) {
  try {
    const url = "https://lekmanga.net/wp-admin/admin-ajax.php?postID=165787&manga-paged=1&chapter=14&style=list";

    const bodyData = new URLSearchParams();
    bodyData.append("action", "chapter_navigate_page");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "okhttp/5.0.0-alpha.12",
        "Accept-Encoding": "br,gzip",
        "Content-Type": "application/x-www-form-urlencoded",
        "cache-control": "max-age=600",
        "Cookie": "wp_wpfileupload_30267ab5f54bf7a6f3ba943bc5eda231=ge7RGaMMO2QKn7aDCOrKfpAD5swFLBwO"
      },
      body: bodyData,
    });

    const text = await response.text(); // الموقع يرجّع HTML

    res.status(200).json({
      success: true,
      html: text
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
