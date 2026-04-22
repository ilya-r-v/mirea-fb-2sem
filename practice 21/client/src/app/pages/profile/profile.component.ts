import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [NgIf, AsyncPipe],
    styleUrls: ['./profile.component.scss'],
    templateUrl: './profile.component.html',
})
export class ProfileComponent {
    constructor(public authService: AuthService) {}
}