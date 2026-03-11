package com.example.demo.repository;

import com.example.demo.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    Order findTopByUserIdOrderByOrderDateDesc(Long userId);
    
    @Query("SELECT o.bookId FROM Order o WHERE o.userId = :userId")
    List<Long> findBookIdsByUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT o.userId FROM Order o WHERE o.bookId IN :bookIds AND o.userId != :userId")
    List<Long> findSimilarUsers(@Param("bookIds") List<Long> bookIds,
                                @Param("userId") Long userId);

    @Query("SELECT DISTINCT o.bookId FROM Order o WHERE o.userId IN :userIds")
    List<Long> findRecommendedBookIds(@Param("userIds") List<Long> userIds);
}