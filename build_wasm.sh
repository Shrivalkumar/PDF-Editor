#!/bin/bash
set -e

mkdir -p public

echo "Building WebAssembly binary and JavaScript bridge with Emscripten (em++)..."

em++ -O3 -std=c++20 \
  -I./include \
  src/byte_buffer.cpp \
  src/pdf_engine.cpp \
  src/wasm_wrapper.cpp \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_pdf_engine_create","_pdf_engine_free","_pdf_engine_init","_pdf_engine_add_blank_page","_pdf_engine_add_image_page","_pdf_engine_add_text","_pdf_engine_close","_pdf_engine_get_bytes","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","getValue","setValue","HEAPU8","HEAP32","HEAPU32"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o public/pdf_engine.js

echo "Build complete! Artifacts generated in public/pdf_engine.js and public/pdf_engine.wasm"
