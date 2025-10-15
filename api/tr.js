// ====== api/animerift.js ======
import axios from "axios";

export default async function handler(req, res) {
  try {
    const { id, quality = "240P" } = req.query;

    if (!id) {
      return res.status(400).json({ error: "يرجى إرسال معرف الحلقة ?id=" });
    }

    const response = await axios.get(`https://gateway.anime-rift.com/api/v3/library/episode/source/direct_link/${id}`, {
      params: {
        action: "download",
        quality,
        offline_download: "1",
        sessionId: "116723cb4717293340e2be73abfb6be6a848348a4efa651dc511ea429931ff68"
      },
      headers: {
        "x-device-release-version": "3.5.1",
        "user-agent": "Dart/3.8 (dart:io)",
        "accept-encoding": "gzip, deflate",
        "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoiMzQ5MzZiMDRhM2VhNTZkMzRhMTJlYmI2YzYzZWU3ZGE6NzMyODVlNTg0ZjYyOTg2NjRiZWZmNjZmZTk0YjViZDE6Mjc1ZTZhNTc3YjdkMjZlNmNkYjYwYWMyNTk0MGU1YTg0ODE5YTQ1YWMwMzgyZDcwMGEzMTY3Y2MxODE2YTI1YmE4NmE2ZTU2YjZmNWViZDNlMWUxZThjMzdkMzEwZmY3NzljMzk3NzNlNjk4MDJiNWM4ZmI1NWExMjdmZjI1ZGIwNzhhNjVlYzZkMjhhN2IzNmY2NWNiZmFkNTM5ODVjNGFiMjZjMTcxNTEyYjg2Y2Y1ZWU2NjY1ZmVlN2Q5MTMwNTY4NGYwYTg3NDYwMDZjOTBkNzMyMDAyYjczNzg5MzY0ZTQ2ZTUxMjE3NGNjMDkwNDc0NDU1NzI2Njk5NmRlZTZhMWNkZDRkNTczMzNhZGQyOTY5N2FmODdkNGYwNjg0NmJkYjc4N2U4YTczN2JjZDk5OGI5ZGIwNjI2OTNkZjE2Y2UyMzI5MDcwNzhhYjRkMmU5MGNiYmQ4NTg5MDhjMGFiMDM2ZWRjIiwiaWF0IjoxNzYwNTEzMDIwLCJleHAiOjE3NjMxMDUwMjB9.fYTrNDCJFs_Kt2CVyeJyj_dG-u3tkeFu2dN24Wfjj9E",
        "content-type": "application/json; charset=UTF-8",
        "integrity": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6IkFOSU1FLkxJQlJBUlkuRVBJU09ERVMuU09VUkNFUy5ESVJFQ1RfTElOSyIsImV4cCI6MTc2MDUxMzE3MywiaWF0IjoxNzYwNTEzMTYzfQ.ETPAOmr_-4Sy58HhCpEz7Clg7y4JQts6ocx1vgESh_Y",
        "accept": "application/json",
        "host": "gateway.anime-rift.com",
        "x-device-timezone": new Date().toISOString(),
        "x-device-id": "cfCE252YRLCGPF77wJAXAS:APA91bHpaTJdvMMzWK7UBbVWH4P1k0MKD8BRlmuDxneWuCYWL48tV6gjZ4h75jE9-jXPy4F-Vdj_7MTgRGk7-WHgtIxygAQoblcmfaQdrfHnzAhotuOFI-Y",
        "x-device-language": "en",
        "x-platform": "Mobile",
      },
    });

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
