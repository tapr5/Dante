export default async function handler(req, res) {
  // يمكنك تمرير الكلمة من query: /api/search?q=devil
  const { q = "devil" } = req.query

  const url = "https://gateway.anime-rift.com/api/v3/library/search?page=0&sort_by=release_year&sort_direction=1&text_direction=jp"

  const headers = {
    "user-agent": "Dart/3.8 (dart:io)",
    "x-device-release-version": "3.5.1",
    "accept-encoding": "gzip, deflate",
    "content-type": "application/json; charset=UTF-8",
    "integrity": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6IkFOSU1FLkxJQlJBUlkuU0VBUkNIIiwiZXhwIjoxNzYwNzA3MzEyLCJpYXQiOjE3NjA3MDczMDJ9.f92TcrUi2sGx0Hm-rbNmkEgi6uR-SjSriKMsgeagduA",
    "accept": "application/json",
    "host": "gateway.anime-rift.com",
    "x-device-timezone": new Date().toISOString(),
    "x-device-id": "eSRU57XgTM2kjSOE_sPSoB:APA91bHhLbVQvFSFDcCHaaIJqSbzyHEca7GJQ6hTbE2dJQ8Tu_pAXFb4HQDDCZe4OaMpx8pa31fqXCByddOwL75jQMhT3bnmr6G5FTacpP2EIxN7FpZsU3Y",
    "x-device-language": "en",
    "x-platform": "Mobile"
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: q })
    })

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: "فشل الجلب", details: error.message })
  }
}
