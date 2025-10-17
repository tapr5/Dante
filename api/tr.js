export async function GET(request) {
  const url = "https://gateway.anime-rift.com/api/v3/library/episode/sources/675cb2795e8af2729bb128b6/675cb2795e8af2729bb128b9/1";

  const headers = {
    "x-device-release-version": "3.5.1",
    "user-agent": "Dart/3.8 (dart:io)",
    "accept-encoding": "gzip, deflate",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoiMmYyMDM2NzZiNDgxZDYyZTBkODM3YzE3ZDNlNTFjMGE6NDY5ZDQxZWU2MmI5NzlmYjhiZjdkYjRkZDY1MzI5OGQ6MjkzYzczN2M4OTM0YzUxNmI3ZDA1N2ZkODUzY2ZjYzJhNmFhNDJiNTZkYzhhZTc2NzY3ZmUyMDYyMWU4ZmRjMGFlODA4ZjNhNjY1NGY2MjhkNTg2ZWQ1YTc5YjJmNzgwMGZiMTU5NGE3ZmM4NWI5ZWNjNDk1NmNlM2Q2ZTgwZDQxOTM1MTk3YjRmYWRhYjBlYjcwYTJkMzlmYmIwZmIyZGRiNjVhOWU4ZDg0ZjRkZjVmNDM4Nzk5NzVkYjE0ZDkwOTQzYTJkMGU5N2Y5NTk0ZGNkODA5ZWVhODY0YjM0ZGI5Y2Y5ZWY3ODUxN2ZhYjE0YzQyY2NkZWFiYzA0ZDY3ZGNjNjFhZTg3OTMzZjY3ZmZjZWVmMjBjNTU3NDA2NDNlMjVjYjRhMjY2YjgyNzk2YzRhZWRmOGQ2ZjE0NTQzYTJjMjhlZmNkZjJhODJjODhhYjc2YjIyZjMxZDdhNWFjMTlhMzMyMzdiIiwiaWF0IjoxNzYwNzA0MTYwLCJleHAiOjE3NjMyOTYxNjB9.rjLU_8zm2dns9LiPhkxf8h_kZwUhgRW1sFgdhGzKavs",
    "content-type": "application/json; charset=UTF-8",
    "integrity": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6IkFOSU1FLkxJQlJBUlkuRVBJU09ERVMuU09VUkNFUy5BTEwiLCJleHAiOjE3NjA3MDQzOTUsImlhdCI6MTc2MDcwNDM4NX0.pdEycyCih5XWaii_EztK-LoaxzCSE3vQP3T81qJpL24",
    "accept": "application/json",
    "host": "gateway.anime-rift.com",
    "x-device-timezone": new Date().toISOString(),
    "x-device-id": "eSRU57XgTM2kjSOE_sPSoB:APA91bHhLbVQvFSFDcCHaaIJqSbzyHEca7GJQ6hTbE2dJQ8Tu_pAXFb4HQDDCZe4OaMpx8pa31fqXCByddOwL75jQMhT3bnmr6G5FTacpP2EIxN7FpZsU3Y",
    "x-device-language": "en",
    "x-platform": "Mobile"
  };

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      return Response.json({ error: "حدث خطأ أثناء الجلب", status: res.status }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "فشل الاتصال", details: err.message }, { status: 500 });
  }
}
