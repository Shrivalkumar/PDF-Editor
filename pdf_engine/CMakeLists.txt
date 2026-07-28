cmake_minimum_required(VERSION 3.15)
project(PdfEngine LANGUAGES CXX)


set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)


include_directories(include)

set(SOURCE_FILES
    src/byte_buffer.cpp
    src/pdf_engine.cpp
)


add_executable(pdf_tester main.cpp ${SOURCE_FILES})