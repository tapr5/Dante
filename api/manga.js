export default async function handler(req, res) {
  try {
    const url = "https://lekmanga.net/wp-admin/admin-ajax.php?postID=165787&manga-paged=1&chapter=14&style=list";

    const bodyData = new URLSearchParams();
    bodyData.append("action", "chapter_navigate_page");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": "okhttp/5.0.0-alpha.12",
        "Accept-Encoding": "br,gzip",
        "Content-Type": "application/x-www-form-urlencoded",
        "cache-control": "max-age=600",
        "Cookie": "wp_wpfileupload_30267ab5f54bf7a6f3ba943bc5eda231=ge7RGaMMO2QKn7aDCOrKfpAD5swFLBwO"
      },
      body: bodyData,
    });

    const text = await response.text();
    let content = "";

    try {
      // 1. تحليل كائن JSON الخارجي
      const outerParsed = JSON.parse(text);

      // 2. التحقق من وجود حقل 'html' الذي يحتوي على سلسلة JSON الداخلية
      if (outerParsed.html) {
        // 3. تحليل سلسلة JSON الداخلية
        const innerParsed = JSON.parse(outerParsed.html);
        
        // 4. استخراج محتوى HTML الفعلي من المسار الصحيح
        content = innerParsed.data.data.content;
      } else {
        // في حال كان الهيكل مختلفاً، نعود إلى محاولة استخراج المحتوى مباشرة
        content = outerParsed.data.content;
      }
    } catch (e) {
      // إذا فشل التحليل في أي خطوة، نفترض أن النص هو محتوى HTML الخام
      content = text;
    }

    // استخراج روابط الصور من HTML باستخدام التعبير النمطي (Regex)
    // تم تعديل التعبير النمطي ليكون أكثر دقة ويأخذ في الاعتبار المسافات البيضاء الزائدة في قيمة src
    const regex = /<img[^>]+src=["']\s*([^"']+)\s*["'][^>]*>/g;
    const images = [];
    let match;

    // استخدام حلقة while لاستخراج جميع المطابقات
    while ((match = regex.exec(content)) !== null) {
      // match[1] يحتوي على رابط الصورة
      images.push(match[1].trim());
    }

    res.status(200).json({
      success: true,
      images
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
