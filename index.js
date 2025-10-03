import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// إعداد Express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🖥️ تقديم ملفات HTML من ./html
app.use(express.static(path.join(__dirname, "html")));

// 📡 توجيه API الموجود في ./api
import hello from "./api/hello.js";
app.use("/api/hello", hello);

// شغل السيرفر محليًا (Vercel يتجاهل هذا لما يرفعه كـ serverless)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
