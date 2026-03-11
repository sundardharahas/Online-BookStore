package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Book;
import com.example.demo.repository.BookRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    private final BookRepository repo;

    public BookController(BookRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Book> getAllBooks() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public Book getBookById(@PathVariable Long id) {
        return repo.findById(id).orElse(null);
    }

    @GetMapping("/categories")
    public List<String> getCategories() {
        List<Book> books = repo.findAll();
        return books.stream()
                .map(Book::getCategory)
                .distinct()
                .toList();
    }

    @GetMapping("/search")
    public List<Book> searchBooks(@RequestParam String q) {
        String query = q.toLowerCase();
        return repo.findAll().stream()
            .filter(b -> (b.getTitle() != null && b.getTitle().toLowerCase().contains(query))
                      || (b.getAuthor() != null && b.getAuthor().toLowerCase().contains(query))
                      || (b.getCategory() != null && b.getCategory().toLowerCase().contains(query)))
            .toList();
    }

    @PostMapping
    public Book addBook(@RequestBody Book book) {
        return repo.save(book);
    }

    @PutMapping("/{id}")
    public Book updateBook(@PathVariable Long id, @RequestBody Book book) {
        book.setId(id);
        return repo.save(book);
    }

    @DeleteMapping("/{id}")
    public void deleteBook(@PathVariable Long id) {
        repo.deleteById(id);
    }
    
}