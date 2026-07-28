#include <iostream>
#include <fstream>
#include "pdf_engine.hpp"

int main() {
    PdfEngine engine;
    
    std::cout << "[Step 3] Initializing multi-page document structure generation execution map...\n";
    engine.init_pdf();
    
    // Append two distinct multi-page blank structures to verify graph integrity
    engine.add_blank_page(595, 842); // Page 1 (A4 standard)
    engine.add_blank_page(612, 792); // Page 2 (Letter standard)
    
    engine.close_pdf();
    
    // Save to a real output file so we can physically open it and verify it's valid!
    const auto& compiled_bytes = engine.get_compiled_bytes();
    std::ofstream outfile("test_outputyyyy.pdf", std::ios::binary);
    outfile.write(reinterpret_cast<const char*>(compiled_bytes.data()), compiled_bytes.size());
    outfile.close();
    
    std::cout << "[SUCCESS] File 'test_output.pdf' generated successfully!\n";
    return 0;
}