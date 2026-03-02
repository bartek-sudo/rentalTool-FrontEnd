import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  verificationSuccess = false;
  emailNotVerified = false;
  userEmail = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    initFlowbite();

    // Sprawdź czy użytkownik został przekierowany po weryfikacji
    this.route.queryParams.subscribe(params => {
      if (params['verified'] === 'true') {
        this.verificationSuccess = true;
        // Ukryj komunikat po 5 sekundach
        setTimeout(() => {
          this.verificationSuccess = false;
        }, 5000);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.emailNotVerified = false;
    this.userEmail = this.loginForm.get('email')?.value;

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: error => {
        this.isLoading = false;

        const errorStatus = error.status || error.error?.statusCode;
        const errorReason = error.error?.reason || '';
        const errorMessage = error.error?.message || '';

        const isEmailNotVerified = errorReason === 'Email not verified';

        if (isEmailNotVerified) {
          this.emailNotVerified = true;
          this.errorMessage = 'Twój email nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową i kliknij link weryfikacyjny, aby aktywować konto.';
        } else {
          this.emailNotVerified = false;
          this.errorMessage = errorMessage || 'Wystąpił błąd. Spróbuj ponownie później.';
        }
      }
    });
  }

  goToVerificationPage(): void {
    this.router.navigate(['/verify-email'], {
      queryParams: { email: this.userEmail }
    });
  }

}

