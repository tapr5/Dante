// /pages/api/marid2.js
import axios from "axios";

export default async function handler(req, res) {
  // السماح بـ POST فقط
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { session, signature, step, answer, progression, cm, sid, question_filter, step_last_proposition } = req.body;

    // إرسال الطلب إلى Akinator
    const response = await axios.post(
      "https://ar.akinator.com/cancel_answer", // رابط إرسال الإجابة
      {
        session,
        signature,
        step,
        answer,
        progression,
        cm,
        sid,
        question_filter,
        step_last_proposition
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0"
        },
        transformRequest: [(data) => {
          // تحويل JSON إلى x-www-form-urlencoded
          return Object.entries(data)
            .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
            .join("&");
        }],
      }
    );

    // إعادة بيانات Akinator كما هي
    res.status(200).json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
}
