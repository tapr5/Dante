// /pages/api/back.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // إرسال كل البيانات كما هي إلى Akinator
    const response = await axios.post(
      "https://ar.akinator.com/back",
      new URLSearchParams(req.body), // body يجب أن يحتوي session, signature, step, progression, cm
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    // نرجع الرد الخام بالكامل بدون تعديل
    return res.status(200).send(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
