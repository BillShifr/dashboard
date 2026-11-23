import type { Shape } from "@/domain/shared/types";

export type PdfPage = {
  shapes: Shape[];
  height: number;
  width?: number;
  originX?: number;
  originY?: number;
};

/** Build a PDF Blob from pre-rendered shape pages (HTML `pdfBlob` algorithm). */
export function shapesPagesToPdfBlob(pages: PdfPage[]): Blob {
  const objects = ["", ""];
  const rgb = (c: string) =>
    (c.slice(1).match(/../g) as string[])
      .map((x) => (parseInt(x, 16) / 255).toFixed(4))
      .join(" ");

  function commands(
    d: string,
    height: number,
    originX: number,
    originY: number,
  ): string {
    const x = (v: number | string) => (Number(v) - originX).toFixed(3);
    const y = (v: number | string) =>
      (height - (Number(v) - originY)).toFixed(3);
    let out = "";
    let px = 0;
    let py = 0;
    for (const match of d.matchAll(/([MLCQZ])([^MLCQZ]*)/g)) {
      const c = match[1]!;
      const v = (match[2]!.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      if (c === "Z") {
        out += "h\n";
        continue;
      }
      if (c === "Q") {
        const [cx, cy, nx, ny] = v;
        out += `${x(px + ((cx! - px) * 2) / 3)} ${y(py + ((cy! - py) * 2) / 3)} ${x(nx! + ((cx! - nx!) * 2) / 3)} ${y(ny! + ((cy! - ny!) * 2) / 3)} ${x(nx!)} ${y(ny!)} c\n`;
      } else {
        out +=
          v.map((n, i) => (i % 2 ? y(n) : x(n))).join(" ") +
          ` ${({ M: "m", L: "l", C: "c" } as Record<string, string>)[c]}\n`;
      }
      px = v.at(-2)!;
      py = v.at(-1)!;
    }
    return out;
  }

  const pageIds: number[] = [];
  for (const page of pages) {
    const pageId = objects.length + 1;
    const streamId = pageId + 1;
    pageIds.push(pageId);
    const originX = page.originX ?? -20;
    const originY = page.originY ?? -15;
    const pageWidth = page.width ?? 540;
    let stream = "1 J 1 j\n";
    for (const s of page.shapes) {
      const fill = s.fill && s.fill !== "none";
      if (fill) stream += rgb(s.fill!) + " rg\n";
      if (s.stroke) {
        stream += rgb(s.stroke) + " RG\n" + s.width + " w\n";
        stream += s.linejoin === "miter" ? "0 J 0 j\n" : "1 J 1 j\n";
      }
      stream +=
        commands(s.d, page.height, originX, originY) +
        (s.stroke ? (fill ? "B\n" : "S\n") : "f\n");
    }
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${page.height}] /Resources << >> /Contents ${streamId} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
    );
  }
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => id + " 0 R").join(" ")}] /Count ${pages.length} >>`;
  let doc = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((o, i) => {
    offsets.push(doc.length);
    doc += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const start = doc.length;
  doc +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets
      .slice(1)
      .map((n) => String(n).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([doc], { type: "application/pdf" });
}
