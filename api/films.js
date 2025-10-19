// pages/api/akwam.js
import axios from 'axios'
import * as cheerio from 'cheerio'

export default async function handler(req, res) {
  const searchText = req.method === 'POST' ? req.body.text : req.query.text
  if (!searchText) return res.status(400).json({ error: '🔍 أرسل كلمة البحث في query أو body (text)' })

  try {
    const searchUrl = `https://ak.sv/search?q=${encodeURIComponent(searchText)}`

    const { data } = await axios.get(searchUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Accept-Language': 'ar,en;q=0.9'
      }
    })

    const $ = cheerio.load(data)
    let results = []

    $('.entry-box.entry-box-1').each((i, el) => {
      const $el = $(el)
      const titleElement = $el.find('.entry-title a')
      const title = titleElement.text().trim()
      const link = titleElement.attr('href')
      const image = $el.find('img.lazy').attr('data-src') || $el.find('img').attr('src')
      const rating = $el.find('.label.rating').text().trim().replace(' ', '') || 'غير معروف'
      const quality = $el.find('.label.quality').text().trim() || 'غير معروف'
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
      return res.status(404).json({ error: '❌ لم يتم العثور على نتائج للبحث.' })
    }

    // عرض أول 10 نتائج فقط
    const displayResults = results.slice(0, 10)

    res.status(200).json({
      query: searchText,
      totalResults: results.length,
      displayed: displayResults.length,
      searchUrl,
      results: displayResults
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '⚠️ حدث خطأ أثناء البحث.', details: err.message })
  }
}
