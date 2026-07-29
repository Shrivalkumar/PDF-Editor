#ifndef PDF_ENGINE_HPP
#define PDF_ENGINE_HPP

#include <vector>
#include <string>
#include <cstdint>
#include "byte_buffer.hpp"
#include "pdf_objects.hpp"

struct XRefEntry {
    size_t byte_offset;
    uint32_t generation;
    char status; 
};

class PdfEngine {
private:
    ByteBuffer buffer;
    uint32_t next_object_id = 1;
    std::vector<XRefEntry> xref_table;

    uint32_t catalog_id = 0;
    uint32_t pages_tree_id = 0;
    std::vector<uint32_t> page_ids;

    std::vector<PdfPage> built_pages;
    std::vector<PdfImageXObject> built_images;
    std::vector<PdfFontObject> built_fonts;
    std::vector<PdfPageContentStream> built_image_contents;
    std::vector<PdfTextContentStream> built_text_contents;

    uint32_t assign_id();
    void record_xref(uint32_t id);
    bool extract_jpeg_dimensions(const std::vector<uint8_t>& jpeg, uint32_t& width, uint32_t& height);

public:
    PdfEngine();

    void init_pdf();
    

    void add_blank_page(uint32_t width = 595, uint32_t height = 842);
    
    void add_image_page(const std::vector<uint8_t>& raw_jpeg_bytes);
    void add_text_to_last_page(const std::string& text, double x, double y, double font_size = 12.0);
    
    void close_pdf();
    const std::vector<uint8_t>& get_compiled_bytes() const;
};

#endif 