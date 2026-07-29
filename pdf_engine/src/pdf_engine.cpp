#include "pdf_engine.hpp"
#include <cstdio>


PdfEngine::PdfEngine(){
    //object 0 should be freee
    xref_table.push_back({0, 65535, 'f'});
}

void PdfEngine::init_pdf(){
    buffer.append("%PDF-1.4\n");
    buffer.append("%\xE2\xE3\xCF\xD3\n");
    
    catalog_id = assign_id();
    pages_tree_id = assign_id();
}

uint32_t PdfEngine::assign_id(){
    return next_object_id++;
}

void PdfEngine::record_xref(uint32_t id) {
    if (xref_table.size() <= id) {
        xref_table.resize(id + 1);
    }
    xref_table[id] = { buffer.current_position(), 0, 'n' };
}


bool PdfEngine::extract_jpeg_dimensions(const std::vector<uint8_t>& jpeg, uint32_t& width, uint32_t& height) {
    size_t i = 0;
    if(jpeg.size() < 4 || jpeg[0] != 0xFF || jpeg[1] != 0xD8){//not a valid jpeg header
        return false;
     } 
    
    i += 2;
    while(i < jpeg.size()){
        if(jpeg[i] != 0xFF){
            return false;
        }
        uint8_t marker = jpeg[i + 1];
        i += 2;
        
        
        if(marker == 0xC0 ||marker == 0xC2){
            if (i + 5 >= jpeg.size()) return false;
            height = (jpeg[i + 3] << 8) | jpeg[i + 4];
            width = (jpeg[i + 5] << 8) | jpeg[i + 6];
            return true;
        }else{
            if (i + 1 >= jpeg.size()) return false;
            uint16_t length = (jpeg[i] << 8) | jpeg[i + 1];
            i += length;
        }
    }
    return false;
}

void PdfEngine::add_image_page(const std::vector<uint8_t>& raw_jpeg_bytes){
    uint32_t img_w = 595, img_h = 842; //default A4 dims
    extract_jpeg_dimensions(raw_jpeg_bytes, img_w, img_h);

    uint32_t page_id = assign_id();
    uint32_t content_id = assign_id();
    uint32_t image_id = assign_id();
    
    page_ids.push_back(page_id);
    std::string resource_tag = "Im" + std::to_string(built_images.size() + 1);


    PdfPage page{
        page_id, 
        {pages_tree_id}, 
        img_w, 
        img_h, 
        std::vector<PdfRef>{ {content_id} }, 
        resource_tag, 
        {image_id},
        "",
        {0}
    };
    
    PdfPageContentStream content{content_id, img_w, img_h, resource_tag};
    PdfImageXObject img_obj{image_id, img_w, img_h, raw_jpeg_bytes};

    built_pages.push_back(page);
    built_image_contents.push_back(content);
    built_images.push_back(img_obj);
}

void PdfEngine::add_text_to_last_page(const std::string& text, double x, double y, double font_size){
    if(built_pages.empty()){
        return; 
    }


    uint32_t font_id;
    std::string font_tag = "F1";
    if (built_fonts.empty()) {
        font_id = assign_id();
        built_fonts.push_back(PdfFontObject{font_id, font_tag, "Helvetica"});
    } else {
        font_id = built_fonts[0].id;
    }


    uint32_t text_content_id = assign_id();
    PdfTextContentStream text_stream{text_content_id, text, x, y, font_size, font_tag};
    built_text_contents.push_back(text_stream);

   
    PdfPage& last_page = built_pages.back();
    last_page.content_stream_refs.push_back({text_content_id});
    last_page.font_resource_name = font_tag;
    last_page.font_object_ref = {font_id};
}

void PdfEngine::close_pdf() {
    //Serilazie the structural nodes
    for (const auto& page : built_pages) {
        record_xref(page.id);
        buffer.append(page.serialize());
    }

   
    for(const auto& content : built_image_contents){
        record_xref(content.id);
        buffer.append(content.serialize());
    }


    for(const auto& text_stream : built_text_contents){
        record_xref(text_stream.id);
        buffer.append(text_stream.serialize());
    }

    
    for(const auto& img : built_images){
        record_xref(img.id);
        buffer.append(img.serialize_header());
        buffer.append(img.raw_jpeg_bytes);
        buffer.append(img.serialize_footer());
    }

   
    for(const auto& font : built_fonts){
        record_xref(font.id);
        buffer.append(font.serialize());
    }

   
    record_xref(catalog_id);
    PdfCatalog catalog{catalog_id, {pages_tree_id}};
    buffer.append(catalog.serialize());

    record_xref(pages_tree_id);
    PdfPagesTree pages_tree{pages_tree_id, {}};
    for (uint32_t pid : page_ids) {
        pages_tree.page_references.push_back({pid});
    }
    buffer.append(pages_tree.serialize());

   //building table and trailer
    size_t xref_start = buffer.current_position();
    buffer.append("xref\n");
    buffer.append("0 " + std::to_string(next_object_id) + "\n");
    
    for(size_t i=0;i<next_object_id;i++){
        char entry_buf[22];
        std::snprintf(entry_buf, sizeof(entry_buf), "%010zu %05u %c \n", 
                     xref_table[i].byte_offset, 
                     xref_table[i].generation, 
                     xref_table[i].status);
        buffer.append(entry_buf);
    }
    
    buffer.append("trailer\n");
    buffer.append("<< /Size " + std::to_string(next_object_id) + "\n");
    buffer.append("   /Root " + std::to_string(catalog_id) + " 0 R\n");
    buffer.append(" >>\n");
    
    buffer.append("startxref\n");
    buffer.append(std::to_string(xref_start) + "\n");
    buffer.append("%%EOF\n");
}

const std::vector<uint8_t>& PdfEngine::get_compiled_bytes() const{
    return buffer.get_data();
}
void PdfEngine::add_blank_page(uint32_t width, uint32_t height) {
    uint32_t page_id = assign_id();
    page_ids.push_back(page_id);

    PdfPage page{
        page_id, 
        {pages_tree_id}, 
        width, 
        height, 
        std::vector<PdfRef>{}, 
        "", {0}, "", {0}
    };
    built_pages.push_back(page);
}