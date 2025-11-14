// pages/api/getEpisodeJson.js
import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "الرجاء إرسال رابط الحلقة كمعامل استعلام." });
    }

    try {
        // استدعاء API مباشرة
        const apiUrl = `http://217.154.201.164:7763/api/tst?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });

        // إرجاع البيانات كما هي
        res.status(200).json({
            success: true,
            data: response.data
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            error: "فشل في جلب البيانات من API",
            details: e.message
        });
    }
}
