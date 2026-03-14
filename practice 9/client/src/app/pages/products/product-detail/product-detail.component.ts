import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../models/product.model';
import { CurrencyPipe, NgIf } from '@angular/common';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [NgIf, RouterLink, CurrencyPipe],
    styleUrls: ['./product-detail.component.scss'],
    templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
    product?: Product;

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
        this.apiService.getProduct(id).subscribe({
            next: product => this.product = product,
            error: () => this.router.navigate(['/products'])
        });
        }
    }
}