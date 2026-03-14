import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Product } from '../../models/product.model';
import { RouterLink } from '@angular/router';
import { NgFor, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, NgFor, CurrencyPipe],
  styleUrls: ['./products.component.scss'],
  templateUrl: './products.component.html',
})
export class ProductsComponent implements OnInit {
    products: Product[] = [];

    constructor(private apiService: ApiService) {}

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