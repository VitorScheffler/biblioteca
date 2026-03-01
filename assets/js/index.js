const grid = document.getElementById("booksGrid");
const darkBtn = document.getElementById("toggleDarkIndex");

let darkMode = localStorage.getItem("index-dark") === "true";

function applyDark() {
  document.body.classList.toggle("dark", darkMode);
  darkBtn.setAttribute("aria-pressed", darkMode ? "true" : "false");
}
applyDark();

darkBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("index-dark", darkMode);
  applyDark();
});

fetch("/books/books.json")
  .then(res => res.json())
  .then(books => {
    books.forEach(book => {
      const col = document.createElement("div");

      col.className = "col-6 col-sm-4 col-md-3 col-lg-2";

      col.innerHTML = `
        <article class="book-card">
          <img src="${book.cover || '/assets/capas/default.jpg'}"
               alt="Capa ${book.title}"
               loading="lazy">

          <h2>${book.title}</h2>
          <p>${book.author}</p>

          <a class="btn btn-primary w-100"
             href="/reader.html?file=${encodeURIComponent(book.file)}">
            Ler
          </a>
        </article>
      `;

      grid.appendChild(col);
    });
  })
  .catch(() => {
    grid.innerHTML = "<p class='text-center'>Erro ao carregar livros</p>";
  });