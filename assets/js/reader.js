const params = new URLSearchParams(window.location.search);
const file = params.get("file");
const container = document.getElementById("pdfViewer");

if (!file) {
  container.innerHTML = "<p class='text-center p-3'>PDF não informado</p>";
  throw new Error("PDF não informado");
}

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let scale = window.innerWidth < 768 ? 1.1 : 1.4;

function renderPDF() {
  container.innerHTML = "";

  pdfjsLib.getDocument(file).promise.then(pdf => {
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      pdf.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "pdf-page";

        container.appendChild(canvas);
        page.render({ canvasContext: ctx, viewport });
      });
    }
  });
}

renderPDF();

document.getElementById("zoomIn").onclick = () => {
  scale += 0.2;
  renderPDF();
};

document.getElementById("zoomOut").onclick = () => {
  scale = Math.max(0.8, scale - 0.2);
  renderPDF();
};

document.getElementById("fullscreen").onclick = () => {
  if (container.requestFullscreen) container.requestFullscreen();
};