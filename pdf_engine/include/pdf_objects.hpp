#ifndef PDF_OBJECTS_HPP
#define PDF_OBJECTS_HPP

#include <string>
#include <vector>
#include <cstdint>

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

class PdfPagesTree{
public:
    uint32_t id;
    std::vector<PdfRef> page_references;

    std::string serialize() const{
        std::string kids = "[";
        for (size_t i = 0; i < page_references.size(); ++i) {
            kids += page_references[i].to_string() + (i == page_references.size() - 1 ? "" : " ");
        }
        kids += "]";

        return std::to_string(id) + " 0 obj\n""<< /Type /Pages /Kids " + kids + " /Count " + std::to_string(page_references.size()) + " >>\n""endobj\n";
    }
};

class PdfPage{
public:
    uint32_t id;
    PdfRef parent_tree_ref;
    //the a4 dimensions
    uint32_t width = 595;   
    uint32_t height = 842; 

    std::string serialize() const{
        return std::to_string(id) + " 0 obj\n"
               "<< /Type /Page /Parent " + parent_tree_ref.to_string() + "\n"
               "   /MediaBox [0 0 " + std::to_string(width) + " " + std::to_string(height) + "]\n"
               "   /Resources << >>\n" 
               " >>\n"
               "endobj\n";
    }
};

#endif