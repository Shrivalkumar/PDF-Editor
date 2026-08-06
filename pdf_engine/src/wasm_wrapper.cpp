#include "pdf_engine.hpp"
#include <cstdint>
#include <cstdlib>

extern "C" {

    PdfEngine* pdf_engine_create() {
        return new PdfEngine();
    }

    void pdf_engine_free(PdfEngine* engine) {
        delete engine;
    }

    void pdf_engine_init(PdfEngine* engine) {
        if (engine) engine->init_pdf();
    }

    void pdf_engine_add_blank_page(PdfEngine* engine, uint32_t width, uint32_t height) {
        if (engine) engine->add_blank_page(width, height);
    }

    void pdf_engine_add_image_page(PdfEngine* engine, const uint8_t* jpeg_data, size_t size) {
        if (engine) {
            std::vector<uint8_t> buffer(jpeg_data, jpeg_data + size);
            engine->add_image_page(buffer);
        }
    }

    void pdf_engine_add_text(PdfEngine* engine, const char* text, double x, double y, double font_size) {
        if (engine && text) {
            engine->add_text_to_last_page(std::string(text), x, y, font_size);
        }
    }

    void pdf_engine_close(PdfEngine* engine) {
        if (engine) engine->close_pdf();
    }

    const uint8_t* pdf_engine_get_bytes(PdfEngine* engine, size_t* out_size) {
        if (!engine || !out_size) return nullptr;
        const auto& bytes = engine->get_compiled_bytes();
        *out_size = bytes.size();
        return bytes.data();
    }
}
