package com.example.demo.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.example.demo.model.User;
import com.example.demo.model.Order;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.OrderRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")

public class UserController {

    private final UserRepository repo;
    private final OrderRepository orderRepo;

    public UserController(UserRepository repo, OrderRepository orderRepo) {
        this.repo = repo;
        this.orderRepo = orderRepo;
    }

    @GetMapping("/admin/all")
    public List<Map<String, Object>> getAllUsers() {
        List<User> users = repo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", u.getId());
            userData.put("name", u.getName());
            userData.put("email", u.getEmail());
            userData.put("role", u.getRole());
            // Count orders for this user
            List<Order> userOrders = orderRepo.findByUserId(u.getId());
            userData.put("totalOrders", userOrders.size());
            result.add(userData);
        }
        return result;
    }

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        if (user.getPassword() != null) {
            user.setPassword(hashPassword(user.getPassword()));
        }
        return repo.save(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {

        User existing = repo.findByEmail(user.getEmail());

        if (existing == null || user.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        String hashedAttempt = hashPassword(user.getPassword());
        if (!existing.getPassword().equals(hashedAttempt)) {
            // Also allow plaintext for existing non-hashed demo accounts for backward
            // compatibility
            if (!existing.getPassword().equals(user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }
        }

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> userData = new HashMap<>();

        userData.put("id", existing.getId());
        userData.put("email", existing.getEmail());
        userData.put("name", existing.getName());
        userData.put("role", existing.getRole()); // 👈 important

        response.put("token", "dummy-token");
        response.put("user", userData);

        return ResponseEntity.ok(response);
    }

    private String hashPassword(String password) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }

            return hexString.toString();
        } catch (Exception ex) {
            throw new RuntimeException("Error hashing password", ex);
        }
    }
}