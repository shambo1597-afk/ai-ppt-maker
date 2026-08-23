import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Slide } from '../types/slide';
import { SlideRenderer } from '../components/canvas/SlideRenderer';

export interface PDFExportOptions {
  slides: Slide[];
  title?: string;
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Export presentation slides to a 16:9 high-resolution PDF document.
 */
export async function exportPresentationToPDF({
  slides,
  title = 'Presentation',
  onProgress,
}: PDFExportOptions): Promise<void> {
  if (!slides || slides.length === 0) {
    throw new Error('No slides available to export.');
  }

  // 1. Create 16:9 Landscape jsPDF instance (1920x1080 pt)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [1920, 1080],
    compress: true,
  });

  // 2. Create off-screen container for rendering slides
  const container = document.createElement('div');
  container.id = 'pdf-render-container';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0px';
  container.style.width = '1920px';
  container.style.height = '1080px';
  container.style.overflow = 'hidden';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  container.style.background = '#0f172a';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // 3. Ensure fonts are loaded
    if (document.fonts) {
      await document.fonts.ready;
    }

    const total = slides.length;

    for (let i = 0; i < total; i++) {
      const slide = slides[i];
      onProgress?.(i + 1, total, `Rendering slide ${i + 1} of ${total}...`);

      // Render current slide into the container using React.createElement
      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(
            'div',
            { style: { width: 1920, height: 1080, overflow: 'hidden' } },
            React.createElement(SlideRenderer, {
              slide,
              scale: 1,
              staticMode: true,
            })
          )
        );

        // Allow layout pass and image/font rendering
        requestAnimationFrame(() => {
          setTimeout(resolve, 150);
        });
      });

      // Capture high-res raster of the slide container
      const targetEl = (container.firstElementChild as HTMLElement) || container;
      const canvas = await html2canvas(targetEl, {
        scale: 1.5, // 1.5x scale (2880x1620) for crisp text & graphics
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        width: 1920,
        height: 1080,
        windowWidth: 1920,
        windowHeight: 1080,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // Add page to PDF (skip adding page on 1st slide since jsPDF starts with page 1)
      if (i > 0) {
        pdf.addPage([1920, 1080], 'landscape');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080, undefined, 'FAST');
    }

    onProgress?.(total, total, 'Compiling and saving PDF...');

    // 4. Save and trigger download
    const cleanTitle = title.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'presentation';
    pdf.save(`${cleanTitle}.pdf`);
  } finally {
    // Clean up DOM and React root
    try {
      root.unmount();
    } catch {
      // ignore
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
