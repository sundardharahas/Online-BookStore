package com.example.demo.controller;

import com.example.demo.model.Review;
import com.example.demo.model.User;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewRepository reviewRepo;
    private final UserRepository userRepo;

    public ReviewController(ReviewRepository reviewRepo, UserRepository userRepo) {
        this.reviewRepo = reviewRepo;
        this.userRepo = userRepo;
    }

    // Get all reviews for a book
    @GetMapping("/book/{bookId}")
    public Map<String, Object> getBookReviews(@PathVariable Long bookId) {
        List<Review> reviews = reviewRepo.findByBookIdOrderByCreatedAtDesc(bookId);

        // Calculate stats
        double avgRating = reviews.stream()
            .mapToInt(Review::getRating)
            .average()
            .orElse(0.0);

        Map<Integer, Long> ratingCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int star = i;
            ratingCounts.put(i, reviews.stream().filter(r -> r.getRating() == star).count());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews);
        result.put("totalReviews", reviews.size());
        result.put("averageRating", Math.round(avgRating * 10.0) / 10.0);
        result.put("ratingCounts", ratingCounts);
        return result;
    }

    // Submit a review
    @PostMapping
    public Map<String, Object> submitReview(@RequestBody Review review) {
        Map<String, Object> result = new HashMap<>();

        if (review.getUserId() == null || review.getBookId() == null) {
            result.put("success", false);
            result.put("message", "User ID and Book ID are required.");
            return result;
        }

        if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
            result.put("success", false);
            result.put("message", "Rating must be between 1 and 5.");
            return result;
        }

        // Check if user already reviewed this book
        Optional<Review> existing = reviewRepo.findByUserIdAndBookId(review.getUserId(), review.getBookId());
        if (existing.isPresent()) {
            // Update existing review
            Review existingReview = existing.get();
            existingReview.setRating(review.getRating());
            existingReview.setComment(review.getComment());
            reviewRepo.save(existingReview);
            result.put("success", true);
            result.put("message", "Review updated successfully!");
            result.put("review", existingReview);
            return result;
        }

        // Set user name
        if (review.getUserName() == null || review.getUserName().isEmpty()) {
            User user = userRepo.findById(review.getUserId()).orElse(null);
            if (user != null) {
                review.setUserName(user.getName());
            } else {
                review.setUserName("Anonymous");
            }
        }

        Review saved = reviewRepo.save(review);
        result.put("success", true);
        result.put("message", "Review submitted successfully!");
        result.put("review", saved);
        return result;
    }

    // Delete a review
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteReview(@PathVariable Long id, @RequestParam Long userId) {
        Map<String, Object> result = new HashMap<>();
        Optional<Review> review = reviewRepo.findById(id);
        if (review.isPresent() && review.get().getUserId().equals(userId)) {
            reviewRepo.deleteById(id);
            result.put("success", true);
            result.put("message", "Review deleted.");
        } else {
            result.put("success", false);
            result.put("message", "Review not found or unauthorized.");
        }
        return result;
    }
}
