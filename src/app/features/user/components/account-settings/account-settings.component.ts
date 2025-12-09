import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.css',
  imports: [ReactiveFormsModule, CommonModule]
})
export class AccountSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  user: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  ngOnInit(): void {
    this.authService.getUserInfo().subscribe({
      next: (res) => {
        if (res.data?.user) {
          this.user = res.data.user;
          this.initForms();
        }
      },
      error: () => {
        this.errorMessage = 'Nie udało się pobrać danych użytkownika.';
      }
    });
  }

  initForms() {
    this.profileForm = this.fb.group({
      firstName: [this.user?.firstName, Validators.required],
      lastName: [this.user?.lastName, Validators.required],
      email: [this.user?.email, [Validators.required, Validators.email]],
      phoneNumber: [this.user?.phoneNumber || '', [Validators.required, Validators.minLength(9), Validators.maxLength(15)]], // Wymagane pole
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(256)]],
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(256)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatch });
  }

  passwordsMatch(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsNotMatch: true };
  }

  onSaveProfile() {
    if (!this.user) return;
    if (this.profileForm.invalid) return;
    this.loading = true;
    this.userService.updateOwnUser(this.profileForm.value).subscribe({
      next: (res) => {
        if (res.message) {
          this.authService['tokenService'].setToken(res.message);
        }
        this.successMessage = 'Dane zostały zaktualizowane.';
        this.errorMessage = '';
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Błąd podczas aktualizacji danych.';
        this.successMessage = '';
        this.loading = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.passwordSuccessMessage = 'Hasło zostało zmienione.';
        this.passwordErrorMessage = '';
        this.loading = false;
        this.passwordForm.reset();
      },
      error: (err) => {
        let errorMsg = '';
        try {
          const errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
          if (err.status === 400 && errorObj?.message === 'Old password is incorrect') {
            errorMsg = 'Stare hasło jest nieprawidłowe.';
          } else {
            errorMsg = errorObj?.message || 'Błąd podczas zmiany hasła.';
          }
        } catch {
          errorMsg = 'Błąd podczas zmiany hasła.';
        }
        this.passwordErrorMessage = errorMsg;
        this.passwordSuccessMessage = '';
        this.loading = false;
      }
    });
  }
}
