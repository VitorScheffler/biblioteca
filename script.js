// script.js — carrega books.json e abre o viewer no modal (mesma guia se preferir)
// Estrutura esperada do books.json: array de objetos com id, title, author, file, cover, description (cover opcional)

const grid = document.getElementById('booksGrid');
const emptyNotice = document.getElementById('emptyNotice');
const readerIframe = document.getElementById('readerIframe');
const readerTitle = document.getElementById('readerTitle');
const readerClearBtn = document.getElementById('readerClearBtn');
let currentBookFile = null;

// carrega a lista
fetch('books.json', { cache: 'no-store' })
  .then(res => {
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(data => {
    if(!Array.isArray(data) || data.length === 0){
      emptyNotice.classList.remove('d-none');
      return;
    }
    renderBooks(data);
  })
  .catch(err => {
    console.error('Erro carregando books.json', err);
    emptyNotice.textContent = 'Erro carregando lista de livros. Verifique books.json (console para detalhes).';
    emptyNotice.classList.remove('d-none');
  });

function renderBooks(books){
  grid.innerHTML = '';
  books.forEach(book => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3';

    const cover = book.cover && book.cover.trim() ? book.cover : '';
    const coverHtml = cover
      ? `<img src="${cover}" alt="${escapeHtml(book.title)}" class="book-cover w-100">`
      : `<div style="height:200px;background:#e6edf6;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:36px">PDF</div>`;

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        ${coverHtml}
        <div class="card-body">
          <h6 class="mb-1" style="font-size:14px">${escapeHtml(book.title)}</h6>
          <small class="text-muted">${escapeHtml(book.author || '')}</small>
        </div>
      </div>
    `;

    col.addEventListener('click', () => openReader(book));
    grid.appendChild(col);
  });
}

function openReader(book){
  currentBookFile = book.file;
  readerTitle.textContent = book.title || decodeURIComponent(book.file || '');
  // passa o file e o title para o viewer via query string (viewer utiliza pdf.js)
  const src = `viewer.html?file=${encodeURIComponent(book.file)}&title=${encodeURIComponent(book.title || '')}`;
  readerIframe.src = src;

  const modalEl = document.getElementById('readerModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // limpar iframe ao fechar para liberar memória
  modalEl.addEventListener('hidden.bs.modal', function onHidden(){
    readerIframe.src = '';
    modalEl.removeEventListener('hidden.bs.modal', onHidden);
  });
}

// botão para limpar progresso do livro atual
readerClearBtn.addEventListener('click', ()=>{
  if(!currentBookFile) return alert('Nenhum livro aberto.');
  const key = 'pdf-progress-' + currentBookFile;
  localStorage.removeItem(key);
  alert('Progresso limpo para este livro.');
});

// ajuda simples para escapar texto inserido no HTML
function escapeHtml(s){
  if(!s) return '';
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}