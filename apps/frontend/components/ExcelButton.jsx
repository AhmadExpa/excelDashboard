"use client";

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { toPng } from "html-to-image";

// Lazy-load exceljs only when exporting to keep bundle size small
async function createWorkbook() {
  const ExcelJS = (await import("exceljs")).default;
  return new ExcelJS.Workbook();
}

function rowsFromObjects(rows) {
  if (!rows || !rows.length) return { header: [], matrix: [] };
  const header = Object.keys(rows[0]);
  const matrix = rows.map((r) => header.map((h) => r[h]));
  return { header, matrix };
}

async function captureNodeAsPng(node, quality = 1) {
  if (!node) return null;
  const dataUrl = await toPng(node, { pixelRatio: 2, quality });
  // convert base64 dataURL to Uint8Array
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return { dataUrl, bytes };
}

async function buildAndDownloadXlsx({ filename = "dashboard.xlsx", tables = [], charts = [], meta = {} }) {
  const wb = await createWorkbook();

  // Optional metadata
  wb.creator = meta.creator || "Dashboard";
  wb.created = new Date();
  if (meta.subject) wb.subject = meta.subject;
  if (meta.description) wb.description = meta.description;

  // 1) Data sheets
  tables.forEach(({ name, rows }) => {
    const ws = wb.addWorksheet(name || "Data");
    const { header, matrix } = rowsFromObjects(rows || []);
    if (header.length) {
      ws.addRow(header);
      ws.getRow(1).font = { bold: true };
      matrix.forEach((r) => ws.addRow(r));
      // Auto width
      header.forEach((h, i) => {
        const col = ws.getColumn(i + 1);
        const maxLen = Math.max(
          h.length,
          ...matrix.map((r) => (r[i] == null ? 0 : String(r[i]).length))
        );
        col.width = Math.min(60, Math.max(10, maxLen + 2));
      });
      // Freeze header
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }
  });

  // 2) Dashboard sheet with chart images
  const dash = wb.addWorksheet("Dashboard");
  let yOffset = 0; // rows
  let xOffset = 0; // columns
  const maxPerRow = 2; // two charts per row
  const cellHeight = 26; // approx row height for layout

  for (let idx = 0; idx < charts.length; idx++) {
    const ch = charts[idx];
    if (!ch || !ch.bytes) continue;
    const imageId = wb.addImage({ buffer: ch.bytes, extension: "png" });

    // Place images in a grid: each 25 cols wide x 20 rows high (tweak as needed)
    const colStart = 1 + (idx % maxPerRow) * 25;
    const colEnd = colStart + 24;
    const rowStart = 1 + Math.floor(idx / maxPerRow) * 22;
    const rowEnd = rowStart + 20;

    dash.addImage(imageId, {
      tl: { col: colStart - 1, row: rowStart - 1 },
      br: { col: colEnd - 1, row: rowEnd - 1 },
      editAs: "oneCell",
    });

    dash.getCell(rowStart, colStart).value = charts[idx].title || `Chart ${idx + 1}`;
    dash.getCell(rowStart, colStart).font = { bold: true };
  }

  // 3) Write and trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

export default function ExportDashboardToExcel({
  filename = "dashboard.xlsx",
  datasets = [], // [{ name: "Cleaned Data", rows: [{...}, ...] }]
  chartRefs = [], // [{ title: "Bar by Country", ref: useRef() }, ...]
  meta = { subject: "Dashboard Export", description: "Exported charts and data" },
  beforeExport, // optional async hook for custom preprocessing
}) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    try {
      setBusy(true);
      if (beforeExport) await beforeExport();

      // Capture each chart node as PNG
      const captured = [];
      for (const c of chartRefs) {
        const { ref, title } = c || {};
        const node = ref && ref.current ? ref.current : null;
        const img = await captureNodeAsPng(node);
        if (img && img.bytes) captured.push({ title, bytes: img.bytes });
      }

      await buildAndDownloadXlsx({ filename, tables: datasets, charts: captured, meta });
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed. Check console for details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border bg-white hover:bg-gray-50 disabled:opacity-60"
      title="Export dashboard (data + chart images) to Excel"
    >
      {busy ? "Preparing…" : "Export to Excel"}
    </button>
  );
}

/* --------------------------------------------
USAGE EXAMPLE (drop this inside your dashboard page)
Assumes you're rendering charts with Recharts (SVG) or Chart.js (canvas).
For Chart.js you can target the <canvas> node. For Recharts target a container <div>.
---------------------------------------------*/

export function ExampleDashboard() {
  const barRef = useRef(null);
  const pieRef = useRef(null);

  // Pretend this is your pre-processed dataset coming from the upload pipeline
  const dataRows = useMemo(
    () => [
      { country: "PK", sales: 120, returns: 4 },
      { country: "US", sales: 300, returns: 9 },
      { country: "GB", sales: 210, returns: 5 },
    ],
    []
  );

  const datasets = [
    { name: "Cleaned Data", rows: dataRows },
  ];

  const chartRefs = [
    { title: "Sales by Country (Bar)", ref: barRef },
    { title: "Sales Mix (Pie)", ref: pieRef },
  ];

  return (
    <div className="space-y-6">
      <div ref={barRef} className="rounded-2xl border p-4 shadow-sm">
        {/* Your Bar chart component goes here. For example, a Recharts <BarChart> inside this div. */}
        <div className="text-sm text-gray-500">Bar chart placeholder</div>
      </div>

      <div ref={pieRef} className="rounded-2xl border p-4 shadow-sm">
        {/* Your Pie chart component goes here. */}
        <div className="text-sm text-gray-500">Pie chart placeholder</div>
      </div>

      <ExportDashboardToExcel
        filename="MyDashboard.xlsx"
        datasets={datasets}
        chartRefs={chartRefs}
        meta={{ subject: "My Dashboard", description: "Charts and data export" }}
        beforeExport={async () => {
          // e.g., flush any pending state or trigger a final recompute before capture
          await new Promise((r) => setTimeout(r, 50));
        }}
      />
    </div>
  );
}

/* --------------------------------------------
NOTES
- Install deps: `npm i exceljs html-to-image`
- This exports data tables as real Excel sheets and embeds chart IMAGES on a Dashboard sheet.
  ExcelJS (browser) cannot create native Excel chart objects yet; images are the most reliable approach.
- For Chart.js charts, you can capture the canvas directly: chartRef.current.toDataURL('image/png').
  If you have that PNG, wrap it to bytes like captureNodeAsPng does and push into `charts`.
- If any element renders lazily, ensure it's visible before export (e.g., scroll into view or wait).
---------------------------------------------*/
