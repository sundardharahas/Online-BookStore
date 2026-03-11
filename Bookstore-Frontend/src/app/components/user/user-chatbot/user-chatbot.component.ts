import { Component } from '@angular/core';
import { ChatbotService } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  isOpen: boolean = false;
  messages: { text: string; isUser: boolean }[] = [];
  userMessage: string = '';
  isLoading: boolean = false;

  constructor(private chatbotService: ChatbotService) {
    // Add welcome message
    this.messages.push({
      text: this.chatbotService.getWelcomeMessage(),
      isUser: false
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isLoading) return;

    // Add user message
    this.messages.push({
      text: this.userMessage,
      isUser: true
    });

    const message = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    this.chatbotService.sendMessage(message).subscribe({
      next: (reply) => {
        this.messages.push({
          text: reply,
          isUser: false
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Chatbot error:', error);
        this.messages.push({
          text: 'Sorry, I\'m having trouble connecting. Please try again.',
          isUser: false
        });
        this.isLoading = false;
      }
    });
  }
}