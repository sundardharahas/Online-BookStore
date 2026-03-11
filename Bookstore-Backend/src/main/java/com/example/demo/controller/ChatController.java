package com.example.demo.controller;

import com.example.demo.model.Book;
import com.example.demo.model.Cart;
import com.example.demo.model.Order;
import com.example.demo.model.Wishlist;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.CartRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.WishlistRepository;
import org.springframework.web.bind.annotation.*;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatController {

    private final BookRepository bookRepo;
    private final OrderRepository orderRepo;
    private final WishlistRepository wishlistRepo;
    private final CartRepository cartRepo;

    private static final String GROQ_API_KEY = "YOUR_GROQ_API_KEY";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    // Hybrid weights
    private static final double CONTENT_WEIGHT = 0.4;
    private static final double COLLABORATIVE_WEIGHT = 0.3;

    public ChatController(BookRepository bookRepo, OrderRepository orderRepo,
                          WishlistRepository wishlistRepo, CartRepository cartRepo) {
        this.bookRepo = bookRepo;
        this.orderRepo = orderRepo;
        this.wishlistRepo = wishlistRepo;
        this.cartRepo = cartRepo;
    }

    // ========================= CHAT ENDPOINT =========================

    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, String> body) {
        try {
            String userMessage = body.get("message");
            if (userMessage == null || userMessage.trim().isEmpty()) {
                return Map.of("success", false, "reply", "Please enter a message.");
            }

            List<Book> allBooks = bookRepo.findAll();
            String catalogContext = buildCatalogContext(allBooks);

            String systemPrompt = "You are a helpful AI assistant for Smart Bookstore, an online bookstore. " +
                "You help customers find books, answer questions about the store, and provide personalized recommendations. " +
                "Be friendly, concise, and helpful. Use emojis occasionally to be engaging. " +
                "Here is our current book catalog:\n\n" + catalogContext + "\n\n" +
                "When recommending books, ONLY recommend books from this catalog. " +
                "If the user asks about a book not in our catalog, let them know it's not currently available. " +
                "Keep responses under 150 words.";

            String reply = callGroqAPI(systemPrompt, userMessage);
            return Map.of("success", true, "reply", reply);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "reply", "Sorry, I'm having trouble right now. Please try again later.");
        }
    }

    // ========================= HYBRID RECOMMENDATIONS =========================

    @GetMapping("/recommendations")
    public Map<String, Object> getRecommendations(@RequestParam(required = false) Long userId) {
        try {
            List<Book> allBooks = bookRepo.findAll();
            if (allBooks.isEmpty()) {
                Map<String, Object> empty = new HashMap<>();
                empty.put("success", true);
                empty.put("recommendations", new ArrayList<>());
                empty.put("strategy", "none");
                return empty;
            }

            // Gather user interaction data from 3 signals
            Set<Long> ownedBookIds = new HashSet<>();
            Map<String, Integer> categoryPrefs = new HashMap<>();
            Map<String, Integer> authorPrefs = new HashMap<>();

            if (userId != null) {
                // --- Signal 1: Order history (strongest signal, weight 3x) ---
                List<Order> userOrders = orderRepo.findByUserId(userId);
                for (Order order : userOrders) {
                    if (order.getBookId() != null) {
                        ownedBookIds.add(order.getBookId());
                        Optional<Book> bookOpt = bookRepo.findById(order.getBookId());
                        if (bookOpt.isPresent()) {
                            Book b = bookOpt.get();
                            categoryPrefs.merge(b.getCategory(), 3, Integer::sum);
                            authorPrefs.merge(b.getAuthor(), 3, Integer::sum);
                        }
                    }
                }

                // --- Signal 2: Wishlist (medium signal, weight 2x) ---
                List<Wishlist> wishlists = wishlistRepo.findByUserId(userId);
                for (Wishlist w : wishlists) {
                    if (w.getBook() != null) {
                        ownedBookIds.add(w.getBook().getId());
                        categoryPrefs.merge(w.getBook().getCategory(), 2, Integer::sum);
                        authorPrefs.merge(w.getBook().getAuthor(), 2, Integer::sum);
                    }
                }

                // --- Signal 3: Cart (weak signal, weight 1x) ---
                List<Cart> cartItems = cartRepo.findByUserId(userId);
                for (Cart c : cartItems) {
                    if (c.getBookId() != null) {
                        ownedBookIds.add(c.getBookId());
                        Optional<Book> bookOpt = bookRepo.findById(c.getBookId());
                        if (bookOpt.isPresent()) {
                            Book b = bookOpt.get();
                            categoryPrefs.merge(b.getCategory(), 1, Integer::sum);
                            authorPrefs.merge(b.getAuthor(), 1, Integer::sum);
                        }
                    }
                }
            }

            // Filter out already owned/wishlisted/carted books, only in-stock
            List<Book> candidates = allBooks.stream()
                .filter(b -> !ownedBookIds.contains(b.getId()))
                .filter(b -> b.getStock() != null && b.getStock() > 0)
                .collect(Collectors.toList());

            if (candidates.isEmpty()) {
                candidates = allBooks.stream().limit(4).collect(Collectors.toList());
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("recommendations", candidates);
                result.put("strategy", "fallback-all-owned");
                return result;
            }

            String strategy;
            List<Book> finalRecommendations;

            if (categoryPrefs.isEmpty()) {
                // ---- COLD START: New user with no data, use AI-only ----
                strategy = "ai-cold-start";
                finalRecommendations = getAIRecommendations(candidates, "");
            } else {
                // ---- HYBRID: Content-Based + Collaborative + AI Ranking ----
                strategy = "hybrid";

                // LAYER 1: Content-Based Filtering
                Map<Long, Double> contentScores = new HashMap<>();
                double maxCatPref = categoryPrefs.values().stream().mapToInt(Integer::intValue).max().orElse(1);
                double maxAutPref = authorPrefs.values().stream().mapToInt(Integer::intValue).max().orElse(1);

                for (Book b : candidates) {
                    double catScore = categoryPrefs.getOrDefault(b.getCategory(), 0) / maxCatPref;
                    double autScore = authorPrefs.getOrDefault(b.getAuthor(), 0) / maxAutPref;
                    contentScores.put(b.getId(), (catScore * 0.6) + (autScore * 0.4));
                }

                // LAYER 2: Collaborative Filtering
                Map<Long, Double> collabScores = new HashMap<>();
                if (userId != null) {
                    Set<Long> similarUserIds = new HashSet<>();
                    List<Order> allOrders = orderRepo.findAll();

                    for (Long bookId : ownedBookIds) {
                        for (Order o : allOrders) {
                            if (bookId.equals(o.getBookId()) && !userId.equals(o.getUserId()) && o.getUserId() != null) {
                                similarUserIds.add(o.getUserId());
                            }
                        }
                    }

                    Map<Long, Integer> collabCounts = new HashMap<>();
                    for (Long simUserId : similarUserIds) {
                        List<Order> simOrders = orderRepo.findByUserId(simUserId);
                        for (Order o : simOrders) {
                            if (o.getBookId() != null && !ownedBookIds.contains(o.getBookId())) {
                                collabCounts.merge(o.getBookId(), 1, Integer::sum);
                            }
                        }
                    }

                    double maxCollab = collabCounts.values().stream().mapToInt(Integer::intValue).max().orElse(1);
                    for (Book b : candidates) {
                        collabScores.put(b.getId(), collabCounts.getOrDefault(b.getId(), 0) / maxCollab);
                    }
                }

                // Combine scores
                Map<Long, Double> hybridScores = new HashMap<>();
                for (Book b : candidates) {
                    double cs = contentScores.getOrDefault(b.getId(), 0.0);
                    double co = collabScores.getOrDefault(b.getId(), 0.0);
                    hybridScores.put(b.getId(), (cs * CONTENT_WEIGHT) + (co * COLLABORATIVE_WEIGHT));
                }

                // Top 8 candidates for AI ranking
                List<Book> topCandidates = candidates.stream()
                    .sorted((a, b) -> Double.compare(
                        hybridScores.getOrDefault(b.getId(), 0.0),
                        hybridScores.getOrDefault(a.getId(), 0.0)))
                    .limit(8)
                    .collect(Collectors.toList());

                // LAYER 3: AI Ranking
                String userProfile = "User prefers categories: " +
                    categoryPrefs.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .limit(3).map(Map.Entry::getKey)
                        .collect(Collectors.joining(", ")) +
                    ". Favorite authors: " +
                    authorPrefs.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .limit(3).map(Map.Entry::getKey)
                        .collect(Collectors.joining(", "));

                finalRecommendations = getAIRecommendations(topCandidates, userProfile);

                if (finalRecommendations.isEmpty()) {
                    finalRecommendations = topCandidates.stream().limit(4).collect(Collectors.toList());
                    strategy = "hybrid-no-ai";
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("recommendations", finalRecommendations);
            result.put("strategy", strategy);
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            List<Book> allBooks = bookRepo.findAll();
            Collections.shuffle(allBooks);
            List<Book> fallback = allBooks.stream().limit(4).collect(Collectors.toList());
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("recommendations", fallback);
            result.put("strategy", "fallback-error");
            return result;
        }
    }

    // ========================= AI RECOMMENDATION HELPER =========================

    private List<Book> getAIRecommendations(List<Book> candidates, String userProfile) {
        try {
            StringBuilder catalogSB = new StringBuilder();
            for (Book b : candidates) {
                catalogSB.append("ID:").append(b.getId())
                    .append(" Title:\"").append(b.getTitle()).append("\"")
                    .append(" Author:").append(b.getAuthor())
                    .append(" Category:").append(b.getCategory())
                    .append(" Price:$").append(b.getPrice())
                    .append("\n");
            }

            String prompt = "From these books, pick exactly 4 that make the best recommendation set. " +
                (userProfile.isEmpty() ? "For a general reader." : userProfile) +
                "\n\nBooks:\n" + catalogSB +
                "\nRespond with ONLY a JSON array of book IDs like [1,5,3,7]. No other text.";

            String response = callGroqAPI(
                "You are a book recommendation engine. Respond ONLY with a JSON array of 4 book IDs. No explanation.",
                prompt
            );

            List<Long> ids = parseBookIds(response);
            List<Book> result = new ArrayList<>();
            for (Long id : ids) {
                candidates.stream().filter(b -> b.getId().equals(id)).findFirst().ifPresent(result::add);
            }
            return result.stream().limit(4).collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // ========================= UTILITY METHODS =========================

    private String buildCatalogContext(List<Book> books) {
        StringBuilder sb = new StringBuilder();
        for (Book book : books) {
            sb.append("ID: ").append(book.getId())
              .append(" | Title: ").append(book.getTitle())
              .append(" | Author: ").append(book.getAuthor())
              .append(" | Category: ").append(book.getCategory())
              .append(" | Price: $").append(book.getPrice())
              .append(" | Stock: ").append(book.getStock())
              .append("\n");
        }
        return sb.toString();
    }

    private String callGroqAPI(String systemPrompt, String userMessage) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) URI.create(GROQ_API_URL).toURL().openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + GROQ_API_KEY);
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);

        String escapedSystem = escapeJson(systemPrompt);
        String escapedUser = escapeJson(userMessage);

        String jsonBody = "{" +
            "\"model\": \"llama-3.1-8b-instant\"," +
            "\"messages\": [" +
                "{\"role\": \"system\", \"content\": \"" + escapedSystem + "\"}," +
                "{\"role\": \"user\", \"content\": \"" + escapedUser + "\"}" +
            "]," +
            "\"temperature\": 0.7," +
            "\"max_tokens\": 300" +
        "}";

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
        }

        int responseCode = conn.getResponseCode();
        java.io.InputStream inputStream = responseCode >= 400 ? conn.getErrorStream() : conn.getInputStream();
        String responseBody = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);

        if (responseCode >= 400) {
            System.err.println("Groq API Error: " + responseBody);
            return "I'm having trouble connecting right now. Please try again!";
        }

        return extractContentFromResponse(responseBody);
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    private String extractContentFromResponse(String jsonResponse) {
        try {
            int contentIndex = jsonResponse.indexOf("\"content\":");
            if (contentIndex == -1) return "Sorry, I couldn't process that.";

            int startQuote = jsonResponse.indexOf("\"", contentIndex + 10);
            if (startQuote == -1) return "Sorry, I couldn't process that.";

            int endQuote = startQuote + 1;
            while (endQuote < jsonResponse.length()) {
                if (jsonResponse.charAt(endQuote) == '"' && jsonResponse.charAt(endQuote - 1) != '\\') {
                    break;
                }
                endQuote++;
            }

            String content = jsonResponse.substring(startQuote + 1, endQuote);
            content = content.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
            return content;
        } catch (Exception e) {
            e.printStackTrace();
            return "Sorry, I couldn't process that response.";
        }
    }

    private List<Long> parseBookIds(String response) {
        List<Long> ids = new ArrayList<>();
        try {
            String cleaned = response.replaceAll("[^0-9,]", "");
            String[] parts = cleaned.split(",");
            for (String part : parts) {
                part = part.trim();
                if (!part.isEmpty()) {
                    ids.add(Long.parseLong(part));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ids;
    }
}
