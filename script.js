const uploadInput = document.getElementById("pdfUpload");
const statusText = document.getElementById("status");

uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  statusText.innerText = "Processing PDF...";

  const arrayBuffer = await file.arrayBuffer();

  // Load original PDF using pdf-lib
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  // Load with PDF.js to extract text positions
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let isbnColumnX = null;

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex + 1);
    const textContent = await page.getTextContent();

    // Detect ISBN column X position from header
    textContent.items.forEach(item => {
      if (item.str.trim() === "ISBN/Code") {
        isbnColumnX = item.transform[4];
      }
    });
  }

  if (isbnColumnX === null) {
    statusText.innerText = "ISBN column not found.";
    return;
  }

  const isbnMinX = isbnColumnX - 5;
  const isbnMaxX = isbnColumnX + 80;

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex + 1);
    const textContent = await page.getTextContent();
    const pdfLibPage = pages[pageIndex];

    textContent.items.forEach(item => {
      const text = item.str.trim();
      const x = item.transform[4];
      const y = item.transform[5];

      const isInColumn = x >= isbnMinX && x <= isbnMaxX;
      const isBK = /^BK\s?\d+$/i.test(text);
      const isISBN = /97[89]\d{10}/.test(text);

      if (isInColumn || isBK || isISBN) {
        // Draw white rectangle over the text to remove it
        pdfLibPage.drawRectangle({
          x: x,
          y: y - 2,
          width: item.width,
          height: item.height + 4,
          color: rgb(1, 1, 1),
        });
      }
    });
  }

  const pdfBytes = await pdfDoc.save();

  // Auto download
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "cleaned.pdf";
  link.click();

  statusText.innerText = "Done ✅ Downloaded automatically.";
});
