import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserChatbotService {
  private botResponses: { [key: string]: string } = {
    'hello': 'Hello! How can I help you find a book today?',
    'hi': 'Hi there! Looking for a good book to read?',
    'book': 'We have many books available. What genre are you interested in?',
    'fiction': 'Great! We have fiction books by authors like F. Scott Fitzgerald and Harper Lee.',
    'science fiction': 'Science fiction fans love books like "1984" and "Dune" by Frank Herbert.',
    'fantasy': 'Fantasy lovers enjoy "The Hobbit" by J.R.R. Tolkien.',
    'romance': 'Romance readers love classics like "Pride and Prejudice" by Jane Austen.',
    'mystery': 'Mystery books are in our thriller section. Would you like to browse?',
    'recommend': 'Based on popular choices, I recommend "The Great Gatsby" or "To Kill a Mockingbird".',
    'price': 'Our books range from $9.99 to $24.99. You can filter by price in the search options.',
    'help': 'I can help you find books, check prices, or give recommendations. What do you need?',
    'bye': 'Happy reading! Come back anytime.',
    'thank': 'You\'re welcome! Enjoy your reading!'
  };

  constructor() {}

  sendMessage(message: string): Observable<string> {
    const lowercaseMsg = message.toLowerCase();
    let reply = 'I\'m not sure about that. Could you rephrase your question?';
    
    // Check for keywords
    for (const [key, response] of Object.entries(this.botResponses)) {
      if (lowercaseMsg.includes(key)) {
        reply = response;
        break;
      }
    }
    
    // Simulate API delay
    return of(reply);
  }
}