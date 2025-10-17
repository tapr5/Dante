// ✅ /app/api/direct/route.js أو /pages/api/direct.js

import axios from "axios"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") // مثال: 684b08a90d620e8aab29cfc3
    const quality = searchParams.get("quality") || "360P"
    const sessionId = searchParams.get("sessionId") || "116723cb4717293340e2be73abfb6be6a848348a4efa651dc511ea429931ff68"

    if (!id) {
      return new Response(JSON.stringify({ error: "missing id" }), { status: 400 })
    }

    const url = `https://gateway.anime-rift.com/api/v3/library/episode/source/direct_link/${id}?action=download&quality=${quality}&sessionId=${sessionId}`

    const headers = {
      "x-device-release-version": "3.5.1",
      "user-agent": "Dart/3.8 (dart:io)",
      "accept-encoding": "gzip, deflate",
      "authorization":
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoiMmYyMDM2NzZiNDgxZDYyZTBkODM3YzE3ZDNlNTFjMGE6NDY5ZDQxZWU2MmI5NzlmYjhiZjdkYjRkZDY1MzI5OGQ6MjkzYzczN2M4OTM0YzUxNmI3ZDA1N2ZkODUzY2ZjYzJhNmFhNDJiNTZkYzhhZTc2NzY3ZmUyMDYyMWU4ZmRjMGFlODA4ZjNhNjY1NGY2MjhkNTg2ZWQ1YTc5YjJmNzgwMGZiMTU5NGE3ZmM4NWI5ZWNjNDk1NmNlM2Q2ZTgwZDQxOTM1MTk3YjRmYWRhYjBlYjcwYTJkMzlmYmIwZmIyZGRiNjVhOWU4ZDg0ZjRkZjVmNDM4Nzk5NzVkYjE0ZDkwOTQzYTJkMGU5N2Y5NTk0ZGNkODA5ZWVhODY0YjM0ZGI5Y2Y5ZWY3ODUxN2ZhYjE0YzQyY2NkZWFiYzA0ZDY3ZGNjNjFhZTg3OTMzZjY3ZmZjZWVmMjBjNTU3NDA2NDNlMjVjYjRhMjY2YjgyNzk2YzRhZWRmOGQ2ZjE0NTQzYTJjMjhlZmNkZjJhODJjODhhYjc2YjIyZjMxZDdhNWFjMTlhMzMyMzdiIiwiaWF0IjoxNzYwNzA0MTYwLCJleHAiOjE3NjMyOTYxNjB9.rjLU_8zm2dns9LiPhkxf8h_kZwUhgRW1sFgdhGzKavs",
      "content-type": "application/json; charset=UTF-8",
      "integrity":
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6IkFOSU1FLkxJQlJBUlkuRVBJU09ERVMuU09VUkNFUy5ESVJFQ1RfTElOSyIsImV4cCI6MTc2MDcxMDYzNywiaWF0IjoxNzYwNzEwNjI3fQ.zufF75MWaaEtojmo_dM86lmIwZCBK35TvOE17ObjczQ",
      "accept": "application/json",
      "host": "gateway.anime-rift.com",
      "x-device-timezone": new Date().toISOString(),
      "x-device-id": "eSRU57XgTM2kjSOE_sPSoB:APA91bHhLbVQvFSFDcCHaaIJqSbzyHEca7GJQ6hTbE2dJQ8Tu_pAXFb4HQDDCZe4OaMpx8pa31fqXCByddOwL75jQMhT3bnmr6G5FTacpP2EIxN7FpZsU3Y",
      "x-device-language": "en",
      "x-platform": "Mobile",
    }

    const { data } = await axios.get(url, { headers })
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
