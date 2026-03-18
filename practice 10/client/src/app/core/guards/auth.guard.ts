import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models/user.model';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if (authService.getAccessToken()) {
        return true;
    }
    router.navigate(['/login']);
    return false;
};

export function roleGuard(...roles: UserRole[]): CanActivateFn {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        if (authService.hasRoleSync(...roles)) {
            return true;
        }
        router.navigate(['/products']);
        return false;
    };
}