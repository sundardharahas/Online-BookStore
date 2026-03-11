import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  id?: number;
  userId: number;
  bookId: number;
  rating: number;
  comment: string;
  userName?: string;
  createdAt?: string;
}

export interface ReviewStats {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
  ratingCounts: { [key: number]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  getBookReviews(bookId: number): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.apiUrl}/book/${bookId}`);
  }

  submitReview(review: Review): Observable<any> {
    return this.http.post<any>(this.apiUrl, review);
  }

  deleteReview(reviewId: number, userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${reviewId}?userId=${userId}`);
  }
}
