(() => {
  const viewer = document.getElementById("pdf-viewer");
  const back = document.getElementById("btn-back");
  const pageInfo = document.getElementById("page-info");

  back.onclick = () => location.href = "index.html";

  const params = new URLSearchParams(location.search);
  const file = params.get("file");
  if (!file) return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDoc;
  let progress = {};

  async function loadProgress() {
    const res = await fetch("/api/progress");
    progress = await res.json();
  }

  async function saveProgress(page) {
    progress[file] = {
      page,
      updated: new Date().toISOString()
    };

    fetch("/api/progress", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(progress)
});
  }

  pdfjsLib.getDocument(`books/${file}`).promise.then(async pdf => {
    pdfDoc = pdf;
    await loadProgress();

    for (let i = 1; i <= pdf.numPages; i++) {
      const div = document.createElement("div");
      div.className = "pdf-page";
      div.dataset.page = i;
      div.innerHTML = "<canvas></canvas>";
      viewer.appendChild(div);
    }

    if (progress[file]?.page) {
      setTimeout(() => {
        document
          .querySelector(`[data-page="${progress[file].page}"]`)
          ?.scrollIntoView({ behavior: "auto" });
      }, 300);
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;

        const pageNum = +e.target.dataset.page;
        renderPage(pageNum);
        saveProgress(pageNum);

        pageInfo.textContent =
          `Página ${pageNum} / ${pdfDoc.numPages}`;
      });
    }, {
      root: viewer,
      rootMargin: "600px"
    });

    document.querySelectorAll(".pdf-page")
      .forEach(p => observer.observe(p));
  });

  function renderPage(n) {
    const canvas = document.querySelector(
      `[data-page="${n}"] canvas`
    );
    if (canvas.dataset.rendered) return;
    canvas.dataset.rendered = "1";

    pdfDoc.getPage(n).then(page => {
      const vp = page.getViewport({ scale: 1.4 });
      const dpr = Math.min(devicePixelRatio || 1, 2);

      canvas.width = vp.width * dpr;
      canvas.height = vp.height * dpr;
      canvas.style.width = vp.width + "px";

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      page.render({ canvasContext: ctx, viewport: vp });
    });
  }
})();