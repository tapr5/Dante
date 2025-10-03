<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>My Vercel App</title>
  </head>
  <body>
    <h1>مرحبا — هذا index.html من مجلد ./html</h1>
    <p>اختبر الـ API: <a href="/api/hello">/api/hello</a></p>
    <script>
      fetch('/api/hello')
        .then(r => r.json())
        .then(j => console.log('api/hello =>', j))
        .catch(e => console.error(e));
    </script>
  </body>
</html>
