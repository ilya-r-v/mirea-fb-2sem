import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { AuthResponse, User, UserRole } from '../../models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private accessTokenKey = 'accessToken';
    private refreshTokenKey = 'refreshToken';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private apiService: ApiService, private router: Router) {
        this.loadUser();
    }

    private loadUser(): void {
        const token = this.getAccessToken();
        if (!token) return;

        this.apiService.getMe().subscribe({
            next: (user) => this.currentUserSubject.next(user),
            error: (err: HttpErrorResponse) => {
                if (err.status === 401) {
                    this.logout();
                }
            },
        });
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey);
    }

    setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
    }

    clearTokens(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        this.currentUserSubject.next(null);
    }

    login(credentials: { email: string; password: string }): Observable<AuthResponse> {
        return this.apiService.login(credentials).pipe(
            tap(response => {
                this.setTokens(response.accessToken, response.refreshToken);
                this.loadUser();
            })
        );
    }

    register(data: any): Observable<User> {
        return this.apiService.register(data);
    }

    logout(): void {
        this.clearTokens();
        this.router.navigate(['/login']);
    }

    refreshToken(refreshToken: string): Observable<AuthResponse> {
        return this.apiService.refresh(refreshToken).pipe(
            tap(response => {
                this.setTokens(response.accessToken, response.refreshToken);
            })
        );
    }

    hasRole(...roles: UserRole[]): Observable<boolean> {
        return this.currentUser$.pipe(
            map(user => !!user && roles.includes(user.role))
        );
    }

    hasRoleSync(...roles: UserRole[]): boolean {
        const user = this.currentUserSubject.getValue();
        return !!user && roles.includes(user.role);
    }
}