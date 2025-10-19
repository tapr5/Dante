import fetch from "node-fetch";
import { v4 as uuidv4} from "uuid";
import path from "path";
import fs from "fs/promises";

export default async function handler(req, res) {
  const { url} = req.query;

  if (req.method!== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET with?url="});
}

  if (!url ||!url.startsWith("http")) {
    return res.status(400).json({ error: "يرجى تقديم رابط صالح بعد?url="});
}

  try {
    const formData = new FormData();
    formData.append("size", "auto");
    formData.append("image_url", url);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": "pZoqmwkwmMSJAVdJFDnMgWB8"
},
      body: formData
});

    if (!response.ok) {
      throw new Error("فشل الاتصال بـ remove.bg");
}

    const buffer = await response.arrayBuffer();
    const fileName = `${uuidv4()}.png`;
    const filePath = path.join("/tmp", fileName);
    await fs.writeFile(filePath, Buffer.from(buffer));

    const imageBuffer = await fs.readFile(filePath);
    await fs.unlink(filePath);

    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
} catch (err) {
    console.error("خطأ في إزالة الخلفية", err);
    return res.status(500).json({ error: "فشل في إزالة الخلفية من الصورة"});
}
}
