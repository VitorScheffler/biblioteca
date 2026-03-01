// assets/js/reader.js
// Leitor PDF com: simulated-fullscreen (iOS friendly) + dark mode + zoom + altura correta em iOS

const params = new URLSearchParams(window.location.search);
const file = params.get("file");
const container = document.getElementById("pdfViewer");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const toggleFullBtn = document.getElementById("toggleFull");
const toggleDarkBtn = document.getElementById("toggleDark");
const nav = document.querySelector(".reader-nav");

if (!file) {
  container.innerHTML = "<p class='text-center p-3'>PDF não informado</p>";
  throw new Error("PDF não informado");
}

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let scale = window.innerWidth < 768 ? 1.05 : 1.3;
let pdfDoc = null;
let isSimFull = localStorage.getItem("reader-sim-full") === "true";
let darkMode = localStorage.getItem("reader-dark") === "true";

// Ajusta a altura do viewer para evitar o "endereço bar" do iOS
function setViewerHeight() {
  // usa innerHeight, que muda conforme a barra do Safari aparece/some
  const h = window.innerHeight;
  container.style.height = h + "px";
  // opcional: empurra o conteúdo pra baixo da safe-area
  container.style.paddingTop = "env(safe-area-inset-top)";
}
window.addEventListener("resize", setViewerHeight);
window.addEventListener("orientationchange", () => {
  // dá um pequeno delay para o mobile recalcular a altura
  setTimeout(setViewerHeight, 300);
});
setViewerHeight();

// Aplica o modo escuro (classe no body)
function applyDarkMode() {
  if (darkMode) {
    document.body.classList.add("dark");
    toggleDarkBtn.setAttribute("aria-pressed", "true");
  } else {
    document.body.classList.remove("dark");
    toggleDarkBtn.setAttribute("aria-pressed", "false");
  }
}
applyDarkMode();

// Aplica a simulação de tela cheia (classe no body)
function applySimFull() {
  if (isSimFull) {
    document.body.classList.add("sim-full");
    toggleFullBtn.setAttribute("aria-pressed", "true");
    // esconder nav se quiser leitura limpa
    nav.classList.add("hidden-in-simfull");
  } else {
    document.body.classList.remove("sim-full");
    toggleFullBtn.setAttribute("aria-pressed", "false");
    nav.classList.remove("hidden-in-simfull");
  }
}
applySimFull();

// Renderiza o PDF (renderiza todas as páginas em canvas)
// Nota: para documentos muito grandes é recomendado lazy-loading, que posso adicionar.
function renderPDF() {
  container.innerHTML = "";
  pdfjsLib.getDocument(file).promise.then(pdf => {
    pdfDoc = pdf;
    for (let i = 1; i <= pdf.numPages; i++) {
      pdf.getPage(i).then(page => {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // define tamanho do canvas para render nativo; depois usa CSS para responsividade
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "pdf-page";

        // deixa responsivo (reduz se cabe na tela)
        canvas.style.maxWidth = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";

        container.appendChild(canvas);
        page.render({ canvasContext: ctx, viewport }).promise.then(() => {
          // se o dark mode estiver ativo, a regra CSS cuida do visual (ou podemos aplicar filtro aqui)
        });
      });
    }
  }).catch(err => {
    container.innerHTML = `<p class="p-3 text-center text-danger">Erro ao abrir PDF: ${err.message}</p>`;
    console.error(err);
  });
}

// controles
zoomInBtn.addEventListener("click", () => {
  scale = Math.min(3, scale + 0.2);
  renderPDF();
});

zoomOutBtn.addEventListener("click", () => {
  scale = Math.max(0.6, scale - 0.2);
  renderPDF();
});

toggleDarkBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("reader-dark", darkMode ? "true" : "false");
  applyDarkMode();
});

toggleFullBtn.addEventListener("click", () => {
  // tentamos requestFullscreen primeiro (p/ browsers que suportam)
  const el = document.documentElement;
  if (document.fullscreenEnabled) {
    // navegadores que suportam: usa api nativa
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(()=>{/* ignore */});
    } else {
      document.exitFullscreen?.();
    }
  } else {
    // fallback / iOS: simular fullscreen via CSS
    isSimFull = !isSimFull;
    localStorage.setItem("reader-sim-full", isSimFull ? "true" : "false");
    applySimFull();
    // ao simular, rola o viewport pro topo para esconder barras
    if (isSimFull) {
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
});

// fecha simulated fullscreen se usuário apertar ESC (no desktop)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (document.fullscreenElement) document.exitFullscreen?.();
    if (isSimFull) {
      isSimFull = false;
      localStorage.setItem("reader-sim-full", "false");
      applySimFull();
    }
  }
});

// Inicializa
renderPDF();

// Acessibilidade: toque duplo no container alterna UI (ex.: esconde/mostra nav)
let lastTap = 0;
container.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTap < 300) {
    // double-tap detectado
    isSimFull = !isSimFull;
    localStorage.setItem("reader-sim-full", isSimFull ? "true" : "false");
    applySimFull();
  }
  lastTap = now;
});