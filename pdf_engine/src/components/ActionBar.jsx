import React from 'react';
import { Play, Download, Eye, Loader2, FileCheck } from 'lucide-react';

export function ActionBar({ 
  onCompile, 
  onDownload, 
  isCompiling, 
  compiledPdfUrl, 
  onOpenPreview,
  pageCount,
  isWasmReady,
  pdfFilename
}) {
  return (
    <div className="bg-white border-t border-slate-200 px-6 py-3 shadow-md flex-shrink-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Pipeline Status */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
          <FileCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Compilation Pipeline
          </h3>
          <p className="text-[11px] text-slate-500">
            {pageCount} page{pageCount === 1 ? '' : 's'} queued &bull; {compiledPdfUrl ? `Compiled binary ready as ${pdfFilename || 'pdfBhai_document'}.pdf` : 'Ready to compile with C++ Wasm'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        {/* Compile & Generate PDF */}
        <button
          onClick={onCompile}
          disabled={isCompiling || pageCount === 0 || !isWasmReady}
          className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:transform-none disabled:cursor-not-allowed"
        >
          {isCompiling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              Compiling WASM...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Compile &amp; Generate PDF
            </>
          )}
        </button>

        {/* View Preview */}
        {compiledPdfUrl && (
          <button
            onClick={onOpenPreview}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 transition-all"
            title="Preview PDF Document"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            Preview PDF
          </button>
        )}

        {/* Download PDF */}
        <button
          onClick={onDownload}
          disabled={!compiledPdfUrl}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs ${
            compiledPdfUrl
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
