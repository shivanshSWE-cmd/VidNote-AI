import jsPDF from 'jspdf';
import { FrameMetadata, PdfLayoutMode } from '@/types';

interface GeneratePdfParams {
  videoTitle: string;
  videoUrl: string;
  frames: FrameMetadata[];
  layoutMode: PdfLayoutMode;
}

/**
 * Sanitizes titles for jsPDF default helvetica font.
 * Strips emoji and characters outside basic printable Latin-1 to prevent
 * corrupted mojibake symbols (e.g. 'Ø=Ý%Ø=Ý%Ø=Ü˜') in the PDF header.
 */
function sanitizePdfText(str: string): string {
  if (!str) return 'VidNote';
  const cleaned = str
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'VidNote';
}

/**
 * Loads an image URL into a clean, standard JFIF JPEG Data URL via HTMLCanvasElement.
 * 
 * WHY CANVAS RE-ENCODING IS ESSENTIAL:
 * FFmpeg's MJPEG stream output contains Lavc COM (comment) markers (0xFFFE) that choke
 * jsPDF's built-in byte parser, causing it to misidentify JPEG SOF markers and mistakenly
 * report dimensions as 261x256 in DeviceGray colorspace. This results in severe horizontal
 * scanline tearing, interlacing artifacts, and forced black-and-white images.
 * Re-encoding through an offscreen canvas lets the browser's native C++ image decoder
 * handle the stream cleanly and produces standard JFIF JPEG headers that jsPDF parses perfectly.
 */
async function loadImageAsCleanDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const renderToCanvas = (imageEl: HTMLImageElement) => {
      try {
        const canvas = document.createElement('canvas');
        const width = imageEl.naturalWidth || 1920;
        const height = imageEl.naturalHeight || 1080;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // Crisp rendering with white background (prevents transparent/dark artifacts)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imageEl, 0, 0, width, height);

        // Re-encode to clean standard JFIF JPEG (quality 0.92 = visually lossless & compact)
        const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(cleanDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      renderToCanvas(img);
    };

    img.onerror = () => {
      // Direct CORS load failed; fallback to blob fetch -> createObjectURL
      fetch(url, { mode: 'cors' })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} fetching frame`);
          return res.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            renderToCanvas(fallbackImg);
            URL.revokeObjectURL(blobUrl);
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error(`Failed to decode frame image blob: ${url}`));
          };
          fallbackImg.src = blobUrl;
        })
        .catch((fetchErr) => {
          reject(new Error(`Failed to load image from URL: ${url} (${fetchErr.message})`));
        });
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

  const sanitizedTitle = sanitizePdfText(videoTitle);

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
      const truncatedTitle = sanitizedTitle.length > 70 ? `${sanitizedTitle.substring(0, 67)}...` : sanitizedTitle;
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
        const cleanBase64 = await loadImageAsCleanDataUrl(frame.url);
        doc.addImage(cleanBase64, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');

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
    // --- 2 FRAMES PER PAGE LAYOUT (Side-by-Side) ---
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
      const truncatedTitle = sanitizedTitle.length > 70 ? `${sanitizedTitle.substring(0, 67)}...` : sanitizedTitle;
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
          const cleanBase64 = await loadImageAsCleanDataUrl(frame.url);
          doc.addImage(cleanBase64, 'JPEG', colX, imgY, colWidth, imgHeight, undefined, 'FAST');

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
  const fileSafeTitle = sanitizedTitle
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40)
    .replace(/_+/g, '_');
  const filename = `${fileSafeTitle || 'VidNote'}_Notes.pdf`;
  doc.save(filename);
}
