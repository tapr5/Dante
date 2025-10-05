import axios from "axios";
import cheerio from "cheerio";

async function initAkinator() {
  try {
    // 1️⃣ نجيب HTML من صفحة البداية
    const url = "https://ar.akinator.com/game";
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0", // مهم باش ما يرفضك السيرفر
      },
    });

    // 2️⃣ نقصّ session و signature من HTML
    const $ = cheerio.load(res.data);

    // نخزنوهم من الـ script
    const html = $.html();

    const sessionMatch = html.match(/session[=:]"?([0-9]+)"?/);
    const signatureMatch = html.match(/signature[=:]"?([A-Za-z0-9+/=]+)"?/);

    const session = sessionMatch ? sessionMatch[1] : null;
    const signature = signatureMatch ? signatureMatch[1] : null;

    if (!session || !signature) {
      throw new Error("ما قدرش نلقى session أو signature");
    }

    console.log("✅ Session:", session);
    console.log("✅ Signature:", signature);

    // 3️⃣ نرسل طلب new_session باش يرد لنا بالسيرفر (srvXX)
    const newSessionUrl = `https://srv12.akinator.com/ws/new_session?partner=1&player=website-desktop&session=${session}&signature=${encodeURIComponent(signature)}`;
    const apiRes = await axios.get(newSessionUrl);

    const srv = apiRes.data.parameters?.urlWs || "غير معروف";
    console.log("✅ السيرفر:", srv);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
  }
}

initAkinator();
