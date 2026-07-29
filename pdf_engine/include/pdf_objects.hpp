#ifndef PDF_OBJECTS_HPP
#define PDF_OBJECTS_HPP

#include <string>
#include <vector>
#include <cstdint>
#include <sstream>

//the cross reference tag
struct PdfRef{
    uint32_t id;
    std::string to_string() const {
        return std::to_string(id) + " 0 R";
    }
};

class PdfCatalog{
public:
    uint32_t id;
    PdfRef pages_tree_ref;

    std::string serialize() const{
        return std::to_string(id) + " 0 obj\n""<< /Type /Catalog /Pages " + pages_tree_ref.to_string() + " >>\n""endobj\n";
    }

};
class PdfPagesTree {
public:
    uint32_t id;
    std::vector<PdfRef> page_references;

    std::string serialize() const {
        std::string kids = "[";
        for (size_t i = 0; i < page_references.size(); ++i) {
            kids += page_references[i].to_string() + (i == page_references.size() - 1 ? "" : " ");
        }
        kids += "]";

        return std::to_string(id) + " 0 obj\n"
               "<< /Type /Pages /Kids " + kids + " /Count " + std::to_string(page_references.size()) + " >>\n"
               "endobj\n";
    }
};


class PdfPageContentStream {
public:
    uint32_t id;
    uint32_t width;
    uint32_t height;
    std::string img_resource_name;

    std::string serialize() const{
        std::string commands = "q\n" + std::to_string(width) + " 0 0 " + std::to_string(height) + " 0 0 cm\n/" +img_resource_name + " Do\nQ\n";

        std::ostringstream ss;
        ss << id << " 0 obj\n"
           << "<< /Length " << commands.length() << " >>\n"
           << "stream\n" << commands << "endstream\nendobj\n";
        return ss.str();
    }
};

//binary image data container inside the pdf body
class PdfImageXObject {
public:
    uint32_t id;
    uint32_t width;
    uint32_t height;
    std::vector<uint8_t> raw_jpeg_bytes;

    std::string serialize_header() const {
        std::ostringstream ss;
        ss << id << " 0 obj\n"
           << "<< /Type /XObject /Subtype /Image /Width " << width 
           << " /Height " << height << " /ColorSpace /DeviceRGB /BitsPerComponent 8 "
           << "/Filter /DCTDecode /Length " << raw_jpeg_bytes.size() << " >>\n"
           << "stream\n";
        return ss.str();
    }

    std::string serialize_footer() const {
        return "\nendstream\nendobj\n";
    }
};

class PdfPage{
public:
    uint32_t id;
    PdfRef parent_tree_ref;
    uint32_t width;
    uint32_t height;
    std::vector<PdfRef> content_stream_refs;
    

    std::string img_resource_name;
    PdfRef img_xobject_ref;
    std::string font_resource_name;
    PdfRef font_object_ref;

    std::string serialize() const{
        std::ostringstream ss;
        ss << id << " 0 obj\n"
           << "<< /Type /Page /Parent " << parent_tree_ref.to_string() << "\n"
           << "   /MediaBox [0 0 " << width << " " << height << "]\n";
        
        if(content_stream_refs.size() == 1){
            ss << "   /Contents " << content_stream_refs[0].to_string() << "\n";
        } else {
            ss << "   /Contents [";
            for (const auto& ref : content_stream_refs) ss << ref.to_string() << " ";
            ss << "]\n";
        }
        

        ss << "   /Resources <<\n";
        if(!img_resource_name.empty()){
            ss << "      /XObject << /" << img_resource_name << " " << img_xobject_ref.to_string() << " >>\n";
        }
        if(!font_resource_name.empty()){
            ss << "      /Font << /" << font_resource_name << " " << font_object_ref.to_string() << " >>\n";
        }
        ss << "   >>\n";
        
        ss << " >>\nendobj\n";
        return ss.str();
    }
};

class PdfFontObject{
public:
    uint32_t id;
    std::string font_tag; 
    std::string base_font = "Helvetica";

    std::string serialize() const{
        return std::to_string(id) + " 0 obj\n"
               "<< /Type /Font\n"
               "   /Subtype /Type1\n"
               "   /BaseFont /" + base_font + "\n"
               ">>\n"
               "endobj\n";
    }
};

// Represents a text overlay vector command stream
class PdfTextContentStream{
public:
    uint32_t id;
    std::string text_content;
    double x_coord;
    double y_coord;
    double font_size;
    std::string font_tag; 

    std::string serialize() const {
        std::string commands = "BT\n"
                               "/" + font_tag + " " + std::to_string(font_size) + " Tf\n"
                               + std::to_string(x_coord) + " " + std::to_string(y_coord) + " Td\n"
                               "(" + text_content + ") Tj\n"
                               "ET\n";

        std::ostringstream ss;
        ss << id << " 0 obj\n"
           << "<< /Length " << commands.length() << " >>\n"
           << "stream\n" << commands << "endstream\nendobj\n";
        return ss.str();
    }
};

#endif