import React, { useState } from 'react';
import { Cpu, Loader2, AlertCircle, Edit3, FileText, Check } from 'lucide-react';

export function Navbar({ 
  isWasmReady, 
  isWasmLoading, 
  wasmError, 
  pdfFilename, 
  setPdfFilename 
}) {
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3 shadow-sm flex-shrink-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Editable Document Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  pdf<span className="gradient-text">Bhai</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  C++ WASM
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Editable PDF Name Input */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-all group">
            <FileText className="w-4 h-4 text-indigo-600" />
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={pdfFilename}
                  onChange={(e) => setPdfFilename(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="bg-white px-2 py-0.5 rounded border border-indigo-400 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-44"
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 cursor-pointer"
                title="Click to rename output PDF file"
              >
                <span className="text-xs font-bold text-slate-700 max-w-[180px] truncate">
                  {pdfFilename || 'pdfBhai_document'}
                </span>
                <span className="text-xs font-mono font-medium text-slate-400">.pdf</span>
                <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            )}
          </div>
        </div>

        {/* Engine Status Pill */}
        <div className="flex items-center gap-3">
          {isWasmLoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              Loading Engine...
            </div>
          )}

          {isWasmReady && !isWasmLoading && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Engine Ready
            </div>
          )}

          {wasmError && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Engine Error
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
