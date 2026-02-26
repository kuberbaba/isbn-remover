document.getElementById('pdfInput').addEventListener('change', async function (event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById("status").innerText = "Processing...";

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

  const pages = pdfDoc.getPages();

  pages.forEach(page => {
    const { width, height } = page.getSize();

    // 🔥 ISBN COLUMN MASK AREA (Measured from your sample)
    const xStart = 95;     // Adjust only if needed
    const columnWidth = 95;

    page.drawRectangle({
      x: xStart,
      y: 0,
      width: columnWidth,
      height: height,
      color: PDFLib.rgb(1, 1, 1), // White
    });
  });

  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = "PO_without_ISBN.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  document.getElementById("status").innerText = "Done ✅ Download started.";
});
