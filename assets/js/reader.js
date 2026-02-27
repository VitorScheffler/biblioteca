// assets/js/reader.js
(() => {
  // elementos
  const viewer = document.getElementById("pdf-viewer");
  const btnBack = document.getElementById("btn-back");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnFit = document.getElementById("btn-fit");
  const progressEl = document.getElementById("progress");
  const pageInfoEl = document.getElementById("page-info");
  const readerCard = document.getElementById("reader-wrapper");

  // PDF.js check
  if (!window.pdfjsLib) {
    viewer.innerHTML = '<div class="warn">PDF.js não carregou. Verifique CDN ou baixe localmente.</div>';
    console.warn("pdfjsLib não encontrado");
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // estado
  let pdfDoc = null;
  let currentFile = null;
  let zoomFactor = 1.0;
  let renderedPages = new Set();
  let observer = null;

  // lê param ?file=
  function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  const file = getParam('file');
  if (!file) {
    viewer.innerHTML = '<div class="warn">Nenhum arquivo selecionado. Volte para a biblioteca.</div>';
    return;
  }
  currentFile = decodeURIComponent(file);

  // voltar para biblioteca
  btnBack.addEventListener("click", () => { window.location.href = 'index.html'; });

  // carregar PDF
  function openPDF() {
    const url = `books/${currentFile}`;
    pdfjsLib.getDocument(url).promise.then(pdf => {
      pdfDoc = pdf;
      // criar placeholders
      for (let i=1;i<=pdfDoc.numPages;i++){
        const wrapper = document.createElement("div");
        wrapper.className = "pdf-page";
        wrapper.dataset.page = i;
        const canvas = document.createElement("canvas");
        canvas.dataset.rendered = "false";
        wrapper.appendChild(canvas);
        viewer.appendChild(wrapper);
      }

      // observe com root=viewer
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const wrapper = entry.target;
            const pageNum = parseInt(wrapper.dataset.page,10);
            if (!renderedPages.has(pageNum)) renderPage(pageNum);
          }
        });
      }, { root: viewer, rootMargin: '800px 0px 800px 0px', threshold: 0.1 });

      document.querySelectorAll('.pdf-page').forEach(w => observer.observe(w));

      // scroll até a página salva
      const saved = parseInt(localStorage.getItem(`page-${currentFile}`) || "1", 10);
      setTimeout(()=> {
        const el = document.querySelector(`[data-page="${saved}"]`);
        if (el) el.scrollIntoView({block:'start', behavior:'auto'});
        updateProgress();
      }, 300);

    }).catch(err => {
      console.error("Erro ao abrir PDF", err);
      viewer.innerHTML = `<div class="warn">Erro ao carregar PDF (veja console)</div>`;
    });
  }

  // render page
  function renderPage(pageNum){
    if (!pdfDoc) return;
    if (renderedPages.has(pageNum)) return;

    const wrapper = document.querySelector(`[data-page="${pageNum}"]`);
    const canvas = wrapper.querySelector('canvas');
    canvas.dataset.rendered = "true";

    pdfDoc.getPage(pageNum).then(page => {
      // calcular escala: target width = min(window width * 0.96, 900) * zoomFactor
      const targetWidth = Math.min(window.innerWidth * 0.96, 900) * zoomFactor;
      const viewport0 = page.getViewport({ scale: 1.0 });
      const scale = (targetWidth / viewport0.width);
      const vp = page.getViewport({ scale });

      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const ctx = canvas.getContext('2d');
      page.render({ canvasContext: ctx, viewport: vp }).promise.then(() => {
        renderedPages.add(pageNum);
        updateProgress();
      }).catch(err => console.warn('render error', err));
    });
  }

  // atualizar progresso baseado na página mais central visível
  function updateProgress(){
    if (!pdfDoc) return;
    const pages = Array.from(document.querySelectorAll('.pdf-page'));
    if (!pages.length) return;

    const viewerRect = viewer.getBoundingClientRect();
    const viewerCenter = viewerRect.top + viewerRect.height/2;

    let bestPage = 1;
    let bestDist = Infinity;
    pages.forEach(p => {
      const r = p.getBoundingClientRect();
      const center = r.top + r.height/2;
      const dist = Math.abs(center - viewerCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestPage = parseInt(p.dataset.page,10);
      }
    });

    const percent = Math.floor((bestPage / pdfDoc.numPages) * 100);
    progressEl.innerText = percent + '%';
    pageInfoEl.innerText = `Página ${bestPage} / ${pdfDoc.numPages}`;
    localStorage.setItem(`page-${currentFile}`, bestPage);
  }

  // scroll listener (debounced)
  let st = null;
  viewer.addEventListener('scroll', () => {
    if (st) clearTimeout(st);
    st = setTimeout(updateProgress, 120);
  }, { passive:true });

  // zoom controls
  btnZoomIn.addEventListener('click', () => { zoomFactor = Math.min(zoomFactor + 0.15, 3.0); rerenderPages(); });
  btnZoomOut.addEventListener('click', () => { zoomFactor = Math.max(zoomFactor - 0.15, 0.5); rerenderPages(); });
  btnFit.addEventListener('click', () => { zoomFactor = 1.0; rerenderPages(); });

  function rerenderPages(){
    // desconecta observer
    if (observer) observer.disconnect();
    renderedPages.clear();
    // recria canvas (force)
    document.querySelectorAll('.pdf-page').forEach(p => {
      const old = p.querySelector('canvas');
      const n = document.createElement('canvas');
      n.dataset.rendered = "false";
      p.replaceChild(n, old);
    });
    // re-observe e render novamente quando visível
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.dataset.page,10);
          if (!renderedPages.has(pageNum)) renderPage(pageNum);
        }
      });
    }, { root: viewer, rootMargin: '800px 0px 800px 0px', threshold: 0.1 });
    document.querySelectorAll('.pdf-page').forEach(w => observer.observe(w));
  }

  // FULLSCREEN handling (robusto, com fallback simulado)
  async function enterFullscreen() {
    try {
      // tentativa padrão
      if (readerCard.requestFullscreen) {
        await readerCard.requestFullscreen();
        readerCard.classList.add('fullscreen');
        return true;
      }
      // vendor-prefixed
      if (readerCard.webkitRequestFullscreen) { readerCard.webkitRequestFullscreen(); readerCard.classList.add('fullscreen'); return true; }
      if (readerCard.msRequestFullscreen) { readerCard.msRequestFullscreen(); readerCard.classList.add('fullscreen'); return true; }
      // tentar no documentElement
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        readerCard.classList.add('fullscreen');
        return true;
      }
    } catch (err) {
      console.warn('Fullscreen API erro:', err);
    }

    // FALLBACK SIMULADO (para iOS/Safari e outros)
    simulateFullscreen();
    return false;
  }

  function exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (err) {
      console.warn('exitFullscreen error', err);
    }
    // remover classes/fallback
    readerCard.classList.remove('fullscreen');
    document.body.style.overflow = '';
    readerCard.classList.remove('simulated-fullscreen');
  }

  function simulateFullscreen(){
    // adiciona classe que fixa o leitor na tela e impede scroll no body
    readerCard.classList.add('simulated-fullscreen');
    document.body.style.overflow = 'hidden';
    // rolar o readerCard para topo
    readerCard.scrollIntoView({behavior:'auto'});
  }

  // toggle fullscreen
  let isSimFullscreen = false;
  btnFullscreen.addEventListener('click', async () => {
    // se já em Fullscreen (API) ou simulated
    if (document.fullscreenElement || readerCard.classList.contains('simulated-fullscreen')) {
      exitFullscreen();
      return;
    }
    await enterFullscreen();
  });

  // ao sair do fullscreen via UI do navegador, limpamos classes
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      readerCard.classList.remove('fullscreen');
    }
  });

  // resize: refaz render das páginas visíveis
  let rt = null;
  window.addEventListener('resize', () => {
    if (rt) clearTimeout(rt);
    rt = setTimeout(() => {
      rerenderPages();
    }, 200);
  });

  // iniciar
  openPDF();

})();