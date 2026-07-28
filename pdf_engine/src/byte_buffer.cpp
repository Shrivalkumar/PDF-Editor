#include "byte_buffer.hpp"

void ByteBuffer::append(const std::string& str){
    buffer.insert(buffer.end() , str.begin(), str.end());
}
void ByteBuffer::append(const std::vector<uint8_t>& data){
    buffer.insert(buffer.end(), data.begin(), data.end());
}

void ByteBuffer::append(const uint8_t* data, size_t size){
    buffer.insert(buffer.end(), data, data + size);
}

size_t ByteBuffer::current_position() const{
    return buffer.size();
}

const std::vector<uint8_t>& ByteBuffer::get_data() const{
    return buffer;
}