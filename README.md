# 📄 pdfBhai

> **High-Performance WebAssembly C++ PDF Engine & Interactive Annotation Studio**

`pdfBhai` is a client-side WebAssembly PDF creation and editing platform built with **React**, **Tailwind CSS**, and a **C++20 PDF Engine** compiled directly into WebAssembly (`.wasm`).

Because the C++ engine runs 100% inside your browser's WebAssembly runtime, document processing is zero-latency, private, and requires **no external backend server** .

---

## ✨ Features

- ⚡ **WebAssembly C++ Core** : Pure C++20 PDF generation engine running directly in browser memory via Emscripten.
- 🖼️ **JPEG & Image Ingestion**: Drag-and-drop single or multi JPEG images with automatic dimension extraction.
- 📄 **Blank Page Support**: Generate custom A4 blank pages and mix them with image pages.
- 🎯 **Interactive Point-and-Click Canvas**: Click anywhere on an image canvas to place text overlays with exact Cartesian PDF coordinate mapping.
- ✏️ **Custom Document Renaming**: Easily rename the output PDF before downloading.
- 👁️ **Instant PDF Preview**: Embedded live PDF viewer modal powered by compiled blob URLs.
- 🔒 **100% Client-Side & Private**: Your images and documents never leave your browser or get uploaded to any server.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## 🛠️ Building & Recompiling WebAssembly

The repository already includes precompiled WASM binaries in `public/pdf_engine.js` and `public/pdf_engine.wasm`.

If you have [Emscripten](https://emscripten.org/) installed and want to recompile the C++ source code:

```bash
npm run build:wasm
```
*(Or execute `bash build_wasm.sh` directly)*

### Production Web Build
To build the production React bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📂 Project Architecture

```
├── include/                   # Original C++ PDF Engine headers
│   ├── byte_buffer.hpp
│   ├── pdf_engine.hpp
│   └── pdf_objects.hpp
├── src/                       # C++ engine sources & Wasm C-API wrapper
│   ├── byte_buffer.cpp
│   ├── pdf_engine.cpp
│   ├── wasm_wrapper.cpp       # C-API wrapper (extern "C")
│   ├── App.jsx                # Main React application
│   ├── usePdfEngine.js        # Custom React WASM loader hook
│   └── components/            # UI components (Canvas, Uploader, Navbar, etc.)
├── public/
│   ├── pdf_engine.js          # Emscripten JS bridge
│   └── pdf_engine.wasm        # Compiled C++ WebAssembly binary
├── build_wasm.sh              # Emscripten build script
├── vite.config.js             # Vite configuration
└── package.json
```

---

## 🌐 Deploying to Vercel

`pdfBhai` can be deployed to Vercel in 1 click without needing C++ or Emscripten compilers on Vercel's build server.

### Vercel Project Settings:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## 📜 License

MIT License
