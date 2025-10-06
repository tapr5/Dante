import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, body, server } = req.body;
    let url = "";

    // اختيار الرابط حسب نوع العملية
    switch (action) {
      case "start":
        url = "https://ar.akinator.com/game";
        break;
      case "answer":
        url = "https://ar.akinator.com/answer";
        break;
      case "back":
        url = "https://ar.akinator.com/back";
        break;
      case "list":
        if (!server) throw new Error("server required for list");
        url = `https://${server}.akinator.com/ws/list`;
        break;
      case "cancel":
        if (!server) throw new Error("server required for cancel");
        url = `https://${server}.akinator.com/ws/cancel`;
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    // نرسل البيانات كما هي
    const response = await axios.post(
      url,
      new URLSearchParams(body),
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    return res.status(200).send(response.data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
