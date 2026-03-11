package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.*;

import com.example.demo.model.Book;
import com.example.demo.model.Cart;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.CartRepository;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartRepository cartRepo;
    private final BookRepository bookRepo;

    public CartController(CartRepository cartRepo, BookRepository bookRepo) {
        this.cartRepo = cartRepo;
        this.bookRepo = bookRepo;
    }

    @GetMapping("/{userId}")
    public Map<String, Object> getCart(@PathVariable Long userId) {

        List<Cart> cartItems = cartRepo.findByUserId(userId);
        List<Map<String, Object>> responseItems = new ArrayList<>();

        for (Cart cart : cartItems) {

            Optional<Book> bookOptional = bookRepo.findById(cart.getBookId());

            if (bookOptional.isPresent()) {

                Book book = bookOptional.get();

                Map<String, Object> item = new HashMap<>();

                item.put("cartId", cart.getCartId());
                item.put("bookId", book.getId());
                item.put("title", book.getTitle());
                item.put("author", book.getAuthor());
                item.put("price", book.getPrice());
                item.put("coverImage", book.getCoverImage());
                item.put("stock", book.getStock());
                item.put("quantity", cart.getQuantity());

                responseItems.add(item);
            }
        }

        return Map.of(
                "success", true,
                "cart", responseItems
        );
    }

    // ADD BOOK TO CART
    @PostMapping
    public Map<String,Object> addToCart(@RequestBody Map<String,Object> request){

        Long userId = Long.valueOf(request.get("userId").toString());
        Long bookId = Long.valueOf(request.get("bookId").toString());
        int quantity = Integer.parseInt(request.get("quantity").toString());

        Optional<Cart> existing = cartRepo.findByUserIdAndBookId(userId, bookId);

        if(existing.isPresent()){

            Cart cart = existing.get();
            cart.setQuantity(cart.getQuantity() + quantity);
            cartRepo.save(cart);

        }else{

            Cart cart = new Cart(userId, bookId, quantity);
            cartRepo.save(cart);
        }

        return Map.of(
                "success", true,
                "message", "Book added to cart"
        );
    }

    // UPDATE QUANTITY
    @PutMapping("/{cartId}")
    public Map<String,Object> updateQuantity(
            @PathVariable Long cartId,
            @RequestBody Map<String,Object> request){

        Cart cart = cartRepo.findById(cartId).orElse(null);

        if(cart != null){

            int quantity = Integer.parseInt(request.get("quantity").toString());

            cart.setQuantity(quantity);

            cartRepo.save(cart);
        }

        return Map.of(
                "success", true
        );
    }

    // REMOVE ITEM
    @DeleteMapping("/{cartId}")
    public Map<String,Object> removeItem(@PathVariable Long cartId){

        cartRepo.deleteById(cartId);

        return Map.of(
                "success", true
        );
    }

    // CLEAR CART FOR USER
    @DeleteMapping("/clear/{userId}")
    public Map<String,Object> clearCart(@PathVariable Long userId){

        List<Cart> userCartItems = cartRepo.findByUserId(userId);
        cartRepo.deleteAll(userCartItems);

        return Map.of(
                "success", true,
                "message", "Cart cleared successfully"
        );
    }

}