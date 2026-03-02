import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  status: 'loading' | 'success' | 'error' | 'pending' = 'loading';
  message = '';
  email = '';
  resendForm: FormGroup;
  isResending = false;
  resendSuccess = false;
  resendError = '';

  constructor() {
    this.resendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    initFlowbite();

    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const success = params['success'];
      const error = params['error'];

      if (token) {
        this.verifyEmail(token);
      } else if (success === 'true') {
        this.status = 'success';
        this.message = 'Twój email został pomyślnie zweryfikowany! Możesz się teraz zalogować.';
      } else if (error) {
        this.status = 'error';
        this.message = this.getErrorMessage(error);
      } else {
        this.status = 'pending';
        this.message = 'Wprowadź swój adres email, aby ponownie otrzymać email weryfikacyjny.';
      }
    });

    const emailParam = this.route.snapshot.queryParams['email'];
    if (emailParam) {
      this.email = emailParam;
      this.resendForm.patchValue({ email: emailParam });
    }
  }

  verifyEmail(token: string) {
    this.status = 'loading';
    this.message = 'Weryfikowanie emaila...';

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.status = 'success';
        this.message = response.message || 'Twój email został pomyślnie zweryfikowany! Możesz się teraz zalogować.';
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { verified: 'true' } });
        }, 3000);
      },
      error: (error) => {
        this.status = 'error';
        if (error.error && error.error.message) {
          this.message = error.error.message;
        } else {
          this.message = 'Wystąpił błąd podczas weryfikacji emaila. Token może być nieważny lub wygasły.';
        }
      }
    });
  }

  resendVerificationEmail() {
    if (this.resendForm.invalid) {
      return;
    }

    this.isResending = true;
    this.resendSuccess = false;
    this.resendError = '';
    const email = this.resendForm.get('email')?.value;

    this.authService.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.isResending = false;
        this.resendSuccess = true;
        this.email = email;
        this.message = response.message || 'Email weryfikacyjny został wysłany. Sprawdź swoją skrzynkę pocztową.';
      },
      error: (error) => {
        this.isResending = false;
        if (error.error && error.error.message) {
          this.resendError = error.error.message;
        } else {
          this.resendError = 'Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie później.';
        }
      }
    });
  }

  getErrorMessage(error: string): string {
    const errorMessages: { [key: string]: string } = {
      'token_expired': 'Token weryfikacyjny wygasł. Wyślij nowy email weryfikacyjny.',
      'token_invalid': 'Token weryfikacyjny jest nieważny. Wyślij nowy email weryfikacyjny.',
      'email_already_verified': 'Ten email został już zweryfikowany.',
      'user_not_found': 'Użytkownik nie został znaleziony.'
    };

    return errorMessages[error] || 'Wystąpił błąd podczas weryfikacji emaila.';
  }
}
