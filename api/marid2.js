// /pages/api/marid2.js
import axios from "axios";

export default async function handler(req, res) {
  // السماح بـ POST فقط
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // إضافة CORS لتجربة HTML من أي مكان
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // نرسل كل البيانات كما هي إلى Akinator Back API
    const response = await axios.post(
      "https://ar.akinator.com/back",
      new URLSearchParams(req.body), // body يجب أن يحتوي على session, signature, step, progression, cm
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    // نرجع الرد الكامل بدون أي تعديل
    return res.status(200).send(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
