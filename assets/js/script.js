/* Leitor PDF responsivo com lazy-render, scroll, fullscreen e zoom
   Requisitos: coloque seus PDFs em /books/ e edite a lista `books`.
   Abra via servidor local (http://localhost/...) */

(function(){
    // === CONFIGURAÇÃO: lista de PDFs (adicione seus nomes) ===
    const books = [
        "Harry Potter e a Pedra Filosofal.pdf"
        // adicione mais, ex: "Outro livro.pdf"
    ];

    // Elementos DOM
    const libEl = document.getElementById("library");
    const readerCard = document.getElementById("reader-container");
    const viewer = document.getElementById("pdf-viewer");
    const btnBack = document.getElementById("btn-back");
    const btnFullscreen = document.getElementById("btn-fullscreen");
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
    const btnFit = document.getElementById("btn-fit");
    const progressEl = document.getElementById("progress");
    const pageInfoEl = document.getElementById("page-info");
    const btnOpenLibrary = document.getElementById("btn-open-library");

    // Estado
    let pdfDoc = null;
    let currentBook = null;
    let baseScale = 1.0;      // escala base relativa (ajustada automaticamente por largura)
    let zoomFactor = 1.0;     // zoom adicional do usuário
    let observer = null;
    let renderedPages = new Set();

    // PDF.js worker (aponta para CDN worker)
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    } else {
        // alerta visual se PDF.js não carregou
        libEl.innerHTML = '<div class="col-12 warn">Biblioteca não pôde carregar: PDF.js não está disponível. Verifique sua conexão ou baixe pdf.min.js localmente.</div>';
        console.warn("pdfjsLib não encontrado. Verifique se o CDN carregou.");
        return;
    }

    // Monta a grid da biblioteca
    function buildLibrary(){
        libEl.innerHTML = "";
        books.forEach(file => {
            const col = document.createElement("div");
            col.className = "col-12 col-sm-6 col-md-4 col-lg-3";

            const card = document.createElement("div");
            card.className = "p-3 book-card bg-white";

            const thumb = document.createElement("div");
            thumb.className = "book-thumb";
            thumb.innerText = file.split(".pdf")[0].slice(0,2).toUpperCase();

            const meta = document.createElement("div");
            meta.className = "book-meta";
            meta.innerHTML = `<h6>${file.replace(".pdf","")}</h6><small>Toque para abrir</small>`;

            card.appendChild(thumb);
            card.appendChild(meta);
            col.appendChild(card);

            card.addEventListener("click", () => openBook(file));
            libEl.appendChild(col);
        });
    }

    // Abre o livro
    function openBook(file){
        // reset
        viewer.innerHTML = "";
        renderedPages.clear();
        if (observer) observer.disconnect();

        currentBook = file;
        readerCard.classList.remove("d-none");
        document.querySelector('html, body').style.overflow = ''; // ensure normal scrolling

        const savedPage = parseInt(localStorage.getItem(`page-${file}`) || "1", 10);

        const url = `books/${file}`;

        // carregar PDF (promise)
        pdfjsLib.getDocument(url).promise.then(pdf => {
            pdfDoc = pdf;
            // cria placeholders para cada página
            for (let i = 1; i <= pdfDoc.numPages; i++){
                const wrapper = document.createElement("div");
                wrapper.className = "pdf-page";
                wrapper.dataset.page = i;
                // placeholder canvas (will be resized/rendered when visible)
                const canvas = document.createElement("canvas");
                canvas.dataset.rendered = "false";
                wrapper.appendChild(canvas);
                viewer.appendChild(wrapper);
            }

            // ajustar escala base: queremos que a página ocupe largura disponível (considerando max-width)
            baseScale = computeBaseScale();

            // IntersectionObserver para lazy-render (renderiza quando a página entra próximo da viewport)
            observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const wrapper = entry.target;
                        const pageNum = parseInt(wrapper.dataset.page,10);
                        if (!renderedPages.has(pageNum)) {
                            renderPage(pageNum);
                        }
                    }
                });
            }, { root: viewer, rootMargin: '800px 0px 800px 0px', threshold: 0.1 });

            // observe todos os wrappers
            document.querySelectorAll(".pdf-page").forEach(w => observer.observe(w));

            // esperar um pequeno delay e rolar até a página salva
            setTimeout(() => {
                const target = viewer.querySelector(`[data-page="${savedPage}"]`);
                if (target) {
                    target.scrollIntoView({behavior:'auto', block:'start'});
                }
                updateProgress(); // atualiza UI
            }, 300);
        }).catch(err=>{
            console.error("Erro ao carregar PDF:", err);
            viewer.innerHTML = `<div class="warn">Erro ao carregar o PDF — veja console (F12)</div>`;
        });
    }

    // Calcula escala base conforme largura do container / página padrão
    function computeBaseScale(){
        // tomada: queremos que o canvas utilize 90% da largura do container
        const containerWidth = Math.min(window.innerWidth * 0.96, 900); // limite 900
        // assumimos largura típica de PDF 800 (viewport.width do page.getViewport varia),
        // mas como usamos renderPage para definir escala exata, aqui apenas devolvemos 1
        // Vamos usar ajuste real no renderPage com viewport.width
        return 1.0;
    }

    // Renderiza página específica (usada por observer)
    function renderPage(pageNum){
        if (!pdfDoc) return;
        // evitar duplas renderizações
        if (renderedPages.has(pageNum)) return;

        const wrapper = viewer.querySelector(`[data-page="${pageNum}"]`);
        if (!wrapper) return;
        const canvas = wrapper.querySelector("canvas");
        canvas.dataset.rendered = "true";

        pdfDoc.getPage(pageNum).then(page => {
            // compute optimal scale so that canvas width equals wrapper width (or container width)
            const containerInnerWidth = Math.min(window.innerWidth * 0.96, 900);
            const viewport = page.getViewport({ scale: 1.0 });
            const targetScale = (containerInnerWidth / viewport.width) * baseScale * zoomFactor;

            const vp = page.getViewport({ scale: targetScale });

            // set canvas size in pixels
            canvas.width = Math.floor(vp.width);
            canvas.height = Math.floor(vp.height);

            // set style width to be responsive (so CSS handles it)
            canvas.style.width = '100%';
            canvas.style.height = 'auto';

            const ctx = canvas.getContext('2d');
            const renderTask = page.render({ canvasContext: ctx, viewport: vp });

            renderTask.promise.then(() => {
                renderedPages.add(pageNum);
                updateProgress();
            }).catch(err => {
                console.warn("Erro renderizando página", pageNum, err);
            });
        });
    }

    // Atualiza progresso: página atual baseada na página mais central visível
    function updateProgress(){
        if (!pdfDoc) return;
        const pages = Array.from(document.querySelectorAll(".pdf-page"));
        let current = 1;

        // calcula a página cujo centro esteja mais próximo do centro da viewport do viewer
        const viewerRect = viewer.getBoundingClientRect();
        const viewerCenter = viewerRect.top + viewerRect.height / 2;

        for (let p of pages) {
            const rect = p.getBoundingClientRect();
            const dist = Math.abs((rect.top + rect.height/2) - viewerCenter);
            // use página com menor distância
            if (!p._bestDist || dist < p._bestDist) {
                p._bestDist = dist;
            }
        }
        // escolher a com menor _bestDist
        let best = pages[0];
        let bestDist = Number.POSITIVE_INFINITY;
        pages.forEach(p => {
            if (p._bestDist < bestDist) { best = p; bestDist = p._bestDist; }
            // reset helper
            p._bestDist = undefined;
        });
        if (best && best.dataset && best.dataset.page) {
            current = parseInt(best.dataset.page,10);
        }

        const percent = Math.floor((current / pdfDoc.numPages) * 100);
        progressEl.innerText = percent + "%";
        pageInfoEl.innerText = `Página ${current} / ${pdfDoc.numPages}`;
        // salva a página no localStorage
        localStorage.setItem(`page-${currentBook}`, current);
    }

    // Re-render das páginas visíveis (usado no zoom)
    function rerenderVisiblePages(){
        // desconectar observer temporariamente
        if (observer) observer.disconnect();

        // marcar todas as vistas renderizadas para serem re-renderizadas
        const pages = document.querySelectorAll(".pdf-page");
        pages.forEach(p => {
            const num = parseInt(p.dataset.page,10);
            // remover o canvas e criar novo para forçar render
            const oldCanvas = p.querySelector("canvas");
            const newCanvas = document.createElement("canvas");
            newCanvas.dataset.rendered = "false";
            p.replaceChild(newCanvas, oldCanvas);
            // remover do set para re-renderizar
            renderedPages.delete(num);
        });

        // re-observe
        observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const wrapper = entry.target;
                    const pageNum = parseInt(wrapper.dataset.page,10);
                    if (!renderedPages.has(pageNum)) {
                        renderPage(pageNum);
                    }
                }
            });
        }, { root: viewer, rootMargin: '800px 0px 800px 0px', threshold: 0.1 });

        document.querySelectorAll(".pdf-page").forEach(w => observer.observe(w));
    }

    // === Eventos UI ===
    btnBack.addEventListener("click", () => {
        readerCard.classList.add("d-none");
        // opcional: desconectar observer e liberar memória
        if (observer) observer.disconnect();
        pdfDoc = null;
        currentBook = null;
        viewer.innerHTML = "";
    });

    btnFullscreen.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await readerCard.requestFullscreen();
                readerCard.classList.add("fullscreen");
            } else {
                await document.exitFullscreen();
                readerCard.classList.remove("fullscreen");
            }
        } catch (err) {
            console.warn("Falha fullscreen:", err);
        }
    });

    btnZoomIn.addEventListener("click", () => {
        zoomFactor = Math.min(zoomFactor + 0.15, 3.0);
        rerenderVisiblePages();
    });
    btnZoomOut.addEventListener("click", () => {
        zoomFactor = Math.max(zoomFactor - 0.15, 0.5);
        rerenderVisiblePages();
    });

    btnFit.addEventListener("click", () => {
        // ajustar baseScale para preencher largura: recalc e re-render
        baseScale = 1.0;
        rerenderVisiblePages();
    });

    // atualizar progresso ao rolar no viewer (debounce)
    let scrollTimeout = null;
    viewer.addEventListener("scroll", () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            updateProgress();
        }, 120);
    }, { passive: true });

    // botão biblioteca
    btnOpenLibrary.addEventListener("click", () => {
        // scroll para biblioteca
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // redimensionamento: atualiza escala base e re-render das páginas visíveis
    let resizeTimeout = null;
    window.addEventListener("resize", () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            baseScale = computeBaseScale();
            rerenderVisiblePages();
        }, 220);
    });

    // inicializa
    buildLibrary();

})();