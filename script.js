const upload = document.getElementById("upload");
const statusText = document.getElementById("status");

upload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  statusText.innerText = "Processing...";

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let rows = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const lines = content.items.map(i => i.str).join(" ");
    const split = lines.split(/(?=\d+\s+(97|BK))/);

    split.forEach(line => {
      const clean = line.trim();
      if (!/^\d+\s/.test(clean)) return;

      const tokens = clean.split(/\s+/);

      if (tokens.length < 8) return;

      const disc = tokens.pop();
      const price = tokens.pop();
      const curr = tokens.pop();
      const qty = tokens.pop();

      const slNo = tokens.shift();
      const isbn = tokens.shift(); // removed

      const publisher = tokens.slice(-2).join(" ");
      const author = tokens.slice(-4, -2).join(" ");
      const title = tokens.slice(0, -4).join(" ");

      rows.push({
        slNo,
        title,
        author,
        publisher,
        qty,
        curr,
        price,
        disc
      });
    });
  }

  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const newPdf = await PDFDocument.create();
  const font = await newPdf.embedFont(StandardFonts.Helvetica);

  let page = newPdf.addPage();
  const { width, height } = page.getSize();

  let y = height - 50;

  page.drawText("PURCHASE ORDER", {
    x: 50,
    y,
    size: 16,
    font
  });

  y -= 40;

  const headers = ["Sl No", "Title", "Author", "Publisher", "Qty", "Curr", "Price", "Disc%"];
  const colWidths = [40, 200, 100, 120, 40, 40, 60, 50];

  let x = 40;

  headers.forEach((h, i) => {
    page.drawText(h, { x, y, size: 10, font });
    x += colWidths[i];
  });

  y -= 15;

  for (let r of rows) {
    if (y < 50) {
      page = newPdf.addPage();
      y = height - 50;
    }

    x = 40;

    const values = [
      r.slNo,
      r.title.substring(0, 40),
      r.author,
      r.publisher,
      r.qty,
      r.curr,
      r.price,
      r.disc
    ];

    values.forEach((val, i) => {
      page.drawText(String(val), { x, y, size: 9, font });
      x += colWidths[i];
    });

    y -= 15;
  }

  const pdfBytes = await newPdf.save();

  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "cleaned_PO.pdf";
  link.click();

  statusText.innerText = "Done ✅ Downloaded.";
});
