import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [NgIf, RouterLink, FormsModule],
    styleUrls: ['./product-form.component.scss'],
    templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
    isEdit = false;
    productId?: string;
    loading = false;
    error?: string;

    // Form fields
    title = '';
    category = '';
    description = '';
    price: number | null = null;

    // Image handling
    selectedFile: File | null = null;
    previewUrl: string | null = null;
    existingImage: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private apiService: ApiService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.productId = this.route.snapshot.paramMap.get('id') ?? undefined;
        this.isEdit = !!this.productId;

        if (this.isEdit && this.productId) {
            this.apiService.getProduct(this.productId).subscribe({
                next: product => {
                    this.title = product.title;
                    this.category = product.category;
                    this.description = product.description;
                    this.price = product.price;
                    this.existingImage = product.image ?? null;
                },
                error: () => this.router.navigate(['/products'])
            });
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.selectedFile = file;

        if (file) {
            const reader = new FileReader();
            reader.onload = e => this.previewUrl = e.target?.result as string;
            reader.readAsDataURL(file);
        } else {
            this.previewUrl = null;
        }
    }

    removeImage(): void {
        this.selectedFile = null;
        this.previewUrl = null;
        this.existingImage = null;
    }

    submit(): void {
        if (!this.title || !this.category || !this.description || this.price === null) {
            this.error = 'Пожалуйста, заполните все обязательные поля.';
            return;
        }

        this.loading = true;
        this.error = undefined;

        // Always send as FormData so image upload works
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('category', this.category);
        formData.append('description', this.description);
        formData.append('price', String(this.price));
        if (this.selectedFile) {
            formData.append('image', this.selectedFile);
        }

        const request$ = this.isEdit && this.productId
            ? this.apiService.updateProductForm(this.productId, formData)
            : this.apiService.createProductForm(formData);

        request$.subscribe({
            next: product => this.router.navigate(['/products', product.id]),
            error: err => {
                this.error = err?.error?.error ?? 'Произошла ошибка. Попробуйте снова.';
                this.loading = false;
            }
        });
    }
}