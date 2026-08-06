import React, { useState } from 'react';
import { usePdfEngine } from './usePdfEngine';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { ActionBar } from './components/ActionBar';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const { isReady, isLoading, error: wasmError, generatePdfBlob } = usePdfEngine();

  const [pdfFilename, setPdfFilename] = useState('pdfBhai_document');
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [compiledPdfUrl, setCompiledPdfUrl] = useState(null);
  const [compiledPdfBytes, setCompiledPdfBytes] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Helper to extract JPEG dimensions in JS
  const getJpegDimensions = (arrayBuffer) => {
    return new Promise((resolve) => {
      const view = new DataView(arrayBuffer);
      if (view.getUint16(0) !== 0xFFD8) {
        resolve({ width: 595, height: 842 }); // default A4
        return;
      }
      let offset = 2;
      while (offset < view.byteLength) {
        const marker = view.getUint16(offset);
        offset += 2;
        if (marker === 0xFFC0 || marker === 0xFFC2) {
          const height = view.getUint16(offset + 3);
          const width = view.getUint16(offset + 5);
          resolve({ width, height });
          return;
        } else {
          const length = view.getUint16(offset);
          offset += length;
        }
      }
      resolve({ width: 595, height: 842 });
    });
  };

  // Handle JPEG files added
  const handleAddImages = async (fileList) => {
    const newPages = [];

    for (const file of fileList) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const dimensions = await getJpegDimensions(arrayBuffer);
      const previewUrl = URL.createObjectURL(file);

      newPages.push({
        id: 'page-' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        previewUrl,
        imageBytes: uint8Array,
        isBlank: false,
        width: dimensions.width,
        height: dimensions.height,
        texts: []
      });
    }

    setPages(prev => {
      const updated = [...prev, ...newPages];
      if (prev.length === 0 && updated.length > 0) {
        setActivePageIndex(0);
      }
      return updated;
    });
  };

  // Add Blank Page
  const handleAddBlankPage = () => {
    const newBlankPage = {
      id: 'page-' + Math.random().toString(36).substr(2, 9),
      name: `Blank Page ${pages.length + 1}`,
      previewUrl: null,
      imageBytes: null,
      isBlank: true,
      width: 595,
      height: 842,
      texts: []
    };

    setPages(prev => {
      const updated = [...prev, newBlankPage];
      setActivePageIndex(updated.length - 1);
      return updated;
    });
  };

  // Remove Page
  const handleRemovePage = (indexToRemove) => {
    setPages(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (activePageIndex >= updated.length) {
        setActivePageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // Reorder Pages
  const handleReorderPages = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= pages.length) return;
    setPages(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
    setActivePageIndex(toIdx);
  };

  // Add Text Stamp to Page
  const handleAddTextToPage = (pageId, textStamp) => {
    setPages(prev => prev.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          texts: [...p.texts, textStamp]
        };
      }
      return p;
    }));
  };

  // Remove Text Stamp from Page
  const handleRemoveTextFromPage = (pageId, textIndex) => {
    setPages(prev => prev.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          texts: p.texts.filter((_, idx) => idx !== textIndex)
        };
      }
      return p;
    }));
  };

  // Load Demo Samples
  const handleLoadSample = async () => {
    const createSampleCanvasJpeg = (title, subtitle, colorScheme) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 595;
        canvas.height = 842;
        const ctx = canvas.getContext('2d');

        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 595, 842);
        if (colorScheme === 'blue') {
          grad.addColorStop(0, '#f8fafc');
          grad.addColorStop(1, '#e2e8f0');
        } else {
          grad.addColorStop(0, '#f0fdf4');
          grad.addColorStop(1, '#dcfce7');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 595, 842);

        // Header Box
        ctx.fillStyle = colorScheme === 'blue' ? '#4f46e5' : '#059669';
        ctx.fillRect(40, 40, 515, 100);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(title, 60, 85);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '14px sans-serif';
        ctx.fillText(subtitle, 60, 115);

        // Decorative border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 160, 515, 620);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });
    };

    const blob1 = await createSampleCanvasJpeg('pdfBhai C++ WASM DOCUMENT', 'Page 1: Sample Technical Report Cover', 'blue');
    const blob2 = await createSampleCanvasJpeg('FINANCIAL ANALYTICS SHEET', 'Page 2: Executive Summary Document', 'green');

    const file1 = new File([blob1], 'sample_report_page1.jpg', { type: 'image/jpeg' });
    const file2 = new File([blob2], 'sample_summary_page2.jpg', { type: 'image/jpeg' });

    await handleAddAddSamplePages([file1, file2]);
  };

  const handleAddAddSamplePages = async (files) => {
    const samplePages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const dimensions = await getJpegDimensions(arrayBuffer);
      const previewUrl = URL.createObjectURL(file);

      samplePages.push({
        id: 'sample-' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        previewUrl,
        imageBytes: uint8Array,
        isBlank: false,
        width: dimensions.width,
        height: dimensions.height,
        texts: [
          {
            content: i === 0 ? "CONFIDENTIAL - pdfBhai DEMO" : "APPROVED BY AUDITOR",
            x: 60,
            y: 780,
            fontSize: 16
          }
        ]
      });
    }
    setPages(samplePages);
    setActivePageIndex(0);
  };

  // Compile PDF via Wasm C++ Engine
  const handleCompilePdf = async () => {
    if (pages.length === 0) {
      alert('Please add at least one page or JPEG image to compile.');
      return;
    }

    try {
      setIsCompiling(true);
      const { blobUrl, pdfBytes } = await generatePdfBlob(pages);
      setCompiledPdfUrl(blobUrl);
      setCompiledPdfBytes(pdfBytes);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('PDF Generation Failed:', err);
      alert('Error generating PDF: ' + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  // Download compiled PDF blob with user-specified filename
  const handleDownloadPdf = () => {
    if (!compiledPdfUrl) return;
    const filename = (pdfFilename.trim() || 'pdfBhai_document').replace(/\.pdf$/i, '') + '.pdf';
    const a = document.createElement('a');
    a.href = compiledPdfUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header / Navbar */}
      <Navbar 
        isWasmReady={isReady} 
        isWasmLoading={isLoading} 
        wasmError={wasmError}
        pdfFilename={pdfFilename}
        setPdfFilename={setPdfFilename}
      />

      {/* Main Single Screen Layout (Strictly Non-Scrollable) */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-4 flex flex-col overflow-hidden space-y-3">
        
        {/* Banner if no pages */}
        {pages.length === 0 && (
          <div className="glass-card p-4 rounded-xl border border-indigo-100 bg-white flex items-center justify-between gap-4 shadow-xs flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Welcome to pdfBhai
                </h2>
                <p className="text-xs text-slate-500">
                  Drag and drop JPEG images to build and annotate high-performance PDFs via C++ WASM.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Load Sample JPEGs
            </button>
          </div>
        )}

        {/* 2-Column Fixed Grid (Non-scrollable outer screen) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
          
          {/* Left Column: Image Uploader & Page Management (4 cols) */}
          <div className="lg:col-span-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <ImageUploader
              pages={pages}
              activePageIndex={activePageIndex}
              setActivePageIndex={setActivePageIndex}
              onAddImages={handleAddImages}
              onAddBlankPage={handleAddBlankPage}
              onRemovePage={handleRemovePage}
              onReorderPages={handleReorderPages}
            />
          </div>

          {/* Right Column: Interactive Canvas & Text Overlay Studio (8 cols) */}
          <div className="lg:col-span-8 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <InteractiveCanvas
              page={pages[activePageIndex]}
              onAddTextToPage={handleAddTextToPage}
              onRemoveTextFromPage={handleRemoveTextFromPage}
            />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <ActionBar
          onCompile={handleCompilePdf}
          onDownload={handleDownloadPdf}
          isCompiling={isCompiling}
          compiledPdfUrl={compiledPdfUrl}
          onOpenPreview={() => setIsPreviewOpen(true)}
          pageCount={pages.length}
          isWasmReady={isReady}
          pdfFilename={pdfFilename}
        />
      </main>

      {/* PDF Preview Modal */}
      {isPreviewOpen && (
        <PdfPreviewModal
          pdfUrl={compiledPdfUrl}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={handleDownloadPdf}
          pdfFilename={pdfFilename}
        />
      )}
    </div>
  );
}
