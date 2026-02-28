// assets/js/reader.js
(() => {
  const viewer = document.getElementById("pdf-viewer");
  const btnBack = document.getElementById("btn-back");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnFit = document.getElementById("btn-fit");
  const btnDownload = document.getElementById("btn-download");
  const btnPrint = document.getElementById("btn-print");
  const progressEl = document.getElementById("progress");
  const pageInfoEl = document.getElementById("page-info");
  const readerCard = document.getElementById("reader-wrapper");
  const gotoPageEl = document.getElementById("goto-page");

  if (!window.pdfjsLib) {
    viewer.innerHTML = "<div class='warn'>PDF.js não carregou</div>";
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDoc = null;
  let zoomFactor = 1.0;
  let renderedPages = new Set();
  let observer = null;

  function getParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  const currentFile = decodeURIComponent(getParam("file") || "");
  if (!currentFile) {
    viewer.innerHTML = "<div class='warn'>Nenhum PDF selecionado</div>";
    return;
  }

  btnBack.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  function openPDF() {
    const url = `books/${currentFile}`;

    btnDownload.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFile;
      a.click();
    });

    btnPrint.addEventListener("click", () => {
      window.open(url, "_blank").print();
    });

    pdfjsLib.getDocument(url).promise.then(pdf => {
      pdfDoc = pdf;

      for (let i = 1; i <= pdf.numPages; i++) {
        const pageDiv = document.createElement("div");
        pageDiv.className = "pdf-page";
        pageDiv.dataset.page = i;

        const canvas = document.createElement("canvas");
        pageDiv.appendChild(canvas);
        viewer.appendChild(pageDiv);
      }

      observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const n = parseInt(e.target.dataset.page, 10);
            if (!renderedPages.has(n)) renderPage(n);
          }
        });
      }, {
        root: viewer,
        rootMargin: "800px 0px",
        threshold: 0.1
      });

      document.querySelectorAll(".pdf-page")
        .forEach(p => observer.observe(p));

      const saved = parseInt(localStorage.getItem(`page-${currentFile}`) || "1", 10);
      setTimeout(() => {
        const el = document.querySelector(`[data-page="${saved}"]`);
        if (el) el.scrollIntoView();
      }, 300);
    });
  }

  function renderPage(pageNum) {
    if (renderedPages.has(pageNum)) return;

    pdfDoc.getPage(pageNum).then(page => {
      const wrapper = document.querySelector(`[data-page="${pageNum}"]`);
      const canvas = wrapper.querySelector("canvas");

      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(window.innerWidth * 0.96, 900) * zoomFactor;
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = "100%";

      page.render({
        canvasContext: canvas.getContext("2d"),
        viewport
      }).promise.then(() => {
        renderedPages.add(pageNum);
        updateProgress();
      });
    });
  }

  function updateProgress() {
    const pages = document.querySelectorAll(".pdf-page");
    if (!pages.length) return;

    let best = 1;
    let bestDist = Infinity;
    const center = viewer.getBoundingClientRect().top + viewer.clientHeight / 2;

    pages.forEach(p => {
      const r = p.getBoundingClientRect();
      const d = Math.abs((r.top + r.height / 2) - center);
      if (d < bestDist) {
        bestDist = d;
        best = parseInt(p.dataset.page, 10);
      }
    });

    progressEl.innerText = Math.floor((best / pdfDoc.numPages) * 100) + "%";
    pageInfoEl.innerText = `Página ${best} / ${pdfDoc.numPages}`;
    localStorage.setItem(`page-${currentFile}`, best);
  }

  viewer.addEventListener("scroll", () => {
    clearTimeout(viewer._t);
    viewer._t = setTimeout(updateProgress, 120);
  }, { passive: true });

  btnZoomIn.addEventListener("click", () => {
    zoomFactor = Math.min(zoomFactor + 0.15, 3);
    rerender();
  });

  btnZoomOut.addEventListener("click", () => {
    zoomFactor = Math.max(zoomFactor - 0.15, 0.5);
    rerender();
  });

  btnFit.addEventListener("click", () => {
    zoomFactor = 1;
    rerender();
  });

  function rerender() {
    if (observer) observer.disconnect();
    renderedPages.clear();
    viewer.querySelectorAll("canvas").forEach(c => c.remove());
    viewer.innerHTML = "";
    openPDF();
  }

  btnFullscreen.addEventListener("click", async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      readerCard.requestFullscreen?.();
    }
  });

  gotoPageEl?.addEventListener("change", e => {
    const n = parseInt(e.target.value, 10);
    if (!isNaN(n)) {
      const el = document.querySelector(`[data-page="${n}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  });

  openPDF();
})();