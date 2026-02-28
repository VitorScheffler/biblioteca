// assets/js/library.js
(() => {
  const books = [
    "1 - Harry Potter e a Pedra Filosofal - J.K. Rowling.pdf",
    "2 - Harry Potter e a Câmara Secreta - J.K. Rowling.pdf",
    "3 - Harry Potter e o Prisioneiro de Azkaban - J.K. Rowling.pdf",
    "4 - Harry Potter e o Cálice de Fogo - J.K. Rowling.pdf",
    "5 - Harry Potter e a Ordem da Fênix - J.K. Rowling.pdf",
    "6 - Harry Potter e o Enigma do Principe - J.K. Rowling.pdf",
    "7 - Harry Potter e as Relíquias da Morte - J.K. Rowling.pdf"
  ];

  const lib = document.getElementById("library");

  function renderPDFThumb(pdfPath, canvas) {
    const loadingTask = pdfjsLib.getDocument(`assets/books/${pdfPath}`);
    loadingTask.promise.then(pdf => {
      pdf.getPage(1).then(page => {
        const viewport = page.getViewport({ scale: 1 });
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        page.render({
          canvasContext: context,
          viewport: viewport
        });
      });
    }).catch(() => {
      canvas.parentElement.innerText = "PDF";
    });
  }

  function build() {
    lib.innerHTML = "";

    books.forEach(file => {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

      const card = document.createElement("div");
      card.className = "book-card";

      const thumb = document.createElement("div");
      thumb.className = "book-thumb";

      const canvas = document.createElement("canvas");
      thumb.appendChild(canvas);

      const meta = document.createElement("div");
      meta.className = "book-meta";
      meta.innerHTML = `<h6>${file.replace(".pdf","")}</h6><small>Toque para abrir</small>`;

      card.appendChild(thumb);
      card.appendChild(meta);
      col.appendChild(card);
      lib.appendChild(col);

      renderPDFThumb(file, canvas);

      card.addEventListener("click", () => {
        window.location.href = `reader.html?file=${encodeURIComponent(file)}`;
      });
    });
  }

  build();
})();