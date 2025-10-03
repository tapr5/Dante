import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";

async function startGame(language = "ar") {
  try {
    const baseUrl = `https://${language}.akinator.com/game`;

    // طلب البدأ
    const response = await axios.post(
      baseUrl,
      new URLSearchParams({ cm: "false", sid: "1" }),
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
        }
      }
    );

    const $ = cheerio.load(response.data);

    // استخراج السؤال و معلومات الجلسة
    const question = $("#question-label").text();
    const session = $('form#askSoundlike input[name="session"]').val();
    const signature = $('form#askSoundlike input[name="signature"]').val();

    if (!session || !signature) {
      throw new Error("فشل في الحصول على session أو signature");
    }

    return {
      id: uuidv4(), // كود فريد للجلسة
      session,
      signature,
      question
    };
  } catch (err) {
    return { error: err.message };
  }
}

// مثال تجربة
startGame("ar").then(console.log);
