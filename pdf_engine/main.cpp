#include <iostream>
#include <fstream>
#include "pdf_engine.hpp"

int main() {
    PdfEngine engine;
    
    std::cout << "[Step 5 - Fixed] Generating valid A4 canvas text layer entries...\n";
    engine.init_pdf();

    engine.add_blank_page(595, 842);
    
    engine.add_text_to_last_page("Hello World! Custom C++ PDF Engine Operating Flawlessly.", 50, 750, 14);
    engine.add_text_to_last_page("This text layer is fully editable and spec-compliant.", 50, 720, 12);
    
    engine.close_pdf();
    
    const auto& compiled_bytes = engine.get_compiled_bytes();
    std::ofstream outfile("edited_output.pdf", std::ios::binary);
    outfile.write(reinterpret_cast<const char*>(compiled_bytes.data()), compiled_bytes.size());
    outfile.close();
    
    std::cout << "[SUCCESS] File 'edited_output.pdf' generated with proper canvas rules!\n";
    return 0;
}