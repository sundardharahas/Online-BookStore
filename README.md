# Online Bookstore

A full-stack web application featuring an online bookstore with an e-commerce interface, user profiles, a shopping cart, wishlists, and order management. It also features an AI chatbot for personalized book recommendations.

## Project Structure

This repository is divided into two main components:

- **`Bookstore-Backend/`**: The backend RESTful API built with Java and Spring Boot.
- **`Bookstore-Frontend/`**: The frontend user interface built with Angular.

## Features

- **User & Admin Roles:** Distinct experiences and features for customers and store administrators.
- **Browse & Search Catalog:** View available books, search, and view categories.
- **Shopping Cart & Wishlist:** Add books to cart for checkout or save them for later in a wishlist.
- **Order Management:** Secure checkout, order history for users, and order fulfillment features for admins.
- **AI Chatbot & Recommendations:** Groq API-powered chatbot for answering queries and providing hybrid smart book recommendations.

## Getting Started

### Prerequisites

- **Backend:** Java (JDK 17 or higher), Maven.
- **Frontend:** Node.js, Angular CLI.

### Running the Backend

1. Navigate to the `Bookstore-Backend` directory.
2. Configure your database settings in `src/main/resources/application.properties`.
3. Set your Groq API key in the environmental variables or directly in `ChatController.java` if testing locally.
4. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

### Running the Frontend

1. Navigate to the `Bookstore-Frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular development server:
   ```bash
   ng serve
   ```
4. Open your browser and navigate to `http://localhost:4200/`.


