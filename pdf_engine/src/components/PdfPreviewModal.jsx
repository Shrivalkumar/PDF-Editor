import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

export function PdfPreviewModal({ pdfUrl, onClose, onDownload, pdfFilename }) {
  if (!pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {pdfFilename || 'pdfBhai_document'}.pdf
              </h3>
              <p className="text-xs text-slate-500">
                Compiled via pdfBhai WebAssembly C++ Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open New Tab
            </a>
            <button
              onClick={onDownload}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 bg-slate-100 p-2">
          <iframe
            src={pdfUrl}
            title="PDF Preview"
            className="w-full h-full rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
