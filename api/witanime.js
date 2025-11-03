import axios from "axios";
import * as cheerio from "cheerio";
import { Buffer } from "buffer";
import * as re from "re"; // استخدام مكتبة re للتعابير النمطية

// تعيين User-Agent لمحاكاة متصفح حقيقي
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
};

/**
 * تحويل سلسلة سداسية عشرية إلى قائمة من البايتات (مماثل لدالة toArray في JS).
 * @param {string} hexStr - السلسلة السداسية العشرية.
 * @returns {number[]} - قائمة من البايتات.
 */
function toArray(hexStr) {
    const bytesList = [];
    for (let i = 0; i < hexStr.length; i += 2) {
        try {
            bytesList.push(parseInt(hexStr.substring(i, i + 2), 16));
        } catch (e) {
            continue;
        }
    }
    return bytesList;
}

/**
 * دالة فك التشفير (XOR).
 * @param {string} rawHex - البيانات المشفرة بصيغة سداسية عشرية.
 * @param {string} secret - مفتاح فك التشفير.
 * @returns {string} - البيانات المفكوكة.
 */
function process(rawHex, secret) {
    let out = "";
    const data = toArray(rawHex);
    const keylen = secret.length;
    
    for (let i = 0; i < data.length; i++) {
        // XOR بين البايت المشفر وحرف من المفتاح
        out += String.fromCharCode(data[i] ^ secret.charCodeAt(i % keylen));
    }
    return out;
}

/**
 * استخراج المتغيرات المشفرة من كود JavaScript المضمن.
 * @param {string} scriptContent - محتوى وسم السكريبت.
 * @returns {Object|null} - بيانات المتغيرات أو null في حالة الفشل.
 */
function extractJsVars(scriptContent) {
    const varsData = {};
    
    // قائمة بأسماء المتغيرات التي نحتاجها
    const varNames = ['_m', '_t', '_s'];
    for (let i = 0; i < 12; i++) {
        varNames.push(`_p${i}`);
    }
    
    for (const name of varNames) {
        // التعبير النمطي لاستخراج قيمة المتغير
        const regex = new RegExp(`var\\s+${name}\\s*=\\s*(\\[.*?\\]|{.*?}|".*?"|'.*?');`, 's');
        const match = scriptContent.match(regex);
        
        if (match) {
            let valueStr = match[1].replace(/\n|\t/g, '').trim();
            
            // إذا كانت القيمة محاطة بعلامات اقتباس، قم بإزالتها
            if (valueStr.startsWith(`"`) && valueStr.endsWith(`"`)) {
                valueStr = valueStr.substring(1, valueStr.length - 1);
            } else if (valueStr.startsWith(`'`) && valueStr.endsWith(`'`)) {
                valueStr = valueStr.substring(1, valueStr.length - 1);
            }
            
            // محاولة تحليل القيمة كـ JSON
            try {
                // استبدال الأقواس المفردة بأقواس مزدوجة للتحليل الصحيح
                const valueStrJson = valueStr.replace(/'/g, '"');
                varsData[name] = JSON.parse(valueStrJson);
            } catch (e) {
                // إذا فشل التحليل كـ JSON، قم بتخزين القيمة كنص خام
                varsData[name] = valueStr;
            }
        }
    }
    
    return varsData;
}

/**
 * العملية الرئيسية لفك تشفير الروابط.
 * @param {string} url - رابط الحلقة.
 * @returns {Promise<Array<{server: string, link: string}>>} - قائمة بالروابط المفكوكة.
 */
async function decryptWitanimeLinks(url) {
    let htmlContent;
    try {
        const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
        htmlContent = response.data;
    } catch (e) {
        throw new Error("فشل في الحصول على محتوى الصفحة أو الصفحة غير موجودة.");
    }

    const $ = cheerio.load(htmlContent);
    
    // 1. استخراج المتغيرات المشفرة
    const scriptTag = $('#lkgx-js-extra');
    if (scriptTag.length === 0 || !scriptTag.html()) {
        throw new Error("لم يتم العثور على وسم السكريبت المشفر (lkgx-js-extra).");
    }

    const varsData = extractJsVars(scriptTag.html());
    if (!varsData || !varsData._m || !varsData._t || !varsData._s) {
        throw new Error("فشل في استخراج المتغيرات الأساسية من السكريبت.");
    }

    // 2. فك تشفير المفتاح السري
    const secretB64 = varsData._m.r || varsData._m;
    
    if (typeof secretB64 !== 'string') {
        throw new Error("صيغة المفتاح السري غير مدعومة.");
    }
        
    let secret;
    try {
        secret = Buffer.from(secretB64, 'base64').toString('utf-8');
    } catch (e) {
        throw new Error(`فشل في فك تشفير المفتاح السري: ${e.message}`);
    }
    
    // 3. فك تشفير الروابط
    const finalLinks = [];
    
    // تحديد أسماء السيرفرات من HTML (للتسمية فقط)
    const serverNames = [];
    $('.episode-download-container .quality-list .notice').each((i, el) => {
        serverNames.push($(el).text().trim());
    });
    
    // تحديد عدد الروابط
    let totalLinks;
    try {
        totalLinks = parseInt(varsData._t.l || varsData._t);
    } catch (e) {
        throw new Error("فشل في تحديد عدد الروابط (_t).");
    }
    
    for (let i = 0; i < totalLinks; i++) {
        const pVarName = `_p${i}`;
        if (!varsData[pVarName]) {
            continue;
        }
            
        const chunks = varsData[pVarName];
        
        const seqRawData = varsData._s;
        if (!Array.isArray(seqRawData) || i >= seqRawData.length) {
            continue;
        }
        const seqRaw = seqRawData[i];
        
        // فك تشفير التسلسل (seq)
        let seq;
        try {
            const seqJson = process(seqRaw, secret);
            seq = JSON.parse(seqJson);
        } catch (e) {
            continue;
        }
        
        // فك تشفير الأجزاء (chunks)
        const decryptedChunks = chunks.map(chunk => process(chunk, secret));
        
        // ترتيب الأجزاء
        const arranged = new Array(seq.length).fill('');
        for (let j = 0; j < seq.length; j++) {
            if (seq[j] < decryptedChunks.length) {
                arranged[seq[j]] = decryptedChunks[j];
            }
        }
        
        const finalLink = arranged.join("");
        
        // إضافة الرابط إلى القائمة
        const name = serverNames[i] || `رابط ${i + 1}`;
        finalLinks.push({ server: name, link: finalLink });
    }

    if (finalLinks.length === 0) {
        throw new Error("لم يتم العثور على أي روابط تحميل.");
    }

    return finalLinks;
}

export default async function handler(req, res) {
    // التأكد من أن الطلب هو GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    
    // استخراج الرابط من معاملات الاستعلام
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: "الرجاء إرسال رابط الحلقة (url) كمعامل استعلام." });
    }

    try {
        const links = await decryptWitanimeLinks(url);
        
        // إرجاع الروابط المفكوكة
        res.status(200).json({
            success: true,
            episodeUrl: url,
            links: links
        });
        
    } catch (e) {
        // إرجاع رسالة خطأ واضحة
        res.status(500).json({ 
            success: false,
            error: "فشل في فك تشفير الروابط", 
            details: e.message 
        });
    }
}
