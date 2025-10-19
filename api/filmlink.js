// pages/api/combinedLink.js
import axios from 'axios'
import * as cheerio from 'cheerio'

export default async function handler(req, res) {
  const { url } = req.method === 'POST' ? req.body : req.query

  if (!url) return res.status(400).json({ error: '❌ أرسل الرابط في query أو body (url)' })

  try {
    // الخطوة 1: جلب الصفحة الأولى
    const page1 = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' },
      timeout: 20000
    })
    const $ = cheerio.load(page1.data)

    // ابحث عن رابط التحميل
    let downloadPage = $('a.download-link').first().attr('href')
    if (!downloadPage) {
      downloadPage = $('a:contains("اضغط هنا")').first().attr('href') ||
                     $('a:contains("Click here")').first().attr('href')
    }

    if (!downloadPage) {
      return res.status(404).json({ error: '⚠️ لم أجد رابط صفحة التحميل في الصفحة.' })
    }

    // اجعل الرابط مطلقًا إذا كان نسبيًا
    try {
      downloadPage = new URL(downloadPage, page1.request.res.responseUrl || url).toString()
    } catch {}

    // الخطوة 2: جلب صفحة التحميل واستخراج رابط الفيديو
    const page2 = await axios.get(downloadPage, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 20000
    })
    const $$ = cheerio.load(page2.data)

    let videoLink = null

    $$('a').each((i, el) => {
      const href = $$(el).attr('href')
      if (href && (href.includes('downet.net') || href.endsWith('.mp4'))) {
        videoLink = href
        return false
      }
    })

    if (!videoLink) {
      const regex = /(https?:\/\/s\d+\.downet\.net\/download\/[A-Za-z0-9\/._%-]+\.mp4)/
      const match = page2.data.match(regex)
      if (match) videoLink = match[0]
    }

    if (!videoLink) {
      return res.status(404).json({ error: '❌ لم أستطع إيجاد رابط الفيديو في صفحة التحميل.' })
    }

    return res.status(200).json({ videoLink })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: `⚠️ حدث خطأ أثناء الاستخراج: ${err.message}` })
  }
    }
