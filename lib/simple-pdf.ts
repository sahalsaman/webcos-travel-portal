function ascii(value: unknown) {
  return String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "-");
}

function escapePdf(value: unknown) {
  return ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function pdfLine(text: string, x: number, y: number, size = 10, bold = false, color = "0.15 0.18 0.24") {
  return `${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`;
}

export function buildSinglePagePdf(commands: string[]) {
  return buildMultiPagePdf([commands]);
}

export function buildMultiPagePdf(pages: string[][]) {
  const pageCount = Math.max(1, pages.length);
  const fontRegularRef = pageCount + 3;
  const fontBoldRef = pageCount + 4;
  const firstContentRef = pageCount + 5;
  const pageRefs = Array.from({ length: pageCount }, (_, index) => `${index + 3} 0 R`).join(" ");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>`,
    ...Array.from({ length: pageCount }, (_, index) =>
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularRef} 0 R /F2 ${fontBoldRef} 0 R >> >> /Contents ${firstContentRef + index} 0 R >>`,
    ),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ...pages.map((commands) => {
      const stream = commands.join("\n");
      return `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
    }),
  ];

  let pdf = "%PDF-1.4\n%TravelsPortal\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}
