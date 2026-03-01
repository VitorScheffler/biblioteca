<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Leitor PDF</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/styles.css">
</head>

<body class="reader-body">

<nav class="navbar bg-light shadow-sm px-2">
  <a href="/" class="btn btn-link">← Voltar</a>

  <div class="ms-auto d-flex gap-2">
    <button id="zoomOut" class="btn btn-sm btn-outline-secondary">−</button>
    <button id="zoomIn" class="btn btn-sm btn-outline-secondary">+</button>
    <button id="fullscreen" class="btn btn-sm btn-outline-secondary">⛶</button>
  </div>
</nav>

<div id="pdfViewer"></div>

<!-- PDF.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>

<!-- SEU JS DO LEITOR -->
<script src="/assets/js/reader.js"></script>

</body>
</html>