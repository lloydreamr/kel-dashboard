/**
 * usePdfExport Hook
 *
 * Client-side PDF generation using html2pdf.js.
 * Uses dynamic import to avoid SSR crashes (html2pdf.js uses window/document).
 *
 * @example
 * ```tsx
 * const { exportToPdf, isGenerating, error } = usePdfExport();
 *
 * const handleDownload = async () => {
 *   if (!containerRef.current) return;
 *   try {
 *     await exportToPdf(containerRef.current, 'kel-positioning-2026-01-07.pdf');
 *     toast.success('PDF downloaded successfully');
 *   } catch {
 *     toast.error('Failed to generate PDF');
 *   }
 * };
 * ```
 */

'use client';

import { useCallback, useState } from 'react';

interface UsePdfExportReturn {
  /** Export element to PDF and trigger download */
  exportToPdf: (element: HTMLElement, filename: string) => Promise<void>;
  /** Whether PDF generation is in progress */
  isGenerating: boolean;
  /** Error from last export attempt, or null */
  error: Error | null;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToPdf = useCallback(
    async (element: HTMLElement, filename: string) => {
      setIsGenerating(true);
      setError(null);

      // Store original element styles for restoration
      let originalLeft: string | null = null;
      let originalPosition: string | null = null;

      try {
        // CRITICAL: Dynamic import - html2pdf.js uses window/document
        // Static import would crash during Next.js SSR
        const html2pdf = (await import('html2pdf.js')).default;

        // BUG-001 FIX PART 1: Move element on-screen for capture
        // html2canvas cannot capture elements positioned outside the viewport.
        // The element itself (not parent) is typically positioned at left:-9999px for hiding.
        // We must temporarily move it into the viewport for capture to work.
        // CRITICAL: Keep position:fixed (not absolute) to stay viewport-relative.
        const rect = element.getBoundingClientRect();
        console.log('[BUG-001 FIX] Element rect.left:', rect.left);

        originalLeft = element.style.left;
        originalPosition = element.style.position;

        if (rect.left < 0) {
          // Move on-screen - keep fixed positioning, just change left
          element.style.left = '0px';
          console.log('[BUG-001 FIX] Moved element to left:0px');
          // Ensure fixed positioning for viewport-relative placement
          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.position !== 'fixed') {
            element.style.position = 'fixed';
          }
        }

        // BUG-001 FIX PART 2: Force layout recalculation and wait for repaint
        // Reading offsetHeight forces a synchronous reflow, ensuring the browser
        // has processed our position change before we continue.
        void element.offsetHeight;

        // Double RAF ensures browser completes paint cycle before capture.
        // This is needed after moving on-screen so Recharts can repaint.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // BUG-001 FIX PART 3: Wait for Recharts to re-render after position change
        // Recharts may optimize rendering for off-screen elements.
        // Give it time to detect the position change and render SVG paths.
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Verify Recharts SVG has rendered with content
        const svg = element.querySelector('.recharts-surface');
        console.log('[BUG-001 DEBUG] SVG element:', svg ? 'found' : 'NOT FOUND');
        console.log('[BUG-001 DEBUG] SVG children:', svg?.childNodes.length);
        console.log('[BUG-001 DEBUG] SVG innerHTML length:', svg?.innerHTML.length);
        if (svg && svg.getBoundingClientRect().width === 0) {
          throw new Error('Chart SVG not ready for export');
        }

        // WORKAROUND: html2canvas doesn't support lab()/oklch() colors from Tailwind CSS v4.
        // We override colors in the onclone callback to replace any lab() colors with hex equivalents.
        const worker = html2pdf()
          .set({
            margin: 15, // 15mm margins (A4 friendly)
            filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
              scale: 2, // 2x for crisp output
              useCORS: true, // Allow cross-origin images
              logging: false,
              backgroundColor: '#ffffff',
              // BUG-001 FIX: Explicitly set capture dimensions based on element size
              // This ensures html2canvas knows exactly where to capture from
              width: element.scrollWidth || 800,
              height: element.scrollHeight || 600,
              windowWidth: element.scrollWidth || 800,
              windowHeight: element.scrollHeight || 600,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              // BUG-001 FIX: Position cloned element on-screen for capture
              // html2canvas clones the DOM, so we need to fix the clone's position
              // not just the original element's position
              onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
                // Move the cloned element on-screen for capture
                // This is essential because the original element is positioned at left:-9999px
                clonedElement.style.position = 'static';
                clonedElement.style.left = 'auto';
                clonedElement.style.top = 'auto';
                clonedElement.style.transform = 'none';
                clonedElement.style.visibility = 'visible';
                clonedElement.style.opacity = '1';
                console.log('[BUG-001 FIX] Reset cloned element to static position');
                console.log('[BUG-001 DEBUG] Cloned element size:', clonedElement.offsetWidth, 'x', clonedElement.offsetHeight);

                // Override computed styles to replace lab() colors with hex
                const allElements = clonedDoc.querySelectorAll('*');
                allElements.forEach((el) => {
                  const htmlEl = el as HTMLElement;
                  const computed = window.getComputedStyle(htmlEl);
                  // Override background-color if it uses lab()
                  const bgColor = computed.backgroundColor;
                  if (bgColor.includes('lab(') || bgColor.includes('oklch(')) {
                    htmlEl.style.backgroundColor = '#ffffff';
                  }
                  // Override color if it uses lab()
                  const textColor = computed.color;
                  if (textColor.includes('lab(') || textColor.includes('oklch(')) {
                    htmlEl.style.color = '#000000';
                  }
                  // Override border-color if it uses lab()
                  const borderColor = computed.borderColor;
                  if (borderColor.includes('lab(') || borderColor.includes('oklch(')) {
                    htmlEl.style.borderColor = '#e5e7eb';
                  }
                });
              },
            },
            jsPDF: {
              unit: 'mm',
              format: 'a4', // 210 × 297mm
              orientation: 'portrait',
            },
          })
          .from(element);

        // Get PDF as blob and trigger download via anchor element
        // This approach ensures Playwright can detect the download event
        const blob: Blob = await worker.outputPdf('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        const exportError =
          err instanceof Error ? err : new Error('PDF generation failed');
        setError(exportError);
        throw exportError;
      } finally {
        // BUG-001 FIX: Restore element to off-screen position
        if (originalLeft !== null) {
          element.style.left = originalLeft || '-9999px';
          element.style.position = originalPosition || 'fixed';
        }
        setIsGenerating(false);
      }
    },
    []
  );

  return { exportToPdf, isGenerating, error };
}
