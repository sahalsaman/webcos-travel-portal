"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Row = Record<string, string | number>;

function toCSV(rows: Row[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export function CsvExportButton({
  rows,
  filename,
  label,
}: {
  rows: Row[];
  filename: string;
  label: string;
}) {
  function download() {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Button variant="outline" onClick={download} disabled={!rows.length}>
      <Download className="size-4" /> {label}
    </Button>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" /> Print / Save PDF
    </Button>
  );
}
