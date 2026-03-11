package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Wishlist;
import com.example.demo.service.WishlistService;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    // ⭐ GET WISHLIST
    @GetMapping("/{userId}")
    public List<Wishlist> getWishlist(@PathVariable Long userId) {
        return wishlistService.getWishlist(userId);
    }

    // ⭐ ADD TO WISHLIST
    @PostMapping
    public Map<String, Object> addToWishlist(@RequestParam Long userId, @RequestParam Long bookId) {

        wishlistService.addToWishlist(userId, bookId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Book added to wishlist");

        return response;
    }

    // ⭐ REMOVE FROM WISHLIST
    @DeleteMapping
    public Map<String, Object> removeFromWishlist(@RequestParam Long userId, @RequestParam Long bookId) {

        wishlistService.removeFromWishlist(userId, bookId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Book removed from wishlist");

        return response;
    }

    // ⭐ WISHLIST STATS
    @GetMapping("/stats/{userId}")
    public Map<String, Integer> getStats(@PathVariable Long userId) {

        int total = wishlistService.getWishlist(userId).size();

        Map<String, Integer> stats = new HashMap<>();
        stats.put("totalItems", total);
        stats.put("currentlyReading", 0);
        stats.put("completedReads", 0);

        return stats;
    }
}