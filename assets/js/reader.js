(() => {
  const viewer = document.getElementById("pdf-viewer");
  const reader = document.getElementById("reader-wrapper");
  const btnBack = document.getElementById("btn-back");
  const btnNight = document.getElementById("btn-night");
  const btnFs = document.getElementById("btn-fullscreen");
  const navbar = document.querySelector(".navbar");

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDoc = null;
  let rendered = new Set();
  let zoom = 1;
  let lastScroll = 0;

  const file = new URL(location.href).searchParams.get("file");
  if (!file) return;

  btnBack.onclick = () => location.href = "index.html";

  btnNight.onclick = () => {
    reader.classList.toggle("night-mode");
    localStorage.setItem("night",
      reader.classList.contains("night-mode"));
  };

  if (localStorage.getItem("night") === "true") {
    reader.classList.add("night-mode");
  }

  btnFs.onclick = () => {
    reader.requestFullscreen?.();
  };

  viewer.addEventListener("scroll", () => {
    const st = viewer.scrollTop;
    if (st > lastScroll + 10) navbar.classList.add("hide");
    if (st < lastScroll - 10) navbar.classList.remove("hide");
    lastScroll = st;
  }, { passive: true });

  pdfjsLib.getDocument(`books/${file}`).promise.then(pdf => {
    pdfDoc = pdf;

    for (let i = 1; i <= pdf.numPages; i++) {
      const div = document.createElement("div");
      div.className = "pdf-page";
      div.dataset.page = i;
      div.innerHTML = "<canvas></canvas>";
      viewer.appendChild(div);
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) renderPage(+e.target.dataset.page);
      });
    }, { root: viewer, rootMargin: "600px" });

    document.querySelectorAll(".pdf-page").forEach(p => io.observe(p));
  });

  function renderPage(n) {
    if (rendered.has(n)) return;

    pdfDoc.getPage(n).then(page => {
      const canvas = document.querySelector(`[data-page="${n}"] canvas`);
      const base = page.getViewport({ scale: 1 });

      const width = Math.min(innerWidth * 0.96, 900) * zoom;
      const scale = width / base.width;
      const vp = page.getViewport({ scale });

      const dpr = Math.min(devicePixelRatio || 1, 2);

      canvas.width = vp.width * dpr;
      canvas.height = vp.height * dpr;
      canvas.style.width = vp.width + "px";
      canvas.style.height = vp.height + "px";

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      page.render({ canvasContext: ctx, viewport: vp });
      rendered.add(n);
    });
  }
})();