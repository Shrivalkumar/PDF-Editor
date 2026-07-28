#include "pdf_engine.hpp"
#include <cstdio>

PdfEngine::PdfEngine() {
    //object 0 should be freee
    xref_table.push_back({0, 65535, 'f'});
}

void PdfEngine::init_pdf(){
    buffer.append("%PDF-1.4\n");
    buffer.append("%\xE2\xE3\xCF\xD3\n");


    catalog_id = assign_id();
    pages_tree_id = assign_id();
}

uint32_t PdfEngine::assign_id() {
    return next_object_id++;
}

void PdfEngine::record_xref(uint32_t id) {
    if (xref_table.size() <= id) {
        xref_table.resize(id + 1);
    }
    xref_table[id] = { buffer.current_position(), 0, 'n' };
}

void PdfEngine::add_blank_page(uint32_t width, uint32_t height) {
    uint32_t page_id = assign_id();
    page_ids.push_back(page_id);
    

    record_xref(page_id);
    PdfPage page{page_id, {pages_tree_id}, width, height};
    buffer.append(page.serialize());
}

void PdfEngine::close_pdf() {
    //serialize the structural nodes
    record_xref(catalog_id);
    PdfCatalog catalog{catalog_id, {pages_tree_id}};
    buffer.append(catalog.serialize());

    record_xref(pages_tree_id);
    PdfPagesTree pages_tree{pages_tree_id, {}};
    for (uint32_t pid : page_ids) {
        pages_tree.page_references.push_back({pid});
    }
    buffer.append(pages_tree.serialize());

    
    //writing teh xref table
    size_t xref_start = buffer.current_position();
    buffer.append("xref\n");
    buffer.append("0 " + std::to_string(next_object_id) + "\n");
    
    for (size_t i = 0; i < next_object_id; ++i) {
        char entry_buf[22];
        std::snprintf(entry_buf, sizeof(entry_buf), "%010zu %05u %c \n", 
                     xref_table[i].byte_offset, 
                     xref_table[i].generation, 
                     xref_table[i].status);
        buffer.append(entry_buf);
    }
    
    //writing the trailer
    buffer.append("trailer\n");
    buffer.append("<< /Size " + std::to_string(next_object_id) + "\n");
    buffer.append("   /Root " + std::to_string(catalog_id) + " 0 R\n");
    buffer.append(" >>\n");
    
    buffer.append("startxref\n");
    buffer.append(std::to_string(xref_start) + "\n");
    buffer.append("%%EOF\n");
}

const std::vector<uint8_t>& PdfEngine::get_compiled_bytes() const {
    return buffer.get_data();
}