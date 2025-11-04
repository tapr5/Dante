export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return new Response(
      JSON.stringify({ error: 'يرجى إدخال الرابط عبر ?url=' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // الهيدر الذي تريد استخدامه (اختياري — فقط للتوضيح)
  const headers = {
    'Host': 'a1.mp4upload.com:183',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    'Accept-Encoding': 'identity',
    'Range': 'bytes=36273190-',
    'If-Match': '"686b1b7b-67c7474"',
    'If-Unmodified-Since': 'Mon, 07 Jul 2025 00:57:31 GMT',
    'Sec-GPC': '1',
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://www.mp4upload.com/',
    'Cookie':
      'lang=english; affiliate=V6b%2BpuASAQkprG3OHA1JRbkh%2FuHaB6Pj%2FOG9eJiP91UXkrpI6HLmrqzJS4EWa9SCKSiF0KHQORs%2B%2BB782cZbZLHn95ny0%2FL5SMgyCvSatyrE0B5qShp7bPlNXH%2F9CktLa2pBxSUwk8J66Crx7N9sqhA%3D',
  };

  // التوجيه المباشر (redirect)
  return Response.redirect(fileUrl, 302);
}
