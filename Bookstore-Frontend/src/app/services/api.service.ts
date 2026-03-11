import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = "http://localhost:9999/api";

  constructor(private http: HttpClient) {}

  login(data: any) {
  return this.http.post("http://localhost:9999/api/users/login", data);
}

  register(data: any) {
    return this.http.post(this.baseUrl + "/users/register", data);
  }

  getBooks() {
    return this.http.get(this.baseUrl + "/books");
  }
}