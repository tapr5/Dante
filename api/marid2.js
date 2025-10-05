import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { step, progression, session, signature, cm } = req.body;

    // إنشاء البيانات بشكل صحيح لـ application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('step', step || '0');
    params.append('progression', progression || '0.0');
    params.append('session', session || '');
    params.append('signature', signature || '');
    params.append('cm', cm || 'false');

    const response = await axios.post(
      "https://ar.akinator.com/back",
      params.toString(), // استخدام toString() بدلاً من الكائن مباشرة
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
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
    console.error("Error in back function:", err.response?.data || err.message);
    return res.status(500).json({ 
      error: err.response?.data?.message || err.message 
    });
  }
}
