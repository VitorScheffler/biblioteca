// assets/js/library.js
(() => {
  // Lista de PDFs (edite aqui)
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

  function build() {
    lib.innerHTML = "";
    books.forEach(file => {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

      const card = document.createElement("div");
      card.className = "book-card";

      const thumb = document.createElement("div");
      thumb.className = "book-thumb";
      thumb.innerText = file.split(".pdf")[0].slice(0,2).toUpperCase();

      const meta = document.createElement("div");
      meta.className = "book-meta";
      meta.innerHTML = `<h6>${file.replace(".pdf","")}</h6><small>Toque para abrir</small>`;

      card.appendChild(thumb);
      card.appendChild(meta);
      col.appendChild(card);

      // abrir em nova página reader.html?file=...
      card.addEventListener("click", () => {
        const url = `reader.html?file=${encodeURIComponent(file)}`;
        // navegar para a página do leitor
        window.location.href = url;
      });

      lib.appendChild(col);
    });
  }

  build();
})();