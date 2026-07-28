#ifndef BYTE_BUFFER_HPP
#define BYTE_BUFFER_HPP

#include <vector>
#include <string>
#include <cstdint>

class ByteBuffer{

private:
    std::vector<uint8_t> buffer;

public:
    ByteBuffer() = default;

    //for strings of texts
    void append(const std::string& str);

    //for jpeg
    void append(const std::vector<uint8_t>& data);
    void append(const uint8_t* data, size_t size);

    size_t current_position() const;

    const std::vector<uint8_t>& get_data() const;


};

#endif