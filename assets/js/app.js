const container = document.getElementById("booksContainer");
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");

let books = [];

fetch("/books/books.json")
  .then(res => res.json())
  .then(data => {
    books = data;
    renderBooks(books);
  });

function renderBooks(list) {
  container.innerHTML = "";

  if (!list.length) {
    noResults.classList.remove("d-none");
    return;
  }

  noResults.classList.add("d-none");

  list.forEach(book => {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";

    col.innerHTML = `
      <div class="book-card bg-white p-2 rounded h-100"
           onclick="openBook('${book.file}')">
        <img src="${book.cover}" class="book-cover w-100">
        <div class="mt-2 fw-semibold">${book.title}</div>
        <div class="text-muted small">${book.author || ""}</div>
      </div>
    `;

    container.appendChild(col);
  });
}

function openBook(file) {
  window.location.href = `/reader.html?file=${encodeURIComponent(file)}`;
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  renderBooks(
    books.filter(b =>
      (b.title + b.author).toLowerCase().includes(q)
    )
  );
});