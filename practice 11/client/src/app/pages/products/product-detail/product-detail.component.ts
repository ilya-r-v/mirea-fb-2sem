import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
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

    get canManage(): boolean {
        return this.authService.hasRoleSync('seller', 'admin');
    }

    get canDelete(): boolean {
        return this.authService.hasRoleSync('admin');
    }

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService,
        private authService: AuthService,
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

    deleteProduct(): void {
        if (this.product && confirm('Are you sure?')) {
            this.apiService.deleteProduct(this.product.id).subscribe(() => {
                this.router.navigate(['/products']);
            });
        }
    }
}