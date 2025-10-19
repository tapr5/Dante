// pages/api/episode.js
import axios from 'axios'
import * as cheerio from 'cheerio'

export default async function handler(req, res) {
  const url = req.method === 'POST' ? req.body.url : req.query.url
  if (!url) return res.status(400).json({ error: '📎 أرسل رابط الحلقة في query أو body (url)' })

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }
    })

    const $ = cheerio.load(data)

    // === استخراج العنوان والمعلومات ===
    const title = $('h1.entry-title').first().text().trim() || 'غير معروف'
    const subtitle = $('h2.entry-title').first().text().trim() || ''
    const meta = $('.col-lg-7 .font-size-16.text-white').text().replace(/\s+/g, ' ').trim()

    // === استخراج روابط التحميل حسب الجودة ===
    let qualities = []

    $('.tab-content.quality').each((i, el) => {
      const qualityName = $(el).attr('id') || `جودة ${i + 1}`
      const links = []

      $(el).find('a[href*="/link/"]').each((_, a) => {
        const href = $(a).attr('href')
        const size = $(a).find('.font-size-14').text().trim() || $(a).text().match(/\d+(\.\d+)?\s*(MB|GB)/i)?.[0] || ''
        if (href) links.push({ href, size })
      })

      if (links.length) qualities.push({ quality: qualityName, links })
    })

    // fallback إذا لم يجد tab-content
    if (qualities.length === 0) {
      $('a[href*="/link/"]').each((_, a) => {
        const href = $(a).attr('href')
        const size = $(a).find('.font-size-14').text().trim() || $(a).text().match(/\d+(\.\d+)?\s*(MB|GB)/i)?.[0] || ''
        if (href) qualities.push({ quality: 'روابط مباشرة', links: [{ href, size }] })
      })
    }

    if (qualities.length === 0)
      return res.status(404).json({ error: '❌ لم يتم العثور على روابط تحميل في الصفحة.' })

    return res.status(200).json({
      title,
      subtitle,
      meta,
      qualities
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '⚠️ حدث خطأ أثناء استخراج بيانات الحلقة.', details: err.message })
  }
}
