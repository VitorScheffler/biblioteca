// assets/js/app.js
// Gerencia a lista de livros (books.json), busca, dark mode na index e render de cards.

// Elementos
const grid = document.getElementById("booksGrid");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");
const toggleDarkBtn = document.getElementById("toggleDarkIndex");

let books = [];

// Aplica modo escuro guardado
let darkIndex = localStorage.getItem("index-dark") === "true";
function applyDarkIndex() {
  document.body.classList.toggle("dark", darkIndex);
  toggleDarkBtn?.setAttribute("aria-pressed", darkIndex ? "true" : "false");
}
applyDarkIndex();

toggleDarkBtn?.addEventListener("click", () => {
  darkIndex = !darkIndex;
  localStorage.setItem("index-dark", darkIndex);
  applyDarkIndex();
});

// Carrega books.json
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

// Render de cards
function renderBooks(list) {
  grid.innerHTML = "";
  if (!list || !list.length) {
    noResults.classList.remove("d-none");
    return;
  }
  noResults.classList.add("d-none");

  list.forEach(book => {
    const col = document.createElement("div");
    col.className = "col-item";

    col.innerHTML = `
      <article class="book-card h-100" role="article">
        <div class="book-cover" aria-hidden="true">
          <img src="${book.cover || '/assets/capas/default.jpg'}" alt="Capa: ${escapeHtml(book.title)}">
        </div>
        <div>
          <h3 class="book-title">${escapeHtml(book.title)}</h3>
          <p class="book-author">${escapeHtml(book.author || "")}</p>
        </div>
        <div class="card-actions mt-2">
          <a class="btn btn-primary btn-sm w-100" href="/reader.html?file=${encodeURIComponent(book.file)}" role="button" aria-label="Ler ${escapeHtml(book.title)}">Ler</a>
        </div>
      </article>
    `;
    grid.appendChild(col);
  });
}

// Busca simples (client-side)
searchInput?.addEventListener("input", () => {
  const q = (searchInput.value || "").trim().toLowerCase();
  const filtered = books.filter(b => {
    return (b.title + " " + (b.author || "")).toLowerCase().includes(q);
  });
  renderBooks(filtered);
});

// util: escape para inserir texto em HTML
function escapeHtml(str){ return String(str || "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }