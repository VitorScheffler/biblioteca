// assets/js/reader.js
// Leitor PDF: PDF.js + lazy render por página + DPR scaling (retina) + simulated fullscreen (iOS) + dark mode
// Comentários inline para facilitar manutenção.

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

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let pdfDoc = null;
let scale = parseFloat(localStorage.getItem("reader-scale")) || (window.innerWidth < 768 ? 1.05 : 1.25);
let currentPage = parseInt(localStorage.getItem("reader-page")) || 1;
let renderedPages = new Set();
let darkMode = localStorage.getItem("reader-dark") === "true";
let isSimFull = localStorage.getItem("reader-sim-full") === "true";

// DPR limiter (evita usar DPR muito alto)
const maxOutputScale = 2.0;
function getOutputScale(){ const dpr = window.devicePixelRatio || 1; return Math.min(dpr, maxOutputScale); }

// ajuste de altura do viewer para iOS address bar
function setViewerHeight(){ container.style.height = window.innerHeight + "px"; }
window.addEventListener("resize", setViewerHeight);
window.addEventListener("orientationchange", ()=> setTimeout(setViewerHeight,300));
setViewerHeight();

// aplica dark / sim-full
function applyDark(){ document.body.classList.toggle("dark", darkMode); toggleDarkBtn?.setAttribute("aria-pressed", darkMode ? "true" : "false"); }
function applySimFull(){ document.body.classList.toggle("sim-full", isSimFull); toggleFullBtn?.setAttribute("aria-pressed", isSimFull ? "true" : "false"); }
applyDark(); applySimFull();

// exibe título
titleDisplay.textContent = decodeURIComponent((file.split("/").pop() || "PDF").replace(/\+/g," "));

// cria wrappers e observer
async function loadAndRender(){
  container.innerHTML = ""; renderedPages.clear();
  pageIndicator.textContent = "Carregando...";
  try{
    pdfDoc = await pdfjsLib.getDocument(file).promise;
    updatePageIndicator();
    // criar placeholders
    for(let i=1;i<=pdfDoc.numPages;i++){
      const wrapper = document.createElement("div");
      wrapper.className = "page-wrapper";
      wrapper.dataset.pageNumber = i;
      // opcional: altura mínima para evitar salto visual
      wrapper.style.minHeight = "80px";
      container.appendChild(wrapper);
    }
    // observer: renderiza quando wrapper está visível
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const w = entry.target;
          const p = Number(w.dataset.pageNumber);
          if(!renderedPages.has(p)) renderPage(p, w);
        }
      });
    }, { root: container, rootMargin: '600px' });

    document.querySelectorAll(".page-wrapper").forEach(el => io.observe(el));
  }catch(err){
    console.error(err);
    container.innerHTML = `<p class="p-3 text-center text-danger">Erro ao abrir PDF: ${err.message}</p>`;
  }
}

// renderiza uma página com DPR scaling
async function renderPage(pageNum, wrapper){
  if(!pdfDoc) return;
  wrapper.innerHTML = ""; // limpa placeholder
  try{
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // output scale para nitidez
    const outputScale = getOutputScale();

    // canvas dimensões físicas
    const canvas = document.createElement("canvas");
    canvas.className = "pdf-page";
    const ctx = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);

    // tamanho visível (CSS)
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    // transforma para desenhar em DPR
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    // centraliza: canvas dentro do wrapper (wrapper usa flex center)
    wrapper.appendChild(canvas);

    await page.render({ canvasContext: ctx, viewport }).promise;
    renderedPages.add(pageNum);

    // se for a primeira visível, atualiza currentPage
    if(!currentPage) currentPage = pageNum;
    if(pageNum === currentPage) { saveProgress(); updatePageIndicator(); }
  }catch(err){
    console.error("Erro renderizando página", pageNum, err);
  }
}

function updatePageIndicator(){
  if(!pdfDoc) { pageIndicator.textContent = "—"; return; }
  pageIndicator.textContent = `Página ${currentPage} / ${pdfDoc.numPages}`;
}

function saveProgress(){
  localStorage.setItem("reader-page", currentPage);
  localStorage.setItem("reader-scale", scale);
}

// navegação por página (scroll para wrapper)
function goToPage(n){
  if(!pdfDoc) return;
  n = Math.min(Math.max(1, n), pdfDoc.numPages);
  const wrapper = document.querySelector(`.page-wrapper[data-page-number='${n}']`);
  if(wrapper){
    wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    currentPage = n; saveProgress(); updatePageIndicator();
  }
}
prevBtn?.addEventListener("click", ()=> goToPage(currentPage - 1));
nextBtn?.addEventListener("click", ()=> goToPage(currentPage + 1));

// zoom (re-render com throttle)
let zoomTimeout;
function setScale(newScale){
  scale = Math.min(3, Math.max(0.6, newScale));
  localStorage.setItem("reader-scale", scale);
  if(pdfDoc){
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(()=> loadAndRender(), 220);
  }
}
zoomInBtn?.addEventListener("click", ()=> setScale(scale + 0.2));
zoomOutBtn?.addEventListener("click", ()=> setScale(scale - 0.2));

// toggle dark
toggleDarkBtn?.addEventListener("click", ()=>{
  darkMode = !darkMode;
  localStorage.setItem("reader-dark", darkMode);
  applyDark();
});

// fullscreen: tenta nativo, senão simula (iOS)
toggleFullBtn?.addEventListener("click", async ()=>{
  if(document.fullscreenEnabled){
    if(!document.fullscreenElement){
      try{ await document.documentElement.requestFullscreen(); }catch(e){}
    } else {
      try{ await document.exitFullscreen(); }catch(e){}
    }
  } else {
    isSimFull = !isSimFull;
    localStorage.setItem("reader-sim-full", isSimFull);
    applySimFull();
    if(isSimFull) window.scrollTo({ top:0, behavior:"instant" });
  }
});

// ESC sai do sim-full / full
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    if(document.fullscreenElement) document.exitFullscreen();
    if(isSimFull){ isSimFull = false; localStorage.setItem("reader-sim-full","false"); applySimFull(); }
  }
});

// double-tap para toggle sim-full (mobile)
let lastTap = 0;
container.addEventListener("touchend", (e)=>{
  const now = Date.now();
  if(now - lastTap < 300){
    isSimFull = !isSimFull;
    localStorage.setItem("reader-sim-full", isSimFull);
    applySimFull();
  }
  lastTap = now;
});

// manter currentPage aproximado durante scroll
container.addEventListener("scroll", ()=>{
  const wrappers = Array.from(document.querySelectorAll(".page-wrapper"));
  for(let w of wrappers){
    const rect = w.getBoundingClientRect();
    // consideramos a primeira wrapper cujo topo esteja visível abaixo da nav
    if(rect.top >= 60 && rect.top < window.innerHeight/2){
      const p = Number(w.dataset.pageNumber);
      if(p && p !== currentPage){
        currentPage = p; saveProgress(); updatePageIndicator();
      }
      break;
    }
  }
});

// inicializa
loadAndRender();