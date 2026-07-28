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

    uint32_t assign_id();
    void record_xref(uint32_t id);

public:
    PdfEngine();

    void init_pdf();

    void add_blank_page(uint32_t width = 595, uint32_t height = 842);
    
    void close_pdf();

    const std::vector<uint8_t>& get_compiled_bytes() const;
};

#endif 