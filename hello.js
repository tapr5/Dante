import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Hello from dante api!",
    time: new Date().toISOString()
  });
});

// عشان Vercel يستخدمه كـ Serverless Function
export default app;
