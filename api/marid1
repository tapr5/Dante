import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // نرسل كل البيانات كما هي إلى Akinator
    const response = await axios.post(
      "https://ar.akinator.com/answer", // أو game إذا تريد start
      new URLSearchParams(req.body),    // body يجب أن يحتوي كل ما يرسله العميل
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    // نرجع الرد الخام بالكامل بدون أي فلترة
    return res.status(200).send(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
