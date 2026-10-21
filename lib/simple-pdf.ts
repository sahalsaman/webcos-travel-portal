import { readFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

export type PdfPng = {
  name: string;
  width: number;
  height: number;
  palette: Buffer;
  data: Buffer;
  alpha?: Buffer;
};

export type PdfWatermark = {
  image: PdfPng;
  width: number;
  height: number;
  opacity?: number;
};

function ascii(value: unknown) {
  return String(value ?? "").normalize("NFKD").replace(/[^\x20-\x7E]/g, "-");
}

function escapePdf(value: unknown) {
  return ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function paeth(left: number, above: number, upperLeft: number) {
  const guess = left + above - upperLeft;
  const leftDistance = Math.abs(guess - left);
  const aboveDistance = Math.abs(guess - above);
  const upperLeftDistance = Math.abs(guess - upperLeft);
  return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance ? left : aboveDistance <= upperLeftDistance ? above : upperLeft;
}

/** Reads a non-interlaced, indexed 8-bit PNG and retains its transparent pixels. */
export function loadIndexedPng(path: string, name: string): PdfPng {
  const png = readFileSync(path);
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Expected a PNG image");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = Buffer.alloc(0);
  let transparency = Buffer.alloc(0);
  const dataChunks: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === "PLTE") palette = data;
    else if (type === "tRNS") transparency = data;
    else if (type === "IDAT") dataChunks.push(data);
    offset += length + 12;
  }
  if (!width || !height || bitDepth !== 8 || colorType !== 3 || interlace !== 0 || !palette.length || !dataChunks.length) {
    throw new Error("Only non-interlaced indexed 8-bit PNGs are supported");
  }

  // PNG scanlines use per-row filters. Decode just enough to create a PDF soft mask.
  const filtered = inflateSync(Buffer.concat(dataChunks));
  const alpha = Buffer.alloc(width * height, 255);
  let source = 0;
  let previous = Buffer.alloc(width);
  for (let row = 0; row < height; row += 1) {
    const filter = filtered[source++];
    const encoded = filtered.subarray(source, source + width);
    source += width;
    const decoded = Buffer.alloc(width);
    for (let column = 0; column < width; column += 1) {
      const left = column ? decoded[column - 1] : 0;
      const above = previous[column] ?? 0;
      const upperLeft = column ? previous[column - 1] : 0;
      const value = encoded[column];
      decoded[column] = filter === 0 ? value : filter === 1 ? (value + left) & 255 : filter === 2 ? (value + above) & 255 : filter === 3 ? (value + Math.floor((left + above) / 2)) & 255 : filter === 4 ? (value + paeth(left, above, upperLeft)) & 255 : value;
      alpha[row * width + column] = transparency[decoded[column]] ?? 255;
    }
    previous = decoded;
  }
  return { name, width, height, palette, data: Buffer.concat(dataChunks), alpha: transparency.length ? deflateSync(alpha) : undefined };
}

export function pdfLine(text: string, x: number, y: number, size = 10, bold = false, color = "0.15 0.18 0.24") {
  return `${color} rg BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`;
}

export function pdfImage(image: PdfPng, x: number, y: number, width: number, height: number) {
  return `q ${width} 0 0 ${height} ${x} ${y} cm /${image.name} Do Q`;
}

export function buildSinglePagePdf(commands: string[], watermark?: PdfWatermark) {
  return buildMultiPagePdf([commands], watermark);
}

export function buildMultiPagePdf(pages: string[][], watermark?: PdfWatermark) {
  const pageCount = Math.max(1, pages.length);
  const fontRegularRef = pageCount + 3;
  const fontBoldRef = pageCount + 4;
  const alphaRef = watermark ? pageCount + 5 : 0;
  const softMaskRef = watermark?.image.alpha ? alphaRef + 1 : 0;
  const imageRef = watermark ? (softMaskRef || alphaRef) + 1 : 0;
  const firstContentRef = watermark ? imageRef + 1 : pageCount + 5;
  const pageRefs = Array.from({ length: pageCount }, (_, index) => `${index + 3} 0 R`).join(" ");
  const imageResources = watermark ? ` /XObject << /${watermark.image.name} ${imageRef} 0 R >> /ExtGState << /WM ${alphaRef} 0 R >>` : "";
  const watermarkCommand = watermark ? `q /WM gs ${watermark.width} 0 0 ${watermark.height} ${(595 - watermark.width) / 2} ${(842 - watermark.height) / 2} cm /${watermark.image.name} Do Q` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>`,
    ...Array.from({ length: pageCount }, (_, index) => `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularRef} 0 R /F2 ${fontBoldRef} 0 R >>${imageResources} >> /Contents ${firstContentRef + index} 0 R >>`),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ...(watermark ? [`<< /Type /ExtGState /ca ${watermark.opacity ?? 0.06} /CA ${watermark.opacity ?? 0.06} >>`] : []),
    ...(watermark?.image.alpha ? [`<< /Type /XObject /Subtype /Image /Width ${watermark.image.width} /Height ${watermark.image.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${watermark.image.alpha.length} >>\nstream\n${watermark.image.alpha.toString("binary")}\nendstream`] : []),
    ...(watermark ? [`<< /Type /XObject /Subtype /Image /Width ${watermark.image.width} /Height ${watermark.image.height} /ColorSpace [/Indexed /DeviceRGB ${(watermark.image.palette.length / 3) - 1} <${watermark.image.palette.toString("hex")}>] /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 1 /BitsPerComponent 8 /Columns ${watermark.image.width} >>${softMaskRef ? ` /SMask ${softMaskRef} 0 R` : ""} /Length ${watermark.image.data.length} >>\nstream\n${watermark.image.data.toString("binary")}\nendstream`] : []),
    ...pages.map((commands) => {
      const stream = [watermarkCommand, ...commands].filter(Boolean).join("\n");
      return `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
    }),
  ];

  let pdf = "%PDF-1.4\n%TravelsPortal\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, "binary")); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}
