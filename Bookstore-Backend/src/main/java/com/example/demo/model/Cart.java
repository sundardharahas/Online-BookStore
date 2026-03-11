package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cart")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    private Long userId;

    private Long bookId;

    private int quantity;

    public Cart() {}

    public Cart(Long userId, Long bookId, int quantity) {
        this.userId = userId;
        this.bookId = bookId;
        this.quantity = quantity;
    }

    public Long getCartId() { return cartId; }

    public Long getUserId() { return userId; }

    public Long getBookId() { return bookId; }

    public int getQuantity() { return quantity; }

    public void setCartId(Long cartId) { this.cartId = cartId; }

    public void setUserId(Long userId) { this.userId = userId; }

    public void setBookId(Long bookId) { this.bookId = bookId; }

    public void setQuantity(int quantity) { this.quantity = quantity; }
}