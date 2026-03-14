import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../models/product.model';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [FormsModule, RouterLink, NgIf],
    styleUrls: ['./product-form.component.scss'],
    templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
     productData: Omit<Product, 'id'> = { title: '', category: '', description: '', price: 0 };
    isEdit = false;
    productId?: string;

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = params['id']; // строка или undefined
            if (id) {
                this.isEdit = true;
                this.productId = id;
                this.apiService.getProduct(id).subscribe(product => {
                    this.productData = {
                        title: product.title,
                        category: product.category,
                        description: product.description,
                        price: product.price
                    };
                });
            }
        });
    }

    onSubmit(): void {
        if (this.isEdit && this.productId) {
            const productId = this.productId;
            this.apiService.updateProduct(productId, this.productData).subscribe(() => {
                this.router.navigate(['/products', productId]);
            });
        } else {
            this.apiService.createProduct(this.productData).subscribe((product) => {
                this.router.navigate(['/products', product.id]);
            });
        }
    }
}