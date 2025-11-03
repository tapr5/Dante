import axios from "axios";
import * as cheerio from "cheerio";

function toArray(hexStr) {
  const bytes = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.slice(i, i + 2), 16));
  }
  return bytes;
}

function processXOR(rawHex, secret) {
  const data = toArray(rawHex);
  const keylen = secret.length;
  let out = "";

  for (let i = 0; i < data.length; i++) {
    out += String.fromCharCode(data[i] ^ secret.charCodeAt(i % keylen));
  }
  return out;
}

function extractVars(scriptContent) {
  const varsData = {};
  const varNames = ["_m", "_t", "_s", ...Array.from({ length: 12 }, (_, i) => `_p${i}`)];

  for (const name of varNames) {
    const match = scriptContent.match(new RegExp(`var\\s+${name}\\s*=\\s*(\\[.*?\\]|\\{.*?\\});`, "s"));
    if (match) {
      try {
        const cleaned = match[1].replace(/\n|\t/g, "").trim();
        varsData[name] = JSON.parse(cleaned.replace(/'/g, '"'));
      } catch (e) {
        console.warn(`❗ فشل تحليل المتغير ${name}`, e);
      }
    }
  }

  if (!varsData["_m"] || !varsData["_t"] || !varsData["_s"]) {
    throw new Error("المتغيرات الأساسية (_m, _t, _s) غير موجودة.");
  }

  return varsData;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl)
    return new Response(JSON.stringify({ error: "يرجى تمرير الرابط في ?url=" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);
    const scriptTag = $("#lkgx-js-extra").html();
    if (!scriptTag)
      return new Response(JSON.stringify({ error: "لم يتم العثور على سكريبت التشفير." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });

    const varsData = extractVars(scriptTag);
    const secretB64 = varsData["_m"].r;
    const secret = Buffer.from(secretB64, "base64").toString("utf8");

    const totalLinks = parseInt(varsData["_t"].l);
    const serverNames = $(".episode-download-container .quality-list .notice")
      .map((_, el) => $(el).text().trim())
      .get();

    const finalLinks = [];

    for (let i = 0; i < totalLinks; i++) {
      const pVar = varsData[`_p${i}`];
      if (!pVar) continue;

      const seqRaw = varsData["_s"][i];
      const seqJson = processXOR(seqRaw, secret);
      const seq = JSON.parse(seqJson);

      const decryptedChunks = pVar.map((chunk) => processXOR(chunk, secret));

      const arranged = [];
      for (let j = 0; j < seq.length; j++) arranged[seq[j]] = decryptedChunks[j];

      const link = arranged.join("");
      const name = serverNames[i] || `رابط ${i + 1}`;
      finalLinks.push({ name, link });
    }

    return new Response(JSON.stringify({ count: finalLinks.length, links: finalLinks }, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("خطأ:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
                                           }
