// akwam.js
import axios from 'axios'
import * as cheerio from 'cheerio'

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
  try {
    if (!text) return conn.reply(m.chat, `🔍 *أدخل كلمة للبحث*\n\nمثال:\n${usedPrefix + command} Hunter\n${usedPrefix + command} Wednesday`, m)

    const searchUrl = `https://ak.sv/search?q=${encodeURIComponent(text)}`
    
    const { data } = await axios.get(searchUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Accept-Language': 'ar,en;q=0.9'
      }
    })

    const $ = cheerio.load(data)

    // === استخراج نتائج البحث ===
    let results = []

    $('.entry-box.entry-box-1').each((i, el) => {
      const $el = $(el)
      
      // استخراج العنوان والرابط
      const titleElement = $el.find('.entry-title a')
      const title = titleElement.text().trim()
      const link = titleElement.attr('href')
      
      // استخراج الصورة
      const image = $el.find('img.lazy').attr('data-src') || $el.find('img').attr('src')
      
      // استخراج التقييم
      const rating = $el.find('.label.rating').text().trim().replace(' ', '') || 'غير معروف'
      
      // استخراج الجودة
      const quality = $el.find('.label.quality').text().trim() || 'غير معروف'
      
      // استخراج السنة والأنواع
      const year = $el.find('.badge-secondary').first().text().trim() || 'غير معروف'
      const genres = []
      $el.find('.badge-light').each((_, genreEl) => {
        const genre = $(genreEl).text().trim()
        if (genre && genre !== year) genres.push(genre)
      })

      if (title && link) {
        results.push({
          title,
          link,
          image,
          rating,
          quality,
          year,
          genres: genres.join(', '),
          type: link.includes('/movie/') ? '🎬 فيلم' : link.includes('/series/') ? '📺 مسلسل' : '📁 محتوى'
        })
      }
    })

    if (results.length === 0) {
      return conn.reply(m.chat, '❌ لم يتم العثور على نتائج للبحث.', m)
    }

    // === بناء الرسالة ===
    let msg = `🔍 *نتائج البحث عن:* "${text}"\n\n`
    
    // عرض أول 10 نتائج فقط لتجنب الرسالة الطويلة
    const displayResults = results.slice(0, 10)
    
    displayResults.forEach((item, index) => {
      msg += `${index + 1}. ${item.type} *${item.title}*\n`
      msg += `   ⭐ التقييم: ${item.rating}\n`
      msg => `   📅 السنة: ${item.year}\n`
      if (item.quality !== 'غير معروف') msg += `   🎯 الجودة: ${item.quality}\n`
      if (item.genres) msg += `   🏷️ الأنواع: ${item.genres}\n`
      msg += `   🔗 الرابط: ${item.link}\n\n`
    })

    if (results.length > 10) {
      msg += `📄 *ملاحظة:* تم عرض ${displayResults.length} من أصل ${results.length} نتيجة\n`
      msg += `لرؤية المزيد: ${searchUrl}`
    }

    // إرسال الصورة الأولى مع النص إذا كانت موجودة
    const firstImage = displayResults[0]?.image
    if (firstImage) {
      await conn.sendFile(m.chat, firstImage, 'search.jpg', msg.trim(), m)
    } else {
      await conn.reply(m.chat, msg.trim(), m)
    }

  } catch (err) {
    console.error(err)
    await conn.reply(m.chat, '⚠️ حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.', m)
  }
}

handler.command = ['اكوام', 'اكوامبحث']
handler.help = ['اكوام <كلمة البحث>']
handler.tags = ['anime', 'search']

export default handler
