export type UserRole = 'user' | 'seller' | 'admin';

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    blocked: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}