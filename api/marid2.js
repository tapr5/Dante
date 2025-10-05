import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // نرسل البيانات إلى API العودة
    const response = await axios.post(
      "https://ar.akinator.com/back", // رابط العودة
      new URLSearchParams(req.body),  // body يجب أن يحتوي على step, progression, session, signature, cm
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    let result = response.data;

    // إذا كان هناك akitude أضف الرابط الكامل تلقائيًا
    if (result.akitude) {
      result.akitude_url = `https://ar.akinator.com/assets/img/akitudes_520x650/${result.akitude}`;
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
