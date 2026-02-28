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

  books.forEach(file => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <div class="book-thumb">PDF</div>
      <div class="book-meta">
        <h6>${file.replace(".pdf","")}</h6>
        <small>Toque para abrir</small>
      </div>
    `;

    card.onclick = () => {
      location.href = `reader.html?file=${encodeURIComponent(file)}`;
    };

    col.appendChild(card);
    lib.appendChild(col);
  });
})();