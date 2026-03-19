import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/products/product-detail/product-detail.component';
import { ProductFormComponent } from './pages/products/product-form/product-form.component';
import { UsersComponent } from './pages/users/users.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
    {
        path: 'products/new',
        component: ProductFormComponent,
        canActivate: [authGuard, roleGuard('seller', 'admin')]
    },
    { path: 'products/:id', component: ProductDetailComponent, canActivate: [authGuard] },
    {
        path: 'products/:id/edit',
        component: ProductFormComponent,
        canActivate: [authGuard, roleGuard('seller', 'admin')]
    },
    {
        path: 'users',
        component: UsersComponent,
        canActivate: [authGuard, roleGuard('admin')]
    },
    { path: '', redirectTo: '/products', pathMatch: 'full' },
    { path: '**', redirectTo: '/products' }
];