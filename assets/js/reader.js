// assets/js/reader.js (ATUALIZADO — qualidade melhorada para telas retina)
// Render com PDF.js + lazy rendering + scaling para devicePixelRatio (retina)
// Observação: aumentar muito o outputScale melhora qualidade, mas consome memória/CPU.
// Recomendo maxOutputScale entre 1.5 e 2.0 (2 é bom para a maioria dos iPhones).

// Elementos
const params = new URLSearchParams(window.location.search);
const file = params.get("file");
const container = document.getElementById("pdfViewer");
const titleDisplay = document.getElementById("titleDisplay");
const pageIndicator = document.getElementById("pageIndicator");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const toggleDarkBtn = document.getElementById("toggleDark");
const toggleFullBtn = document.getElementById("toggleFull");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

if (!file) {
  container.innerHTML = "<p class='p-3 text-center text-danger'>PDF não informado</p>";
  throw new Error("PDF não informado");
}

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let pdfDoc = null;
let scale = parseFloat(localStorage.getItem("reader-scale")) || (window.innerWidth < 768 ? 1.05 : 1.3);
let currentPage = parseInt(localStorage.getItem("reader-page")) || 1;
let renderedPages = new Set();
let darkMode = localStorage.getItem("reader-dark") === "true";
let isSimFull = localStorage.getItem("reader-sim-full") === "true";

// Limitador de output scale (retina)
const maxOutputScale = 2.0; // ajuste aqui: 1.5 ~ 2.0 é bom (2 fornece boa nitidez em retina)
// função que retorna outputScale útil (devicePixelRatio limitado)
function getOutputScale() {
  const dpr = window.devicePixelRatio || 1;
  // limita pra evitar uso excessivo de memória em telas muito densas
  return Math.min(dpr, maxOutputScale);
}

// Ajusta a altura do viewer para evitar iOS address bar issues
function setViewerHeight(){
  container.style.height = window.innerHeight + "px";
}
window.addEventListener("resize", setViewerHeight);
window.addEventListener("orientationchange", () => setTimeout(setViewerHeight, 300));
setViewerHeight();

// apply dark mode
function applyDark() {
  document.body.classList.toggle("dark", darkMode);
  toggleDarkBtn?.setAttribute("aria-pressed", darkMode ? "true" : "false");
}
applyDark();

// apply simulated fullscreen
function applySimFull() {
  document.body.classList.toggle("sim-full", isSimFull);
  toggleFullBtn?.setAttribute("aria-pressed", isSimFull ? "true" : "false");
}
applySimFull();

// show title from filename if available
titleDisplay.textContent = decodeURIComponent((file.split("/").pop() || "PDF").replace(/\+/g," "));

// --------------------------------------------------
// loadAndRender: cria wrappers e observa visibilidade
// --------------------------------------------------
async function loadAndRender() {
  container.innerHTML = "";
  renderedPages.clear();
  pageIndicator.textContent = "Carregando...";
  try {
    pdfDoc = await pdfjsLib.getDocument(file).promise;
    updatePageIndicator();
    // create wrappers for each page
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "page-wrapper";
      pageWrapper.dataset.pageNumber = i;
      pageWrapper.style.minHeight = "60px"; // placeholder height
      container.appendChild(pageWrapper);
    }

    // IntersectionObserver para render only when visible
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const wrapper = entry.target;
          const p = Number(wrapper.dataset.pageNumber);
          if (!renderedPages.has(p)) renderPage(p, wrapper);
        }
      });
    }, { root: container, rootMargin: '600px' }); // rootMargin maior para carregar antes

    document.querySelectorAll(".page-wrapper").forEach(el => io.observe(el));
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="p-3 text-center text-danger">Erro ao abrir PDF: ${err.message}</p>`;
  }
}

// --------------------------------------------------
// renderPage: renderiza uma página com scaling DPR
// --------------------------------------------------
async function renderPage(pageNum, wrapper) {
  if (!pdfDoc) return;
  wrapper.innerHTML = ""; // limpa placeholder

  try {
    const page = await pdfDoc.getPage(pageNum);

    // viewport com a escala desejada (visível)
    const viewport = page.getViewport({ scale });

    // outputScale (para nitidez em telas retina)
    const outputScale = getOutputScale();

    // canvas em alta resolução: largura/altura * outputScale
    const canvas = document.createElement("canvas");
    canvas.className = "pdf-page";
    const context = canvas.getContext("2d", { alpha: false });

    // dimensões físicas do canvas (pixels reais)
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);

    // CSS tamanho (o que o usuário vê) = tamanho do viewport (sem DPR)
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    // configura transformação para que o desenho seja escalado corretamente
    context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    wrapper.appendChild(canvas);

    // Renderiza usando viewport "normal" (scale) — como usamos setTransform, passar viewport é ok.
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // marca como renderizada
    renderedPages.add(pageNum);

    // atualiza currentPage heurístico (se for a primeira página visível)
    const firstVisible = currentPage === pageNum || !currentPage;
    if (firstVisible) {
      currentPage = pageNum;
      saveProgress();
      updatePageIndicator();
    }
  } catch (err) {
    console.error("Erro renderizando página", pageNum, err);
  }
}

// update page indicator
function updatePageIndicator() {
  if (!pdfDoc) { pageIndicator.textContent = "—"; return; }
  pageIndicator.textContent = `Página ${currentPage} / ${pdfDoc.numPages}`;
}

// save current page and scale
function saveProgress(){
  localStorage.setItem("reader-page", currentPage);
  localStorage.setItem("reader-scale", scale);
}

// next / prev navigation (scroll to wrapper)
function goToPage(n) {
  if (!pdfDoc) return;
  n = Math.min(Math.max(1, n), pdfDoc.numPages);
  const wrapper = document.querySelector(`.page-wrapper[data-page-number='${n}']`);
  if (wrapper) {
    wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    currentPage = n;
    saveProgress();
    updatePageIndicator();
  }
}

prevBtn?.addEventListener("click", () => goToPage(currentPage - 1));
nextBtn?.addEventListener("click", () => goToPage(currentPage + 1));

// zoom handlers (re-render pages when zoom changes)
let zoomTimeout;
function setScale(newScale) {
  scale = Math.min(3, Math.max(0.6, newScale));
  localStorage.setItem("reader-scale", scale);
  // clear all render and reinitialize (throttle to avoid many re-renders)
  if (pdfDoc) {
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => loadAndRender(), 220);
  }
}
zoomInBtn?.addEventListener("click", () => setScale(scale + 0.2));
zoomOutBtn?.addEventListener("click", () => setScale(scale - 0.2));

// dark toggle
toggleDarkBtn?.addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("reader-dark", darkMode);
  applyDark();
});

// fullscreen toggle: try native first then simulated
toggleFullBtn?.addEventListener("click", async () => {
  if (document.fullscreenEnabled) {
    if (!document.fullscreenElement) {
      try { await document.documentElement.requestFullscreen(); }
      catch (e) { /* ignore */ }
    } else {
      try { await document.exitFullscreen(); }
      catch(e) {}
    }
  } else {
    isSimFull = !isSimFull;
    localStorage.setItem("reader-sim-full", isSimFull);
    applySimFull();
    if (isSimFull) window.scrollTo({ top:0, behavior:"instant" });
  }
});

// esc to exit simulated fullscreen
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.fullscreenElement) document.exitFullscreen();
    if (isSimFull) {
      isSimFull = false;
      localStorage.setItem("reader-sim-full", "false");
      applySimFull();
    }
  }
});

// double-tap toggles sim-full (mobile)
let lastTap = 0;
container.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTap < 300) {
    isSimFull = !isSimFull;
    localStorage.setItem("reader-sim-full", isSimFull);
    applySimFull();
  }
  lastTap = now;
});

// track scroll to update currentPage (approx: first visible page)
container.addEventListener("scroll", () => {
  const wrappers = Array.from(document.querySelectorAll(".page-wrapper"));
  for (let w of wrappers) {
    const rect = w.getBoundingClientRect();
    if (rect.top >= 60 && rect.top < window.innerHeight/2) {
      const p = Number(w.dataset.pageNumber);
      if (p && p !== currentPage) {
        currentPage = p;
        saveProgress();
        updatePageIndicator();
      }
      break;
    }
  }
});

// initialize
loadAndRender();