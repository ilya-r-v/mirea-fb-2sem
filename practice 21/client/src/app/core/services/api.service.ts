import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { AuthResponse, User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private baseUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) {}

    register(data: { email: string; first_name: string; last_name: string; password: string; role?: string }): Observable<User> {
        return this.http.post<User>(`${this.baseUrl}/auth/register`, data);
    }

    login(credentials: { email: string; password: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials);
    }

    refresh(refreshToken: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { refreshToken });
    }

    getMe(): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/auth/me`);
    }

    getUsers(): Observable<User[]> {
        return this.http.get<any>(`${this.baseUrl}/users`).pipe(
            map(res => res.data || res)
        );
    }

    getUser(id: string): Observable<User> {
        return this.http.get<any>(`${this.baseUrl}/users/${id}`).pipe(
            map(res => res.data || res)
        );
    }

    updateUser(id: string, data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/users/${id}`, data);
    }

    blockUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
    }

    getProducts(): Observable<Product[]> {
        return this.http.get<any>(`${this.baseUrl}/products`).pipe(
            map(res => res.data || res)
        );
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<any>(`${this.baseUrl}/products/${id}`).pipe(
            map(res => res.data || res)
        );
    }

    createProductForm(data: FormData): Observable<Product> {
        return this.http.post<Product>(`${this.baseUrl}/products`, data);
    }

    updateProductForm(id: string, data: FormData): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/products/${id}`, data);
    }

    deleteProduct(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
    }
}