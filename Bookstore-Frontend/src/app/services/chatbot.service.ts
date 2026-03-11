import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<string> {
    return this.http.post<{success: boolean, reply: string}>(`${this.apiUrl}/chat`, { message }).pipe(
      map(response => response.reply || 'Sorry, I could not process that.'),
      catchError(error => {
        console.error('Chatbot API error:', error);
        return of('Sorry, I\'m having trouble connecting. Please try again later.');
      })
    );
  }

  getWelcomeMessage(): string {
    return 'Hi! I\'m your AI book assistant powered by AI. I can help you find the perfect book, answer questions, and give personalized recommendations! 📚✨';
  }
}