// pages/api/decrypt.js // Next.js API route (Pages router) that wraps your witanime decryption logic

const axios = require('axios'); const cheerio = require('cheerio'); const { Buffer } = require('buffer');

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' };

async function getHtmlContent(url) { try { const response = await axios.get(url, { headers: HEADERS, timeout: 15000, responseType: 'text' }); return response.data; } catch (e) { throw new Error(فشل في استخراج محتوى الصفحة: ${e.message}); } }

function toArray(hexStr) { const bytesList = []; for (let i = 0; i < hexStr.length; i += 2) { try { bytesList.push(parseInt(hexStr.substring(i, i + 2), 16)); } catch (e) { continue; } } return bytesList; }

function processXor(rawHex, secret) { let out = ""; const data = toArray(rawHex); const keylen = secret.length; for (let i = 0; i < data.length; i++) { out += String.fromCharCode(data[i] ^ secret.charCodeAt(i % keylen)); } return out; }

function extractJsVars(scriptContent) { const varsData = {}; const varNames = ['_m', '_t', '_s']; for (let i = 0; i < 12; i++) varNames.push(_p${i});

for (const name of varNames) { const regex = new RegExp(var\\s+${name}\\s*=\\s*(\\[.*?\\]|{.*?}|".*?"|'.*?');, 's'); const match = scriptContent.match(regex); if (match) { let valueStr = match[1].replace(/\n|\t/g, '').trim(); if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || (valueStr.startsWith("'") && valueStr.endsWith("'"))) { valueStr = valueStr.substring(1, valueStr.length - 1); } try { const valueStrJson = valueStr.replace(/'/g, '"'); varsData[name] = JSON.parse(valueStrJson); } catch (e) { varsData[name] = valueStr; } } } return varsData; }

async function decryptWitanimeLinks(url) { const htmlContent = await getHtmlContent(url); const $ = cheerio.load(htmlContent);

const scriptTag = $('#lkgx-js-extra'); if (!scriptTag || !scriptTag.html()) { throw new Error('لم يتم العثور على وسم السكريبت المشفر (lkgx-js-extra).'); }

const varsData = extractJsVars(scriptTag.html()); if (!varsData || !varsData._m || !varsData._t || !varsData._s) { throw new Error('فشل في استخراج المتغيرات الأساسية من السكريبت.'); }

const secretB64 = varsData._m.r || varsData._m; if (typeof secretB64 !== 'string') { throw new Error('صيغة المفتاح السري غير مدعومة.'); }

let secret; try { secret = Buffer.from(secretB64, 'base64').toString('utf-8'); } catch (e) { throw new Error(فشل في فك تشفير المفتاح السري: ${e.message}); }

const finalLinks = []; const serverNames = []; $('.episode-download-container .quality-list .notice').each((i, el) => { serverNames.push($(el).text().trim()); });

let totalLinks; try { totalLinks = parseInt(varsData._t.l || varsData._t); } catch (e) { throw new Error('فشل في تحديد عدد الروابط (_t).'); }

for (let i = 0; i < totalLinks; i++) { const pVarName = _p${i}; if (!varsData[pVarName]) continue; const chunks = varsData[pVarName]; const seqRawData = varsData._s; if (!Array.isArray(seqRawData) || i >= seqRawData.length) continue; const seqRaw = seqRawData[i];

let seq;
try {
  const seqJson = processXor(seqRaw, secret);
  seq = JSON.parse(seqJson);
} catch (e) {
  continue;
}

const decryptedChunks = chunks.map(chunk => processXor(chunk, secret));
const arranged = new Array(seq.length).fill('');
for (let j = 0; j < seq.length; j++) {
  if (seq[j] < decryptedChunks.length) arranged[seq[j]] = decryptedChunks[j];
}

const finalLink = arranged.join('');
const name = serverNames[i] || `رابط ${i + 1}`;
finalLinks.push({ name, url: finalLink });

}

return finalLinks; }

module.exports = async function handler(req, res) { // Allow only GET for simplicity (يمكن توسيع لاحقاً) if (req.method !== 'GET') { return res.status(405).json({ success: false, error: 'Only GET allowed' }); }

const targetUrl = req.query.url; if (!targetUrl) { return res.status(400).json({ success: false, error: 'Please provide ?url=...' }); }

try { const links = await decryptWitanimeLinks(targetUrl); return res.status(200).json({ success: true, count: links.length, links }); } catch (e) { return res.status(500).json({ success: false, error: e.message }); } };
