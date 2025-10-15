import axios from "axios";

export default async function handler(req, res) {
  try {
    const { id, quality = "240P" } = req.query;

    if (!id) {
      return res.status(400).json({ error: "يرجى إرسال معرف الحلقة ?id=" });
    }

    // هنا نستخدم headers تشبه الجهاز الرسمي
    const response = await axios.get(
      `https://gateway.anime-rift.com/api/v3/library/episode/source/direct_link/${id}`,
      {
        params: {
          action: "download",
          quality,
          offline_download: "1",
          sessionId: "FAKE_SESSION_FOR_MOBILE", // Session وهمي
        },
        headers: {
          "x-device-release-version": "3.5.1",
          "user-agent": "AnimeRift/3.5.1 (Android 13; Mobile)",
          "accept-encoding": "gzip, deflate",
          "authorization": "Bearer FAKE_TOKEN_FOR_MOBILE",
          "content-type": "application/json; charset=UTF-8",
          "accept": "application/json",
          "host": "gateway.anime-rift.com",
          "x-device-timezone": new Date().toISOString(),
          "x-device-id": "FAKE_DEVICE_ID_1234567890",
          "x-device-language": "en",
          "x-platform": "Mobile",
        },
      }
    );

    const downloadUrl = response.data?.data?.download_url;

    if (!downloadUrl) {
      return res.status(404).json({ error: "لم يتم العثور على رابط تحميل" });
    }

    res.status(200).json({
      success: true,
      id,
      quality,
      download_url: downloadUrl,
    });
  } catch (error) {
    console.error("Error fetching download URL:", error.message);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الرابط", details: error.message });
  }
}
