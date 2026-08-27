import { toPng, toCanvas } from 'html-to-image';
import jsPDF from 'jspdf';

export const downloadAsImage = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const dataUrl = await toPng(element, { 
      quality: 0.98,
      backgroundColor: '#ffffff',
      pixelRatio: 2
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to download image', err);
  }
};

export const downloadAsPDF = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await toCanvas(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    // Standard A4 width in mm
    const pdfWidth = 210;
    // Calculate total height proportional to element aspect ratio
    const imgProps = {
      width: canvas.width,
      height: canvas.height,
    };
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const finalPageHeight = Math.max(pdfHeight, 297);

    // Create PDF with dynamic height matching the voucher full content
    // so no content is sliced, clipped, or cut off at the bottom
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, finalPageHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`${fileName}.pdf`);
  } catch (err) {
    console.error('Failed to download PDF', err);
  }
};

/**
 * Downloads multiple elements as individual high-res PNG images sequentially.
 * e.g., Page 1 and Page 2
 */
export const downloadMultiPageImages = async (
  elementIds: string[],
  baseFileName: string
) => {
  const validIds = elementIds.filter((id) => document.getElementById(id));
  if (validIds.length === 0) return;

  for (let i = 0; i < validIds.length; i++) {
    const elId = validIds[i];
    const element = document.getElementById(elId);
    if (!element) continue;

    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const pageSuffix = validIds.length > 1 ? `_Page_${i + 1}` : '';
      const link = document.createElement('a');
      link.download = `${baseFileName}${pageSuffix}.png`;
      link.href = dataUrl;
      link.click();

      // Small delay between downloads so the browser triggers both without blocking
      if (i < validIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    } catch (err) {
      console.error(`Failed to download page ${i + 1} image`, err);
    }
  }
};

/**
 * Combines multiple elements into a standard multi-page A4 PDF.
 */
export const downloadMultiPagePDF = async (
  elementIds: string[],
  fileName: string
) => {
  const validIds = elementIds.filter((id) => document.getElementById(id));
  if (validIds.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  let pageAdded = false;

  for (let i = 0; i < validIds.length; i++) {
    const elId = validIds[i];
    const element = document.getElementById(elId);
    if (!element) continue;

    try {
      const canvas = await toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      if (pageAdded) {
        pdf.addPage('a4', 'portrait');
      }

      // Proportional scale on standard A4 page
      const elAspect = canvas.height / canvas.width;
      const renderHeight = Math.min(pdfWidth * elAspect, pdfHeight);

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, renderHeight, undefined, 'FAST');
      pageAdded = true;
    } catch (err) {
      console.error(`Failed to render page ${i + 1} for PDF`, err);
    }
  }

  if (pageAdded) {
    pdf.save(`${fileName}.pdf`);
  }
};
