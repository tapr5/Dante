export default function handler(req, res) {
  res.status(200).json({
    message: "🚀 Hello from /api/hello",
    method: req.method,
    time: new Date().toISOString()
  });
}
