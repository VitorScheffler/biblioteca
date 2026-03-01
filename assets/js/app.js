// assets/js/app.js
// Renderiza grid, aplica dark mode na index e fornece estrutura de card (thumb + title)

// Elementos
const grid = document.getElementById("booksGrid");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");
const toggleDarkBtn = document.getElementById("toggleDarkIndex");

let books = [];

// aplicar dark mode salvo
let darkIndex = localStorage.getItem("index-dark") === "true";
function applyDarkIndex() {
  document.body.classList.toggle("dark", darkIndex);
  toggleDarkBtn?.setAttribute("aria-pressed", darkIndex ? "true" : "false");
}
applyDarkIndex();

// alterna dark mode
toggleDarkBtn?.addEventListener("click", () => {
  darkIndex = !darkIndex;
  localStorage.setItem("index-dark", darkIndex);
  applyDarkIndex();
});

// carregar books.json
fetch("/books/books.json")
  .then(res => {
    if (!res.ok) throw new Error("Não foi possível carregar books.json");
    return res.json();
  })
  .then(data => {
    books = data;
    renderBooks(books);
  })
  .catch(err => {
    console.error(err);
    grid.innerHTML = `<div class="p-3 text-center text-muted">Erro ao carregar livros.</div>`;
  });

// função para criar card (thumb + título dentro de uma div)
function renderBooks(list) {
  grid.innerHTML = "";
  if (!list || !list.length) {
    noResults.classList.remove("d-none");
    return;
  }
  noResults.classList.add("d-none");

  list.forEach(book => {
    const col = document.createElement("div");
    col.className = "col-item"; // layout controlado via CSS flex

    // estrutura: .book-card -> .book-thumb (img) + .book-info (title + author) + actions
    col.innerHTML = `
      <article class="book-card" role="article">
        <div class="book-thumb" aria-hidden="true">
          <img src="${book.cover || '/assets/capas/default.jpg'}" alt="Capa: ${escapeHtml(book.title)}">
        </div>

        <div class="book-info">
          <h3 class="book-title">${escapeHtml(book.title)}</h3>
          <p class="book-author">${escapeHtml(book.author || "")}</p>
        </div>

        <div class="card-actions">
          <a class="btn btn-primary btn-sm" href="/reader.html?file=${encodeURIComponent(book.file)}" role="button" aria-label="Ler ${escapeHtml(book.title)}">Ler</a>
        </div>
      </article>
    `;

    grid.appendChild(col);
  });
}

// busca client-side simples
searchInput?.addEventListener("input", () => {
  const q = (searchInput.value || "").trim().toLowerCase();
  const filtered = books.filter(b => (b.title + " " + (b.author || "")).toLowerCase().includes(q));
  renderBooks(filtered);
});

// helper: escape
function escapeHtml(str){ return String(str || "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }