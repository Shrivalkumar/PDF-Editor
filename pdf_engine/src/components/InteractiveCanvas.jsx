import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Type, Plus, Trash2, ZoomIn, ZoomOut, Maximize2, Tag, Crosshair, HelpCircle } from 'lucide-react';

export function InteractiveCanvas({ page, onAddTextToPage, onRemoveTextFromPage }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [clickCoords, setClickCoords] = useState(null); // { canvasX, canvasY, pdfX, pdfY }
  const [zoom, setZoom] = useState(0.85); // slightly smaller default zoom to fit non-scrollable viewport perfectly
  const [hoveredStampIndex, setHoveredStampIndex] = useState(null);

  const pageWidth = page?.width || 595;
  const pageHeight = page?.height || 842;

  // Render page onto canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = pageWidth;
    canvas.height = pageHeight;

    // Clear background (crisp white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (page?.previewUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, pageWidth, pageHeight);
        drawOverlays(ctx);
      };
      img.src = page.previewUrl;
    } else {
      // Draw grid for blank page
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const step = 50;
      for (let x = 0; x < pageWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, pageHeight);
        ctx.stroke();
      }
      for (let y = 0; y < pageHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(pageWidth, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLANK A4 PAGE (595 × 842 pt)', pageWidth / 2, pageHeight / 2);

      drawOverlays(ctx);
    }
  }, [page, pageWidth, pageHeight, clickCoords, hoveredStampIndex]);

  // Draw text stamp markers & badges onto canvas
  const drawOverlays = (ctx) => {
    if (!page || !page.texts) return;

    page.texts.forEach((stamp, idx) => {
      // Convert PDF (0,0 bottom-left) back to Canvas Y (0,0 top-left)
      const cX = stamp.x;
      const cY = pageHeight - stamp.y;
      const isHovered = hoveredStampIndex === idx;

      ctx.save();
      ctx.strokeStyle = isHovered ? '#db2777' : '#2563eb';
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      
      // Crosshair pin
      ctx.beginPath();
      ctx.arc(cX, cY, 7, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cX - 10, cY);
      ctx.lineTo(cX + 10, cY);
      ctx.moveTo(cX, cY - 10);
      ctx.lineTo(cX, cY + 10);
      ctx.stroke();

      // Render actual stamped text preview on canvas
      ctx.font = `${stamp.fontSize || 14}px Helvetica, sans-serif`;
      ctx.fillStyle = isHovered ? '#9d174d' : '#1e3a8a';
      ctx.fillText(stamp.content, cX, cY);

      // Badge label box
      const badgeText = `#${idx + 1} (${Math.round(stamp.x)}, ${Math.round(stamp.y)})`;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(badgeText).width;

      ctx.fillStyle = isHovered ? 'rgba(219, 39, 119, 0.95)' : 'rgba(37, 99, 235, 0.9)';
      ctx.fillRect(cX + 10, cY - 16, textWidth + 8, 15);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(badgeText, cX + 14, cY - 5);
      ctx.restore();
    });

    // Draw active click selection pin
    if (clickCoords) {
      const { canvasX, canvasY } = clickCoords;
      ctx.save();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 10, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvasX - 14, canvasY);
      ctx.lineTo(canvasX + 14, canvasY);
      ctx.moveTo(canvasX, canvasY - 14);
      ctx.lineTo(canvasX, canvasY + 14);
      ctx.stroke();

      ctx.restore();
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Canvas Click to set coordinates
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = pageWidth / rect.width;
    const scaleY = pageHeight / rect.height;

    const canvasX = Math.round((e.clientX - rect.left) * scaleX);
    const canvasY = Math.round((e.clientY - rect.top) * scaleY);

    // Convert Canvas Y (top-left 0,0) to PDF Y (bottom-left 0,0)
    const pdfX = canvasX;
    const pdfY = pageHeight - canvasY;

    setClickCoords({ canvasX, canvasY, pdfX, pdfY });
  };

  const handleAddTextStamp = (e) => {
    e.preventDefault();
    if (!textInput.trim()) {
      alert('Please enter a text string for the annotation overlay.');
      return;
    }

    if (!clickCoords) {
      alert('Please click anywhere on the image canvas to pick coordinates first.');
      return;
    }

    onAddTextToPage(page.id, {
      content: textInput.trim(),
      x: clickCoords.pdfX,
      y: clickCoords.pdfY,
      fontSize: Number(fontSize) || 14
    });

    setTextInput('');
  };

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <Crosshair className="w-10 h-10 mb-2 text-slate-300 animate-pulse" />
        <p className="text-sm font-bold text-slate-700">No Page Selected</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select or upload a page from the left panel to begin editing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            Canvas ({pageWidth} &times; {pageHeight} pt)
          </span>

          {clickCoords && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono">
              <Crosshair className="w-3 h-3 text-amber-600 animate-spin" />
              <span>Selected Pos: X={clickCoords.pdfX}, Y={clickCoords.pdfY}</span>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-bold px-1 text-slate-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(0.85)}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-l border-slate-200 pl-1.5"
            title="Fit View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas View Area (Flexible container) */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-100/70 rounded-xl border border-slate-200 p-3 flex items-center justify-center relative shadow-inner min-h-0"
      >
        <div 
          className="relative transition-all duration-150 shadow-md rounded bg-white border border-slate-300 overflow-hidden"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair block"
          />
        </div>
      </div>

      {/* Text Annotation Input Panel */}
      <form onSubmit={handleAddTextStamp} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1 uppercase tracking-wider">
            <Type className="w-3.5 h-3.5 text-indigo-600" />
            Add Text Overlay
          </label>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Click canvas to pick coordinates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Text String Input */}
          <div className="sm:col-span-6">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={clickCoords ? "Enter text content..." : "Click canvas image to set position..."}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Font Size Input */}
          <div className="sm:col-span-3 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Font:</span>
            <input
              type="number"
              min="6"
              max="96"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400">pt</span>
          </div>

          {/* Add Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={!clickCoords}
              className="w-full h-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              Stamp Text
            </button>
          </div>
        </div>

        {/* Queued Text Markers for Current Page */}
        {page.texts && page.texts.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {page.texts.map((txt, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredStampIndex(idx)}
                  onMouseLeave={() => setHoveredStampIndex(null)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-400 text-[11px] text-slate-800 transition-all shadow-2xs"
                >
                  <span className="font-mono text-indigo-600 font-bold">#{idx + 1}</span>
                  <span className="font-semibold max-w-[120px] truncate">"{txt.content}"</span>
                  <span className="text-[10px] text-slate-400 font-mono">({Math.round(txt.x)}, {Math.round(txt.y)})</span>
                  <button
                    onClick={() => onRemoveTextFromPage(page.id, idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50"
                    title="Remove Text"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
