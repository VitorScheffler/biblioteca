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
  const inputSearch = document.getElementById("search");
  const btnRefresh = document.getElementById("btn-refresh");

  function makeThumbText(name) {
    const base = name.replace(/\.pdf$/i, "").trim();
    const parts = base.split(/\s+|-/).filter(Boolean);

    if (parts.length === 0) return "PDF";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || "")).toUpperCase();
  }

  function build(list) {
    lib.innerHTML = "";

    list.forEach(file => {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

      const card = document.createElement("div");
      card.className = "book-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      const thumb = document.createElement("div");
      thumb.className = "book-thumb";
      thumb.innerText = makeThumbText(file);

      const meta = document.createElement("div");
      meta.className = "book-meta";
      meta.innerHTML = `
        <h6>${file.replace(/\.pdf$/i, "")}</h6>
        <small>Toque para abrir</small>
      `;

      card.appendChild(thumb);
      card.appendChild(meta);
      col.appendChild(card);

      card.addEventListener("click", () => {
        window.location.href = `reader.html?file=${encodeURIComponent(file)}`;
      });

      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") card.click();
      });

      lib.appendChild(col);
    });
  }

  function filterBooks(q) {
    q = (q || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    return books.filter(b =>
      b.toLowerCase().includes(q)
    );
  }

  if (inputSearch) {
    inputSearch.addEventListener("input", e => {
      build(filterBooks(e.target.value));
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => build(books));
  }

  build(books);
})();