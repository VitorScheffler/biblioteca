const books = [
    "Harry Potter e a Pedra Filosofal.pdf"
];

const library = document.getElementById("library");
const readerContainer = document.getElementById("reader-container");
const viewer = document.getElementById("pdf-viewer");
const progressSpan = document.getElementById("progress");

let pdfDoc = null;
let scale = 1.4;
let currentBook = "";

// Biblioteca
books.forEach(file => {
    const col = document.createElement("div");
    col.className = "col-md-3";
    col.innerHTML = `
        <div class="card shadow">
            <div class="card-body text-center">
                <h6>${file.replace(".pdf", "")}</h6>
                <small>Clique para ler</small>
            </div>
        </div>
    `;
    col.onclick = () => openBook(file);
    library.appendChild(col);
});

function openBook(file) {
    library.classList.add("d-none");
    readerContainer.classList.remove("d-none");
    viewer.innerHTML = "";

    currentBook = file;

    const savedPage = localStorage.getItem(`page-${file}`) || 1;

    pdfjsLib.getDocument(`books/${file}`).promise.then(pdf => {
        pdfDoc = pdf;

        for (let i = 1; i <= pdf.numPages; i++) {
            renderPage(i);
        }

        // Scroll até onde parou
        setTimeout(() => {
            const pageEl = document.querySelector(`[data-page="${savedPage}"]`);
            if (pageEl) pageEl.scrollIntoView();
        }, 500);
    });
}

function renderPage(num) {
    pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const wrapper = document.createElement("div");
        wrapper.className = "pdf-page";
        wrapper.dataset.page = num;
        wrapper.appendChild(canvas);

        viewer.appendChild(wrapper);

        page.render({
            canvasContext: ctx,
            viewport
        });
    });
}

// Salvar progresso conforme scroll
viewer.addEventListener("scroll", () => {
    const pages = document.querySelectorAll(".pdf-page");
    let current = 1;

    pages.forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.top < window.innerHeight / 2) {
            current = p.dataset.page;
        }
    });

    if (pdfDoc) {
        const percent = Math.floor((current / pdfDoc.numPages) * 100);
        progressSpan.innerText = percent + "%";
        localStorage.setItem(`page-${currentBook}`, current);
    }
});

// Fullscreen
document.getElementById("fullscreen").onclick = () => {
    if (!document.fullscreenElement) {
        readerContainer.requestFullscreen();
        readerContainer.classList.add("fullscreen");
    } else {
        document.exitFullscreen();
        readerContainer.classList.remove("fullscreen");
    }
};

// Fechar
document.getElementById("closeReader").onclick = () => {
    readerContainer.classList.add("d-none");
    library.classList.remove("d-none");
    document.exitFullscreen?.();
};