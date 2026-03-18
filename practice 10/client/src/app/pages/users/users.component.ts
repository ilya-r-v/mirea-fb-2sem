import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { User, UserRole } from '../../models/user.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [NgFor, NgIf, FormsModule],
    styleUrls: ['./users.component.scss'],
    templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
    users: User[] = [];
    editingId: string | null = null;
    editData: { first_name: string; last_name: string; role: UserRole } = {
        first_name: '',
        last_name: '',
        role: 'user',
    };

    constructor(private apiService: ApiService) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.apiService.getUsers().subscribe(users => this.users = users);
    }

    startEdit(user: User): void {
        this.editingId = user.id;
        this.editData = {
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
        };
    }

    cancelEdit(): void {
        this.editingId = null;
    }

    saveEdit(id: string): void {
        this.apiService.updateUser(id, this.editData).subscribe({
            next: () => {
                this.editingId = null;
                this.loadUsers();
            },
            error: (err) => console.error('Update failed', err),
        });
    }

    blockUser(id: string): void {
        if (confirm('Block this user?')) {
            this.apiService.blockUser(id).subscribe(() => this.loadUsers());
        }
    }
}