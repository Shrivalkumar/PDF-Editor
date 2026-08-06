import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for initializing and interacting with the Emscripten C++ WebAssembly PDF Engine.
 */
export function usePdfEngine() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const moduleRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEngine() {
      try {
        setIsLoading(true);
        setError(null);

        // Check if script is already present
        let script = document.querySelector('script[src="/pdf_engine.js"]');
        
        if (!script) {
          script = document.createElement('script');
          script.src = '/pdf_engine.js';
          script.async = true;
          document.body.appendChild(script);
        }

        // We can attach Module configuration or wait for onRuntimeInitialized
        const initModule = () => {
          return new Promise((resolve, reject) => {
            if (window.Module && window.Module.calledRun) {
              resolve(window.Module);
              return;
            }

            const oldOnInit = window.Module ? window.Module.onRuntimeInitialized : null;
            
            window.Module = {
              ...(window.Module || {}),
              onRuntimeInitialized: () => {
                if (oldOnInit) oldOnInit();
                resolve(window.Module);
              },
              onAbort: (err) => {
                reject(new Error(err || 'WebAssembly Module initialization aborted.'));
              }
            };

            // If Module is exported as a function (MODULARIZE mode)
            if (typeof window.pdf_engine === 'function') {
              window.pdf_engine().then(resolve).catch(reject);
            }
          });
        };

        const loadedModule = await initModule();
        
        if (isMounted) {
          moduleRef.current = loadedModule;
          setIsReady(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load WASM PDF Engine:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load WebAssembly engine.');
          setIsLoading(false);
        }
      }
    }

    loadEngine();

    return () => {
      isMounted = false;
    };
  }, []);

  const getModule = useCallback(() => {
    if (!moduleRef.current) {
      throw new Error('WebAssembly PDF Engine module is not loaded yet.');
    }
    return moduleRef.current;
  }, []);

  // Safe accessor for Emscripten Heap memory Uint8Array
  const getHeapU8 = useCallback((mod) => {
    if (mod.HEAPU8) return mod.HEAPU8;
    if (mod.buffer) return new Uint8Array(mod.buffer);
    if (mod.wasmMemory && mod.wasmMemory.buffer) return new Uint8Array(mod.wasmMemory.buffer);
    throw new Error('Emscripten HEAPU8 memory is not accessible on Module.');
  }, []);

  const createEngine = useCallback(() => {
    const mod = getModule();
    const fn = mod.cwrap ? mod.cwrap('pdf_engine_create', 'number', []) : mod._pdf_engine_create;
    return fn();
  }, [getModule]);

  const freeEngine = useCallback((enginePtr) => {
    if (!enginePtr) return;
    const mod = getModule();
    const fn = mod.cwrap ? mod.cwrap('pdf_engine_free', null, ['number']) : mod._pdf_engine_free;
    fn(enginePtr);
  }, [getModule]);

  const initPdf = useCallback((enginePtr) => {
    const mod = getModule();
    const fn = mod.cwrap ? mod.cwrap('pdf_engine_init', null, ['number']) : mod._pdf_engine_init;
    fn(enginePtr);
  }, [getModule]);

  const addBlankPage = useCallback((enginePtr, width = 595, height = 842) => {
    const mod = getModule();
    const fn = mod.cwrap ? mod.cwrap('pdf_engine_add_blank_page', null, ['number', 'number', 'number']) : mod._pdf_engine_add_blank_page;
    fn(enginePtr, width, height);
  }, [getModule]);

  const addImagePage = useCallback((enginePtr, jpegUint8Array) => {
    const mod = getModule();
    const size = jpegUint8Array.length;
    const bufferPtr = mod._malloc(size);
    try {
      const heap = getHeapU8(mod);
      heap.set(jpegUint8Array, bufferPtr);
      const fn = mod.cwrap ? mod.cwrap('pdf_engine_add_image_page', null, ['number', 'number', 'number']) : mod._pdf_engine_add_image_page;
      fn(enginePtr, bufferPtr, size);
    } finally {
      mod._free(bufferPtr);
    }
  }, [getModule, getHeapU8]);

  const addText = useCallback((enginePtr, textStr, x, y, fontSize = 14) => {
    const mod = getModule();
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(textStr + '\0');
    const textPtr = mod._malloc(textBytes.length);
    try {
      const heap = getHeapU8(mod);
      heap.set(textBytes, textPtr);
      const fn = mod.cwrap 
        ? mod.cwrap('pdf_engine_add_text', null, ['number', 'number', 'number', 'number', 'number']) 
        : mod._pdf_engine_add_text;
      fn(enginePtr, textPtr, x, y, fontSize);
    } finally {
      mod._free(textPtr);
    }
  }, [getModule, getHeapU8]);

  const closePdf = useCallback((enginePtr) => {
    const mod = getModule();
    const fn = mod.cwrap ? mod.cwrap('pdf_engine_close', null, ['number']) : mod._pdf_engine_close;
    fn(enginePtr);
  }, [getModule]);

  const getBytes = useCallback((enginePtr) => {
    const mod = getModule();
    const sizePtr = mod._malloc(4);
    try {
      const getBytesFn = mod.cwrap 
        ? mod.cwrap('pdf_engine_get_bytes', 'number', ['number', 'number'])
        : mod._pdf_engine_get_bytes;
      
      const dataPtr = getBytesFn(enginePtr, sizePtr);
      
      let size = 0;
      if (mod.getValue) {
        size = mod.getValue(sizePtr, 'i32');
      } else if (mod.HEAPU32) {
        size = mod.HEAPU32[sizePtr >> 2];
      } else {
        const u32 = new Uint32Array((mod.buffer || mod.wasmMemory.buffer), sizePtr, 1);
        size = u32[0];
      }

      if (!dataPtr || size === 0) {
        return new Uint8Array(0);
      }

      const heap = getHeapU8(mod);
      const view = new Uint8Array(heap.buffer, dataPtr, size);
      return view.slice(); // Return isolated JS Uint8Array copy
    } finally {
      mod._free(sizePtr);
    }
  }, [getModule, getHeapU8]);

  /**
   * Helper function to execute complete PDF compilation lifecycle for a set of pages.
   * @param {Array<{imageBytes?: Uint8Array, isBlank?: boolean, width?: number, height?: number, texts?: Array<{content: string, x: number, y: number, fontSize: number}>}>} pages 
   * @returns {{ blobUrl: string, pdfBytes: Uint8Array }}
   */
  const generatePdfBlob = useCallback(async (pages) => {
    let enginePtr = null;
    try {
      enginePtr = createEngine();
      initPdf(enginePtr);

      for (const page of pages) {
        if (page.imageBytes && page.imageBytes.length > 0) {
          addImagePage(enginePtr, page.imageBytes);
        } else if (page.isBlank) {
          addBlankPage(enginePtr, page.width || 595, page.height || 842);
        }

        if (page.texts && Array.isArray(page.texts)) {
          for (const txt of page.texts) {
            if (txt.content && txt.content.trim() !== '') {
              // Convert Canvas/Screen Y to PDF Cartesian Y (PDF Y=0 is bottom)
              addText(enginePtr, txt.content, txt.x, txt.y, txt.fontSize || 14);
            }
          }
        }
      }

      closePdf(enginePtr);
      const pdfBytes = getBytes(enginePtr);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      return { blobUrl, pdfBytes };
    } finally {
      if (enginePtr) {
        freeEngine(enginePtr);
      }
    }
  }, [createEngine, initPdf, addImagePage, addBlankPage, addText, closePdf, getBytes, freeEngine]);

  return {
    isReady,
    isLoading,
    error,
    createEngine,
    freeEngine,
    initPdf,
    addBlankPage,
    addImagePage,
    addText,
    closePdf,
    getBytes,
    generatePdfBlob
  };
}
