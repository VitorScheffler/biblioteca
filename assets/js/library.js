(() => {
  const books = [
    "Harry Potter 1.pdf",
    "Harry Potter 2.pdf",
    "Harry Potter 3.pdf"
  ];

  const lib = document.getElementById("library");
  const search = document.getElementById("search");

  function build(list) {
    lib.innerHTML = "";
    list.forEach(file => {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4";

      const card = document.createElement("div");
      card.className = "book-card";

      card.innerHTML = `
        <div class="book-thumb">PDF</div>
        <div class="book-meta">
          <h6>${file.replace(".pdf","")}</h6>
          <small>Abrir</small>
        </div>
      `;

      card.onclick = () => {
        window.location.href = `reader.html?file=${encodeURIComponent(file)}`;
      };

      col.appendChild(card);
      lib.appendChild(col);
    });
  }

  search?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    build(books.filter(b => b.toLowerCase().includes(q)));
  });

  build(books);
})();