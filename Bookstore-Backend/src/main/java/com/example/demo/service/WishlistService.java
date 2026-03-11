package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Book;
import com.example.demo.model.User;
import com.example.demo.model.Wishlist;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.WishlistRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private BookRepository bookRepo;

    public List<Wishlist> getWishlist(Long userId) {
        return wishlistRepo.findByUserId(userId);
    }

    public void addToWishlist(Long userId, Long bookId) {

        // Prevent duplicates
        Optional<Wishlist> existing = wishlistRepo.findByUserIdAndBookId(userId, bookId);

        if(existing.isPresent()) {
            return;
        }

        User user = userRepo.findById(userId).orElseThrow();
        Book book = bookRepo.findById(bookId).orElseThrow();

        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setBook(book);

        wishlistRepo.save(wishlist);
    }

    public void removeFromWishlist(Long userId, Long bookId) {
        wishlistRepo.deleteByUserIdAndBookId(userId, bookId);
    }
}