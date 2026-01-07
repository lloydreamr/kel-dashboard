/**
 * TypeScript declarations for html2pdf.js
 * Library: https://github.com/ekoopmans/html2pdf.js
 */

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    /** Margin in mm (single value or [top, right, bottom, left]) */
    margin?: number | [number, number, number, number];
    /** Output filename */
    filename?: string;
    /** Image configuration */
    image?: {
      type?: 'jpeg' | 'png' | 'webp';
      quality?: number;
    };
    /** html2canvas configuration */
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      foreignObjectRendering?: boolean;
      allowTaint?: boolean;
      backgroundColor?: string | null;
    };
    /** jsPDF configuration */
    jsPDF?: {
      unit?: 'pt' | 'mm' | 'cm' | 'in' | 'px' | 'pc' | 'em' | 'ex';
      format?: string | [number, number];
      orientation?: 'portrait' | 'landscape';
      compress?: boolean;
    };
    /** Page break configuration */
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
    /** Enable smart page breaks */
    enableLinks?: boolean;
  }

  interface Html2PdfWorker {
    /** Set options */
    set(options: Html2PdfOptions): Html2PdfWorker;
    /** Set source element or HTML string */
    from(element: HTMLElement | string): Html2PdfWorker;
    /** Convert to canvas */
    toCanvas(): Promise<HTMLCanvasElement>;
    /** Convert to PDF */
    toPdf(): Html2PdfWorker;
    /** Get PDF output */
    output(type?: string): Promise<unknown>;
    /** Save/download PDF */
    save(filename?: string): Promise<void>;
    /** Output as image */
    toImg(): Html2PdfWorker;
    /** Output as container */
    toContainer(): Html2PdfWorker;
    /** Chain multiple operations */
    then<T>(callback: (value: unknown) => T): Promise<T>;
    /** Handle errors */
    catch(callback: (error: Error) => void): Promise<void>;
  }

  /** Create html2pdf worker instance */
  function html2pdf(): Html2PdfWorker;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Html2PdfWorker;

  export default html2pdf;
}
