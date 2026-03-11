package com.example.demo.controller;

import com.example.demo.model.Book;
import com.example.demo.model.Order;
import com.example.demo.repository.BookRepository;
import com.example.demo.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository repo;
    private final BookRepository bookRepo;
    private final UserRepository userRepo;

    public OrderController(OrderRepository repo, BookRepository bookRepo, UserRepository userRepo) {
        this.repo = repo;
        this.bookRepo = bookRepo;
        this.userRepo = userRepo;
    }

    // Place Order
    @PostMapping
    public Order placeOrder(@RequestBody Order order) {
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("Shipped");
        return repo.save(order);
    }

    // Get All Orders (Admin) - raw
    @GetMapping
    public List<Order> getAllOrders() {
        return repo.findAll();
    }

    // ==================== ADMIN ENDPOINTS ====================

    // Get All Orders (Admin) - rich formatted response for frontend
    @GetMapping("/admin/all")
    public Map<String, Object> getAdminOrders() {
        try {
            List<Order> rawOrders = repo.findAll();

            List<Map<String, Object>> formattedOrders = new ArrayList<>();
            int counter = 1;

            for (Order o : rawOrders) {
                LocalDateTime dateTime = o.getOrderDate() != null ? o.getOrderDate() : LocalDateTime.now();

                String customerName = "Unknown";
                String customerEmail = "";

                // Lookup customer name from order's userId
                if (o.getUserId() != null) {
                    Optional<User> userOpt = userRepo.findById(o.getUserId());
                    if (userOpt.isPresent()) {
                        customerName = userOpt.get().getName() != null ? userOpt.get().getName() : "User";
                        customerEmail = userOpt.get().getEmail() != null ? userOpt.get().getEmail() : "";
                    }
                }

                double totalAmount = 0.0;
                if (o.getBookId() != null) {
                    Optional<Book> bookOpt = bookRepo.findById(o.getBookId());
                    if (bookOpt.isPresent() && bookOpt.get().getPrice() != null) {
                        totalAmount = bookOpt.get().getPrice();
                    }
                }

                String status = o.getStatus() != null ? o.getStatus().toLowerCase() : "shipped";

                Map<String, Object> orderMap = new HashMap<>();
                orderMap.put("orderId", o.getId());
                orderMap.put("orderNumber", "ORD-" + dateTime.getYear() + "-" + o.getId());
                orderMap.put("createdAt", dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                orderMap.put("status", status);
                orderMap.put("totalAmount", totalAmount);
                orderMap.put("itemCount", 1);
                orderMap.put("paymentStatus", "paid");
                orderMap.put("paymentMethod", "card");
                String shippingAddr = o.getShippingAddress() != null ? o.getShippingAddress() : customerName + ", " + customerEmail;
                orderMap.put("shippingAddress", shippingAddr);
                orderMap.put("customerName", customerName);
                orderMap.put("customerEmail", customerEmail);

                formattedOrders.add(orderMap);
                counter++;
            }

            return Map.of("success", true, "orders", formattedOrders);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "orders", new ArrayList<>());
        }
    }

    // Get Admin Order Stats
    @GetMapping("/admin/stats")
    public Map<String, Object> getAdminStats() {
        List<Order> allOrders = repo.findAll();

        long pending = allOrders.stream().filter(o -> "pending".equalsIgnoreCase(o.getStatus())).count();
        long processing = allOrders.stream().filter(o -> "processing".equalsIgnoreCase(o.getStatus())).count();
        long shipped = allOrders.stream().filter(o -> "shipped".equalsIgnoreCase(o.getStatus())).count();
        long delivered = allOrders.stream().filter(o -> "delivered".equalsIgnoreCase(o.getStatus())).count();
        long cancelled = allOrders.stream().filter(o -> "cancelled".equalsIgnoreCase(o.getStatus())).count();

        double totalRevenue = 0.0;
        for (Order o : allOrders) {
            if (o.getBookId() != null && "delivered".equalsIgnoreCase(o.getStatus())) {
                Optional<Book> bookOpt = bookRepo.findById(o.getBookId());
                if (bookOpt.isPresent() && bookOpt.get().getPrice() != null) {
                    totalRevenue += bookOpt.get().getPrice();
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", allOrders.size());
        stats.put("pendingCount", pending);
        stats.put("processingCount", processing);
        stats.put("shippedCount", shipped);
        stats.put("deliveredCount", delivered);
        stats.put("cancelledCount", cancelled);
        stats.put("totalRevenue", totalRevenue);
        return stats;
    }

    // Update Order Status (Admin)
    @PutMapping("/{orderId}/status")
    public Map<String, Object> updateOrderStatus(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
        try {
            Optional<Order> orderOpt = repo.findById(orderId);
            if (!orderOpt.isPresent()) {
                return Map.of("success", false, "message", "Order not found");
            }

            Order order = orderOpt.get();
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.isEmpty()) {
                return Map.of("success", false, "message", "Status is required");
            }

            // Update all orders from the same date group
            List<Order> userOrders = repo.findByUserId(order.getUserId());
            for (Order uo : userOrders) {
                if (uo.getOrderDate() != null && order.getOrderDate() != null && uo.getOrderDate().toLocalDate().equals(order.getOrderDate().toLocalDate())) {
                    uo.setStatus(newStatus.substring(0,1).toUpperCase() + newStatus.substring(1).toLowerCase());
                    repo.save(uo);
                }
            }

            return Map.of("success", true, "message", "Order status updated to " + newStatus);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Error: " + e.getMessage());
        }
    }

    // Update Order Details (Admin)
    @PutMapping("/{orderId}")
    public Map<String, Object> updateOrderDetails(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        try {
            Optional<Order> orderOpt = repo.findById(orderId);
            if (!orderOpt.isPresent()) {
                return Map.of("success", false, "message", "Order not found");
            }

            Order order = orderOpt.get();
            String status = (String) body.get("status");

            if (status != null && !status.isEmpty()) {
                List<Order> userOrders = repo.findByUserId(order.getUserId());
                for (Order uo : userOrders) {
                    if (uo.getOrderDate() != null && order.getOrderDate() != null && uo.getOrderDate().toLocalDate().equals(order.getOrderDate().toLocalDate())) {
                        uo.setStatus(status.substring(0,1).toUpperCase() + status.substring(1).toLowerCase());
                        repo.save(uo);
                    }
                }
            }

            return Map.of("success", true, "message", "Order updated successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Error: " + e.getMessage());
        }
    }

    // Get Orders By User (Rich Response for Frontend)
    @GetMapping("/user/{userId}")
    public Map<String, Object> getOrders(@PathVariable Long userId) {
        // Fetch only the orders for this specific user
        List<Order> rawOrders = repo.findByUserId(userId);
        
        // Group orders by Date to simulate single checkouts, adding a fallback for null dates
        Map<LocalDate, List<Order>> groupedOrders = rawOrders.stream()
            .collect(Collectors.groupingBy(o -> o.getOrderDate() != null ? o.getOrderDate().toLocalDate() : LocalDate.now()));
            
        List<Map<String, Object>> formattedOrders = new ArrayList<>();
        int orderNumberCounter = 1;
        
        for (Map.Entry<LocalDate, List<Order>> entry : groupedOrders.entrySet()) {
            LocalDate date = entry.getKey();
            List<Order> ordersOnDate = entry.getValue();
            
            double totalAmount = 0.0;
            int itemCount = ordersOnDate.size();
            
            for (Order o : ordersOnDate) {
                if (o.getBookId() != null) {
                    Optional<Book> bookOpt = bookRepo.findById(o.getBookId());
                    if(bookOpt.isPresent() && bookOpt.get().getPrice() != null) {
                        totalAmount += bookOpt.get().getPrice(); // Assuming 1 quantity for simplicity
                    }
                }
            }
            
            // Take the status from the first order as the group status
            String status = "shipped";
            for (Order o : ordersOnDate) {
                if (o.getStatus() != null) {
                    status = o.getStatus().toLowerCase();
                    break;
                }
            }
            
            // Use the actual time from the first order in the group
            LocalDateTime firstOrderTime = ordersOnDate.get(0).getOrderDate() != null 
                ? ordersOnDate.get(0).getOrderDate() : LocalDateTime.now();
            
            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("orderId", ordersOnDate.isEmpty() ? orderNumberCounter : ordersOnDate.get(0).getId());
            orderMap.put("orderNumber", "ORD-" + date.getYear() + "-" + orderNumberCounter);
            orderMap.put("createdAt", firstOrderTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            orderMap.put("status", status);
            orderMap.put("totalAmount", totalAmount);
            orderMap.put("itemCount", itemCount);
            orderMap.put("paymentStatus", "paid");
            orderMap.put("paymentMethod", "card");
            String userShipAddr = ordersOnDate.get(0).getShippingAddress();
            if (userShipAddr == null || userShipAddr.isEmpty()) {
                // Fallback: use customer name from the user table
                if (!ordersOnDate.isEmpty() && ordersOnDate.get(0).getUserId() != null) {
                    Optional<User> shipUser = userRepo.findById(ordersOnDate.get(0).getUserId());
                    if (shipUser.isPresent()) {
                        userShipAddr = (shipUser.get().getName() != null ? shipUser.get().getName() : "User") + ", " + (shipUser.get().getEmail() != null ? shipUser.get().getEmail() : "");
                    }
                }
            }
            orderMap.put("shippingAddress", userShipAddr != null ? userShipAddr : "N/A"); 
            
            formattedOrders.add(orderMap);
            orderNumberCounter++;
        }
        
        return Map.of(
            "success", true,
            "orders", formattedOrders
        );
    }

    // Get Single Order Details By ID (For View Details Page)
    @GetMapping("/{orderId}")
    public Map<String, Object> getOrderDetails(@PathVariable Long orderId) {
        try {
            Optional<Order> orderOpt = repo.findById(orderId);
            if (!orderOpt.isPresent()) {
                return Map.of("success", false, "message", "Order not found");
            }
            
            Order anchorOrder = orderOpt.get();
            LocalDateTime targetDateTime = anchorOrder.getOrderDate() != null ? anchorOrder.getOrderDate() : LocalDateTime.now();
            LocalDate targetDate = targetDateTime.toLocalDate();
            
            // Find all orders placed by this user on this exact date
            List<Order> userOrders = repo.findByUserId(anchorOrder.getUserId())
                    .stream()
                    .filter(o -> {
                        LocalDate d = o.getOrderDate() != null ? o.getOrderDate().toLocalDate() : LocalDate.now();
                        return d.equals(targetDate);
                    })
                    .collect(Collectors.toList());
                    
            double totalAmount = 0.0;
            List<Map<String, Object>> items = new ArrayList<>();
            
            for (Order o : userOrders) {
                if (o.getBookId() != null) {
                    Optional<Book> bookOpt = bookRepo.findById(o.getBookId());
                    if (bookOpt.isPresent()) {
                        Book book = bookOpt.get();
                        double price = book.getPrice() != null ? book.getPrice() : 0.0;
                        totalAmount += price;
                        
                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("bookId", book.getId());
                        itemMap.put("bookTitle", book.getTitle());
                        itemMap.put("price", price);
                        itemMap.put("quantity", 1); // Simulating 1 quantity per order row
                        itemMap.put("subtotal", price);
                        itemMap.put("coverImage", book.getCoverImage());
                        items.add(itemMap);
                    }
                }
            }
            
            // Lookup customer info
            String customerName = "Unknown";
            String customerEmail = "";
            if (anchorOrder.getUserId() != null) {
                Optional<User> userOpt = userRepo.findById(anchorOrder.getUserId());
                if (userOpt.isPresent()) {
                    customerName = userOpt.get().getName() != null ? userOpt.get().getName() : "User";
                    customerEmail = userOpt.get().getEmail() != null ? userOpt.get().getEmail() : "";
                }
            }

            Map<String, Object> orderMap = new HashMap<>();
            orderMap.put("orderId", anchorOrder.getId());
            orderMap.put("orderNumber", "ORD-" + targetDate.getYear() + "-" + anchorOrder.getId());
            orderMap.put("totalAmount", totalAmount);
            orderMap.put("status", anchorOrder.getStatus() != null ? anchorOrder.getStatus().toLowerCase() : "shipped");
            orderMap.put("paymentMethod", "card");
            orderMap.put("paymentStatus", "paid");
            String orderShipAddr = anchorOrder.getShippingAddress();
            if (orderShipAddr == null || orderShipAddr.isEmpty()) {
                orderShipAddr = customerName + ", " + customerEmail;
            }
            orderMap.put("shippingAddress", orderShipAddr);
            orderMap.put("createdAt", targetDateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            orderMap.put("itemCount", items.size());
            orderMap.put("items", items);
            orderMap.put("customerName", customerName);
            orderMap.put("customerEmail", customerEmail);
            
            return Map.of(
                "success", true,
                "order", orderMap
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Error fetching order details: " + e.getMessage());
        }
    }

    // Checkout Endpoint for Frontend
    @PostMapping("/checkout")
    public Map<String, Object> checkout(@RequestBody Map<String, Object> payload) {
        // The frontend sends something like: 
        // { items: [{bookId: 1, quantity: 2, ...}], shippingAddress: {...}, ... }
        
        try {
            // Extract userId from payload, fallback to 1 if not provided
            Long userId = 1L;
            if (payload.get("userId") != null) {
                userId = Long.valueOf(payload.get("userId").toString());
            }
            
            // Just extract the items from the cart and save as an order.
            List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
            
            // Extract shipping address from payload
            String shippingAddr = "N/A";
            Object shippingObj = payload.get("shippingAddress");
            if (shippingObj instanceof Map) {
                Map<String, Object> addrMap = (Map<String, Object>) shippingObj;
                String fullName = addrMap.get("fullName") != null ? addrMap.get("fullName").toString() : "";
                String address = addrMap.get("address") != null ? addrMap.get("address").toString() : "";
                String city = addrMap.get("city") != null ? addrMap.get("city").toString() : "";
                String state = addrMap.get("state") != null ? addrMap.get("state").toString() : "";
                String zipCode = addrMap.get("zipCode") != null ? addrMap.get("zipCode").toString() : "";
                shippingAddr = fullName + ", " + address + ", " + city + ", " + state + " " + zipCode;
            }
            
            if (items != null) {
                for (Map<String, Object> item : items) {
                    Long bookId = Long.valueOf(item.get("bookId").toString());
                    Order order = new Order();
                    order.setUserId(userId);
                    order.setBookId(bookId);
                    order.setOrderDate(LocalDateTime.now());
                    order.setStatus("Processing");
                    order.setShippingAddress(shippingAddr);
                    repo.save(order);
                }
            }

            // Return a dummy order ID
            String simulatedOrderId = UUID.randomUUID().toString();

            return Map.of(
                "success", true,
                "message", "Order placed successfully",
                "orderId", simulatedOrderId
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "message", "Error processing order: " + e.getMessage()
            );
        }
    }

    // Cancel Order Endpoint
    @PostMapping("/{orderId}/cancel")
    public Map<String, Object> cancelOrder(@PathVariable Long orderId) {
        try {
            Optional<Order> orderOpt = repo.findById(orderId);
            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();
                // Check if already cancelled
                if ("cancelled".equalsIgnoreCase(order.getStatus())) {
                    return Map.of("success", false, "message", "Order is already cancelled.");
                }
                
                // Cancel all simulated grouped items from that same day for that user
                List<Order> userOrders = repo.findByUserId(order.getUserId());
                for (Order userOrder : userOrders) {
                     if (userOrder.getOrderDate() != null && order.getOrderDate() != null && userOrder.getOrderDate().toLocalDate().equals(order.getOrderDate().toLocalDate())) {
                         userOrder.setStatus("Cancelled");
                         repo.save(userOrder);
                     }
                }
                
                return Map.of("success", true, "message", "Order cancelled successfully!");
            } else {
                return Map.of("success", false, "message", "Order not found.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", "Error cancelling order: " + e.getMessage());
        }
    }
}