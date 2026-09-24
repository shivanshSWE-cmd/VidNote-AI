import jsPDF from 'jspdf';
import { FrameMetadata, PdfLayoutMode } from '@/types';

interface GeneratePdfParams {
  videoTitle: string;
  videoUrl: string;
  frames: FrameMetadata[];
  layoutMode: PdfLayoutMode;
}

/**
 * Loads an HTTP image URL into an HTMLImageElement and converts it to a Base64 Data URL.
 */
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context from canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataURL);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };
    img.src = url;
  });
}

/**
 * Generates an exportable PDF document entirely client-side using jsPDF.
 */
export async function generatePdf({
  videoTitle,
  videoUrl,
  frames,
  layoutMode,
}: GeneratePdfParams): Promise<void> {
  if (!frames || frames.length === 0) {
    throw new Error('No frames selected for PDF generation.');
  }

  // Create A4 Landscape PDF (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();   // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
  const margin = 12; // 12 mm margins

  const contentWidth = pageWidth - margin * 2; // 273 mm
  const generationDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (layoutMode === '1-up') {
    // --- 1 FRAME PER PAGE LAYOUT ---
    const totalPages = frames.length;

    for (let i = 0; i < frames.length; i++) {
      if (i > 0) {
        doc.addPage('a4', 'landscape');
      }

      const frame = frames[i];

      // Draw Top Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59); // Slate-800
      const truncatedTitle = videoTitle.length > 70 ? `${videoTitle.substring(0, 67)}...` : videoTitle;
      doc.text(truncatedTitle, margin, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Source: ${videoUrl}  |  Date: ${generationDate}`, margin, 19);

      // Header Divider Line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, 22, pageWidth - margin, 22);

      // Render 16:9 Image Centered
      const availableHeight = pageHeight - 45; // Height reserved for headers/footers
      let imgWidth = contentWidth;
      let imgHeight = (imgWidth * 9) / 16;

      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = (imgHeight * 16) / 9;
      }

      const imgX = margin + (contentWidth - imgWidth) / 2;
      const imgY = 26 + (availableHeight - imgHeight) / 2;

      try {
        const base64Data = await loadImageAsBase64(frame.url);
        doc.addImage(base64Data, 'JPEG', imgX, imgY, imgWidth, imgHeight);

        // Subtle Image Border
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.setLineWidth(0.3);
        doc.rect(imgX, imgY, imgWidth, imgHeight);
      } catch (err) {
        console.error(`Error loading frame ${frame.frame_id}:`, err);
      }

      // Draw Footer Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      // Draw Footer Timecode & Page Number
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text(`Timestamp: [${frame.timestamp_formatted}]`, margin, pageHeight - 8);

      doc.setFont('helvetica', 'medium');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(`Page ${i + 1} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  } else {
    // --- 2 FRAMES PER PAGE LAYOUT (Side-by-Side or Portrait Stacked) ---
    // In landscape 2-up: 2 columns side-by-side
    const totalPages = Math.ceil(frames.length / 2);
    const colWidth = (contentWidth - 10) / 2; // 131.5 mm each column
    const imgHeight = (colWidth * 9) / 16;     // ~74 mm

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        doc.addPage('a4', 'landscape');
      }

      // Draw Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      const truncatedTitle = videoTitle.length > 70 ? `${videoTitle.substring(0, 67)}...` : videoTitle;
      doc.text(truncatedTitle, margin, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Source: ${videoUrl}  |  Date: ${generationDate}`, margin, 19);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, 22, pageWidth - margin, 22);

      const firstFrameIdx = pageIdx * 2;
      const pageFrames = frames.slice(firstFrameIdx, firstFrameIdx + 2);

      for (let c = 0; c < pageFrames.length; c++) {
        const frame = pageFrames[c];
        const colX = margin + c * (colWidth + 10);
        const imgY = 40;

        try {
          const base64Data = await loadImageAsBase64(frame.url);
          doc.addImage(base64Data, 'JPEG', colX, imgY, colWidth, imgHeight);

          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.rect(colX, imgY, colWidth, imgHeight);
        } catch (err) {
          console.error(`Error loading frame ${frame.frame_id}:`, err);
        }

        // Timecode badge below image
        doc.setFont('courier', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229);
        doc.text(`Timestamp: [${frame.timestamp_formatted}]`, colX, imgY + imgHeight + 8);
      }

      // Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      doc.setFont('helvetica', 'medium');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageIdx + 1} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  // Trigger Save File Dialog in Browser
  const sanitizedTitle = videoTitle
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40)
    .replace(/_+/g, '_');
  const filename = `${sanitizedTitle || 'VidNote'}_Notes.pdf`;
  doc.save(filename);
}
