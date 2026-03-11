import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatbotService } from '../../../services/chatbot.service';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatBody') chatBody!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  isTyping = false;
  unreadCount = 0;

  quickActions = [
    { label: '📚 Recommend books', message: 'Can you recommend some good books for me?' },
    { label: '🔍 Search help', message: 'How can I search for books?' },
    { label: '🛒 Order help', message: 'How do I place an order?' },
    { label: '❤️ Wishlist', message: 'How does the wishlist feature work?' }
  ];

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Add welcome message
    this.messages.push({
      text: this.chatbotService.getWelcomeMessage(),
      isUser: false,
      timestamp: new Date()
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
      }, 100);
    }
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text) return;

    // Add user message
    this.messages.push({
      text,
      isUser: true,
      timestamp: new Date()
    });
    this.userInput = '';
    this.isTyping = true;

    // Get AI response
    this.chatbotService.sendMessage(text).subscribe({
      next: (reply) => {
        this.isTyping = false;
        this.messages.push({
          text: reply,
          isUser: false,
          timestamp: new Date()
        });
        if (!this.isOpen) {
          this.unreadCount++;
        }
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({
          text: 'Sorry, something went wrong. Please try again.',
          isUser: false,
          timestamp: new Date()
        });
      }
    });
  }

  sendQuickAction(message: string): void {
    this.userInput = message;
    this.sendMessage();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
