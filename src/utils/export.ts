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
      backgroundColor: '#ffffff'
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
      format: [pdfWidth, finalPageHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`${fileName}.pdf`);
  } catch (err) {
    console.error('Failed to download PDF', err);
  }
};
