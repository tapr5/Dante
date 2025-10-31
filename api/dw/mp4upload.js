import axios from 'axios';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return new Response(
      JSON.stringify({ error: 'يرجى إدخال الرابط عبر ?url=' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await axios.get(fileUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://www.mp4upload.com/',
        'Accept': '*/*'
      }
    });

    // استخراج اسم الملف من الرابط
    const fileName = decodeURIComponent(fileUrl.split('/').pop() || 'video.mp4');

    // إنشاء StreamResponse
    const stream = response.data;

    return new Response(stream, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'video/mp4'
      }
    });
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return new Response(
      JSON.stringify({ error: 'فشل تحميل الفيديو' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
