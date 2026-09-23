import html2pdf from 'html2pdf.js';
import { PDFDocument } from 'pdf-lib';
import { fetchAttachmentFileData } from '../services/store';
import { Quotation, AppState } from '../types';

/**
 * Handles rendering HTML element to PDF via html2canvas/jsPDF,
 * merges linked PDF attachments (if any), and triggers the browser download.
 */
export async function generateAndDownloadPdf(
  q: Quotation,
  element: HTMLElement,
  state: AppState
): Promise<void> {
  const fileName = q.status === 'Site Survey Pending' 
    ? `${q.systemDescription.replace(/\s+/g, '_')}.pdf`
    : `${q.customerName.replace(/\s+/g, '_')}_${q.id}.pdf`;

  const isLoanQuote = q.quoteType === 'Loan';

  const opt = {
    margin: 0,
    filename: fileName,
    image: { type: 'jpeg', quality: isLoanQuote ? 0.75 : 1.0 },
    html2canvas: { 
      scale: isLoanQuote ? 1.5 : 4, // High scale for standard, lower scale for loan to keep < 1MB
      useCORS: true, 
      logging: false,
      letterRendering: false,
      imageTimeout: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794, // Standard A4 width in pixels at 96 DPI
      onclone: (clonedDoc: Document) => {
        // Force all elements to use sRGB and disable transitions
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          * {
            transition: none !important;
            animation: none !important;
            color-interpolation: sRGB !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            
            /* Aggressively override Tailwind v4 oklch variables */
            --tw-shadow: 0 0 #0000 !important;
            --tw-shadow-colored: 0 0 #0000 !important;
            --tw-ring-color: rgba(59, 130, 246, 0.5) !important;
            --tw-ring-shadow: 0 0 #0000 !important;
            --tw-inset-shadow: 0 0 #0000 !important;
            --tw-inset-shadow-colored: 0 0 #0000 !important;
            --tw-inset-ring-shadow: 0 0 #0000 !important;
            --tw-ring-offset-color: #ffffff !important;
            --tw-gradient-from: transparent !important;
            --tw-gradient-to: transparent !important;
            --tw-gradient-stops: none !important;
            --tw-border-opacity: 1 !important;
            --tw-bg-opacity: 1 !important;
            --tw-text-opacity: 1 !important;
            --tw-placeholder-opacity: 1 !important;
            --tw-ring-opacity: 1 !important;
            --tw-divide-opacity: 1 !important;
            --tw-outline-color: currentColor !important;
            --tw-outline-style: none !important;
          }
          /* Ensure no oklab/oklch leaks from any remaining Tailwind classes */
          :root {
            color-scheme: light;
            --tw-ring-color: rgba(59, 130, 246, 0.5);
            --tw-shadow: 0 0 #0000;
            --tw-shadow-colored: 0 0 #0000;
          }
          /* Fix for potential blurry text in some browsers */
          body {
            text-rendering: optimizeLegibility !important;
            font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(style);

        // Traverse all elements and remove any style containing oklch
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          if (el.style) {
            const inlineStyle = el.getAttribute('style') || '';
            if (inlineStyle.includes('oklch') || inlineStyle.includes('oklab')) {
              el.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, 'currentColor').replace(/oklab\([^)]+\)/g, 'currentColor'));
            }
          }
        }
      }
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait', 
      compress: true
    },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  if (typeof html2pdf !== 'function') {
    const globalHtml2pdf = (window as any).html2pdf;
    if (typeof globalHtml2pdf === 'function') {
      await globalHtml2pdf().set(opt).from(element).save();
      return;
    }
    throw new Error("PDF library initialization failed");
  }

  let pdfData: Uint8Array | undefined;
  try {
    const generatedBuffer = await html2pdf().set(opt).from(element).outputPdf('arraybuffer');
    pdfData = new Uint8Array(generatedBuffer);
  } catch (genErr) {
    console.error("html2pdf arraybuffer generation failed, fallback to save", genErr);
    await html2pdf().set(opt).from(element).save();
    return;
  }

  // Merge attachments if present and not a Loan quote
  if (pdfData && q.quoteType !== 'Loan' && q.attachmentIds && q.attachmentIds.length > 0 && state.attachments) {
    try {
      const mainPdf = await PDFDocument.load(pdfData);
      
      for (const attId of q.attachmentIds) {
        const attRecord = state.attachments.find(a => a.id === attId);
        let fileData = attRecord?.fileData;
        if (!fileData) {
          fileData = (await fetchAttachmentFileData(attId)) || undefined;
        }
        if (attRecord && fileData) {
          try {
            const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
            const attPdf = await PDFDocument.load(base64Data);
            const copiedPages = await mainPdf.copyPages(attPdf, attPdf.getPageIndices());
            copiedPages.forEach(page => mainPdf.addPage(page));
          } catch (e) {
            console.error("Failed to merge attachment:", attRecord.name, e);
          }
        }
      }
      
      pdfData = await mainPdf.save();
    } catch (mergeErr) {
      console.error("PDF merge failed:", mergeErr);
    }
  }

  // Trigger download via anchor element
  const blob = new Blob([pdfData as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
