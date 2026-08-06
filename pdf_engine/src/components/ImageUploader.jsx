import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, FilePlus, Layers } from 'lucide-react';

export function ImageUploader({ 
  pages, 
  activePageIndex, 
  setActivePageIndex, 
  onAddImages, 
  onAddBlankPage, 
  onRemovePage, 
  onReorderPages 
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const validJpegs = Array.from(files).filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.match(/\.(jpg|jpeg)$/i)
    );
    if (validJpegs.length > 0) {
      onAddImages(validJpegs);
    } else {
      alert('Please upload JPEG images (.jpg or .jpeg) as supported by the C++ PDF Engine.');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 flex-shrink-0">
        <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          Pages ({pages.length})
        </h2>
        <button
          onClick={onAddBlankPage}
          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center gap-1 transition-all"
          title="Add A4 Blank Page"
        >
          <FilePlus className="w-3.5 h-3.5 text-indigo-600" />
          + Blank Page
        </button>
      </div>

      {/* Drag & Drop Zone (Compact) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex-shrink-0 ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]' 
            : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center justify-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-700">
              Upload JPEG Images
            </p>
            <p className="text-[10px] text-slate-400">
              Drag &amp; drop or click to browse
            </p>
          </div>
        </div>
      </div>

      {/* Pages Scrollable Sub-list */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
        {pages.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
            <ImageIcon className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <p className="text-xs font-semibold text-slate-600">No pages yet</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Upload JPEGs to start.</p>
          </div>
        ) : (
          pages.map((page, index) => {
            const isActive = index === activePageIndex;
            return (
              <div
                key={page.id}
                onClick={() => setActivePageIndex(index)}
                className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Page Number Badge */}
                <div className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {index + 1}
                </div>

                {/* Page Thumbnail */}
                <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                  {page.previewUrl ? (
                    <img src={page.previewUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[9px] text-slate-400 font-mono text-center p-0.5">
                      BLANK
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {page.name || `Page ${index + 1}`}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <span>{page.width || 595}&times;{page.height || 842}</span>
                    <span>&bull;</span>
                    <span className="text-indigo-600 font-medium">{page.texts.length} Text Stamp{page.texts.length === 1 ? '' : 's'}</span>
                  </div>
                </div>

                {/* Page Controls */}
                <div className="flex items-center gap-0.5 opacity-90 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderPages(index, index - 1);
                    }}
                    disabled={index === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderPages(index, index + 1);
                    }}
                    disabled={index === pages.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePage(index);
                    }}
                    className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
