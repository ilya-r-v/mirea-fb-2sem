import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../models/product.model';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, CurrencyPipe],
  styleUrls: ['./products.component.scss'],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
    products: Product[] = [];

    get canManage(): boolean {
        return this.authService.hasRoleSync('seller', 'admin');
    }

    get canDelete(): boolean {
        return this.authService.hasRoleSync('admin');
    }

    constructor(
        private apiService: ApiService,
        public authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.apiService.getProducts().subscribe(products => this.products = products);
    }

    deleteProduct(id: string): void {
        if (confirm('Are you sure?')) {
            this.apiService.deleteProduct(id).subscribe(() => this.loadProducts());
        }
    }
}