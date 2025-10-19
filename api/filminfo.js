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

    // التحقق من نوع الصفحة (مسلسل أم فيلم/حلقة)
    const isSeriesPage = url.includes('/series/') && !url.includes('/episode/')
    const isEpisodePage = url.includes('/episode/')

    if (isSeriesPage) {
      // === استخراج بيانات المسلسل ===
      return extractSeriesData($, res, url)
    } else if (isEpisodePage) {
      // === استخراج بيانات الحلقة الفردية ===
      return extractEpisodeData($, res, url)
    } else {
      // === استخراج بيانات الفيلم ===
      return extractMovieData($, res, url)
    }

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: '⚠️ حدث خطأ أثناء استخراج البيانات.', details: err.message })
  }
}

// دالة لاستخراج بيانات المسلسل
async function extractSeriesData($, res, url) {
  const title = $('h1.entry-title').first().text().trim() || 'غير معروف'
  
  // استخراج معلومات المسلسل
  const seriesInfo = {}
  $('.col-lg-7 .font-size-16.text-white').each((i, el) => {
    const text = $(el).text().trim()
    if (text.includes('اللغة')) seriesInfo.language = text.replace('اللغة :', '').trim()
    if (text.includes('الترجمة')) seriesInfo.translation = text.replace('الترجمة :', '').trim()
    if (text.includes('الجودة')) seriesInfo.quality = text.replace('الجودة :', '').trim()
    if (text.includes('انتاج')) seriesInfo.production = text.replace('انتاج :', '').trim()
    if (text.includes('السنة')) seriesInfo.year = text.replace('السنة :', '').trim()
    if (text.includes('مدة المسلسل')) seriesInfo.duration = text.replace('مدة المسلسل :', '').trim()
  })

  // استخراج الحلقات
  const episodes = []
  $('.bg-primary2').each((i, el) => {
    const episodeElement = $(el)
    const episodeTitle = episodeElement.find('h2 a').text().trim()
    const episodeLink = episodeElement.find('h2 a').attr('href')
    const episodeDate = episodeElement.find('.entry-date').text().trim()
    const episodeThumbnail = episodeElement.find('img').attr('src')

    if (episodeLink) {
      episodes.push({
        title: episodeTitle,
        link: episodeLink,
        date: episodeDate,
        thumbnail: episodeThumbnail,
        episodeNumber: i + 1
      })
    }
  })

  // استخراج فريق العمل
  const cast = []
  $('.entry-box-3').each((i, el) => {
    const actorName = $(el).find('.entry-title').text().trim()
    const actorLink = $(el).find('a').attr('href')
    const actorImage = $(el).find('img').attr('src')
    
    if (actorName) {
      cast.push({
        name: actorName,
        link: actorLink,
        image: actorImage
      })
    }
  })

  // استخراج القصة
  const story = $('.widget-body .text-white').first().text().trim() || 
                $('.text-white.font-size-18').first().text().trim()

  // استخراج التصنيفات
  const categories = []
  $('.badge.badge-pill.badge-light').each((i, el) => {
    const category = $(el).text().trim()
    if (category) categories.push(category)
  })

  return res.status(200).json({
    type: 'series',
    title,
    seriesInfo,
    story: story.substring(0, 500) + '...', // تقليل طول القصة
    episodes,
    cast: cast.slice(0, 8), // أول 8 ممثلين فقط
    categories,
    totalEpisodes: episodes.length,
    message: `تم العثور على ${episodes.length} حلقة في المسلسل`
  })
}

// دالة لاستخراج بيانات الحلقة الفردية
async function extractEpisodeData($, res, url) {
  const title = $('h1.entry-title').first().text().trim() || 'غير معروف'
  
  // === استخراج روابط التحميل ===
  let qualities = []

  // البحث في tab-content للجودة
  $('.tab-content.quality').each((i, el) => {
    const qualityName = $(el).attr('id') || `جودة ${i + 1}`
    const links = []

    $(el).find('a[href*="/link/"]').each((_, a) => {
      const href = $(a).attr('href')
      const text = $(a).text().trim()
      const size = $(a).find('.font-size-14').text().trim() || 
                   text.match(/\d+(\.\d+)?\s*(MB|GB)/i)?.[0] || ''
      const server = $(a).find('.font-size-12').text().trim() || 
                     text.replace(size, '').trim() || 'خادم غير معروف'
      
      if (href) {
        links.push({ 
          href, 
          size, 
          server,
          text 
        })
      }
    })

    if (links.length > 0) {
      qualities.push({ 
        quality: qualityName, 
        links 
      })
    }
  })

  // إذا لم يتم العثور على روابط في tab-content، ابحث في كل الصفحة
  if (qualities.length === 0) {
    const allLinks = []
    $('a[href*="/link/"]').each((_, a) => {
      const href = $(a).attr('href')
      const text = $(a).text().trim()
      if (href) {
        allLinks.push({
          href,
          text,
          server: 'خادم مباشر'
        })
      }
    })

    if (allLinks.length > 0) {
      qualities.push({
        quality: 'روابط مباشرة',
        links: allLinks
      })
    }
  }

  if (qualities.length === 0) {
    return res.status(404).json({ 
      error: '❌ لم يتم العثور على روابط تحميل في صفحة الحلقة.',
      note: 'قد تحتاج إلى زيارة صفحة الحلقة الفردية للحصول على روابط التحميل'
    })
  }

  // استخراج معلومات إضافية عن الحلقة
  const episodeInfo = {}
  $('.font-size-16.text-white').each((i, el) => {
    const text = $(el).text().trim()
    if (text.includes('الجودة')) episodeInfo.quality = text.replace('الجودة :', '').trim()
    if (text.includes('الحجم')) episodeInfo.size = text.replace('الحجم :', '').trim()
    if (text.includes('المدة')) episodeInfo.duration = text.replace('المدة :', '').trim()
  })

  return res.status(200).json({
    type: 'episode',
    title,
    episodeInfo,
    qualities,
    totalQualities: qualities.length,
    totalLinks: qualities.reduce((sum, q) => sum + q.links.length, 0)
  })
}

// دالة لاستخراج بيانات الفيلم
async function extractMovieData($, res, url) {
  const title = $('h1.entry-title').first().text().trim() || 'غير معروف'
  
  // استخراج روابط التحميل للفيلم (نفس طريقة الحلقات)
  let qualities = []

  $('.tab-content.quality').each((i, el) => {
    const qualityName = $(el).attr('id') || `جودة ${i + 1}`
    const links = []

    $(el).find('a[href*="/link/"]').each((_, a) => {
      const href = $(a).attr('href')
      const text = $(a).text().trim()
      const size = $(a).find('.font-size-14').text().trim() || 
                   text.match(/\d+(\.\d+)?\s*(MB|GB)/i)?.[0] || ''
      
      if (href) {
        links.push({ 
          href, 
          size,
          text 
        })
      }
    })

    if (links.length > 0) {
      qualities.push({ 
        quality: qualityName, 
        links 
      })
    }
  })

  if (qualities.length === 0) {
    return res.status(404).json({ 
      error: '❌ لم يتم العثور على روابط تحميل للفيلم.'
    })
  }

  // استخراج معلومات الفيلم
  const movieInfo = {}
  $('.col-lg-7 .font-size-16.text-white').each((i, el) => {
    const text = $(el).text().trim()
    if (text.includes('اللغة')) movieInfo.language = text.replace('اللغة :', '').trim()
    if (text.includes('الجودة')) movieInfo.quality = text.replace('الجودة :', '').trim()
    if (text.includes('السنة')) movieInfo.year = text.replace('السنة :', '').trim()
    if (text.includes('المدة')) movieInfo.duration = text.replace('المدة :', '').trim()
  })

  return res.status(200).json({
    type: 'movie',
    title,
    movieInfo,
    qualities,
    totalQualities: qualities.length
  })
                                                                    }
