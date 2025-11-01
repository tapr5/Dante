import axios from "axios";

export async function GET(req) {
  try {
    // استخراج الرابط من ?url=
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("url");

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: "يرجى إدخال الرابط عبر ?url=" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // إعداد الرؤوس (مثل المثال الذي أعطيتني)
    const headers = {
      Host: "a1.mp4upload.com:183",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
      "Accept-Encoding": "identity",
      Range: "bytes=36273190-",
      "If-Match": '"686b1b7b-67c7474"',
      "If-Unmodified-Since": "Mon, 07 Jul 2025 00:57:31 GMT",
      "Sec-GPC": "1",
      "Accept-Language": "en-US,en;q=0.5",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Dest": "empty",
      Referer: "https://www.mp4upload.com/",
      Cookie:
        "lang=english; affiliate=V6b%2BpuASAQkprG3OHA1JRbkh%2FuHaB6Pj%2FOG9eJiP91UXkrpI6HLmrqzJS4EWa9SCKSiF0KHQORs%2B%2BB782cZbZLHn95ny0%2FL5SMgyCvSatyrE0B5qShp7bPlNXH%2F9CktLa2pBxSUwk8J66Crx7N9sqhA%3D",
    };

    // إرسال الطلب إلى الموقع الأصلي
    const response = await axios.get(fileUrl, {
      headers,
      responseType: "stream",
      validateStatus: () => true,
    });

    // إنشاء Headers للرد
    const resHeaders = new Headers();
    for (const [key, value] of Object.entries(response.headers)) {
      if (
        [
          "content-type",
          "content-length",
          "content-range",
          "accept-ranges",
          "etag",
          "last-modified",
        ].includes(key.toLowerCase())
      ) {
        resHeaders.set(key, value);
      }
    }
    resHeaders.set("Access-Control-Allow-Origin", "*");

    // إعادة إرسال الـ stream كما هو
    return new Response(response.data, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("Proxy error:", err.message);
    return new Response(
      JSON.stringify({
        error: "فشل الاتصال بالموقع الهدف",
        message: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
