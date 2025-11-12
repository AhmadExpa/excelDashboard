"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Props:
 * - targetRef: ref to the DOM node you want to export
 * - fileName: "Dashboard-Region-Year.pdf"
 * - pageOrientation: "portrait" | "landscape"
 * - marginPt: number (pts) e.g., 36 = 0.5"
 * - scale: number (for html2canvas; 2–4 recommended)
 */
export default function ExportDashboardToPDF({
  targetRef,
  fileName = "Dashboard.pdf",
  pageOrientation = "portrait",
  marginPt = 36,
  scale = 3,
}) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!targetRef?.current) return;

    try {
      setBusy(true);

      // Render the target area to a high-res canvas
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#ffffff",
        scale, // higher = sharper (at the cost of file size)
        useCORS: true,
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/png");

      // Create a PDF and center content with margins
      const pdf = new jsPDF({
        orientation: pageOrientation,
        unit: "pt",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const usableWidth = pageWidth - marginPt * 2;
      const usableHeight = pageHeight - marginPt * 2;

      // Image dimensions (in pixels) from canvas
      const imgPxWidth = canvas.width;
      const imgPxHeight = canvas.height;

      // Convert image to fit within usable area while preserving aspect ratio
      const imgAspect = imgPxWidth / imgPxHeight;
      const targetWidth = usableWidth;
      const targetHeight = targetWidth / imgAspect;

      // If the scaled height exceeds a single page, we paginate
      const singlePageHeightPt = usableHeight;

      if (targetHeight <= singlePageHeightPt) {
        // Single page: center vertically as well
        const offsetX = marginPt + (usableWidth - targetWidth) / 2;
        const offsetY = marginPt + (usableHeight - targetHeight) / 2;

        pdf.addImage(imgData, "PNG", offsetX, offsetY, targetWidth, targetHeight, "", "FAST");
      } else {
        // Multi-page: we slice the tall image into "page windows"
        // Compute scale from px to pt for width we draw
        const pxPerPt = imgPxWidth / targetWidth;

        // How many px tall is one PDF page of usable height?
        const pageWindowPx = singlePageHeightPt * pxPerPt;

        let remainingPx = imgPxHeight;
        let pageIndex = 0;

        while (remainingPx > 0) {
          const sx = 0;
          const sy = pageIndex * pageWindowPx;
          const sWidth = imgPxWidth;
          const sHeight = Math.min(pageWindowPx, remainingPx);

          // Create a temporary canvas slice for this page
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = sWidth;
          pageCanvas.height = sHeight;

          const ctx = pageCanvas.getContext("2d");
          ctx.drawImage(
            canvas,
            sx, sy, sWidth, sHeight, // source rect
            0, 0, sWidth, sHeight    // target rect
          );

          const pageImg = pageCanvas.toDataURL("image/png");

          if (pageIndex > 0) pdf.addPage();

          // Center horizontally and vertically per page
          const drawHeight = (sHeight / pxPerPt); // convert px slice -> pt height at our target width
          const offsetX = marginPt + (usableWidth - targetWidth) / 2;
          const offsetY = marginPt + (singlePageHeightPt - drawHeight) / 2;

          pdf.addImage(pageImg, "PNG", offsetX, offsetY, targetWidth, drawHeight, "", "FAST");

          remainingPx -= sHeight;
          pageIndex += 1;
        }
      }

      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert(err?.message || "PDF export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="rounded-lg bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
      title="Download a high-quality PDF of this dashboard"
    >
      {busy ? "Building PDF…" : "Export PDF (high-res)"}
    </button>
  );
}
