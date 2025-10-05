import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // نرسل كل البيانات كما هي إلى Akinator (cancel_answer)
    const response = await axios.post(
      "https://ar.akinator.com/cancel_answer",
      new URLSearchParams(req.body), // الـ body لازم يحتوي: step, session, signature, progression ...
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    let result = response.data;

    // إذا رجع akitude نضيف رابط الصورة الكامل
    if (result.akitude) {
      result.akitude_url = `https://ar.akinator.com/assets/img/akitudes_520x650/${result.akitude}`;
    }

    // نرجع الرد للعميل
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
