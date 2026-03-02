import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { environment } from '../../../environments/enviroment';
import { User } from '../models/user.model';
import { UserLoginRequest, UserRegisterRequest } from '../../features/auth/models/auth.model';
import { catchError, Observable, tap } from 'rxjs';
import { HttpResponse } from '../models/http-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  currentUser = signal<User | null>(null);
  isLogged = signal<boolean>(false);

  private apiURL = `${environment.apiUrl}/api/v1/auth`;

  constructor() {
    // Inicjalizacja autentykacji jest obsługiwana przez APP_INITIALIZER
    // w app.config.ts, aby zapewnić, że stan jest przywrócony przed startem aplikacji
    // Dodatkowo wywołujemy checkAuthStatus jako zabezpieczenie
    this.checkAuthStatus();
   }

  login(credentials: UserLoginRequest): Observable<HttpResponse<{ user: User }>> {
    return this.http.post<HttpResponse<{ user: User }>>(`${this.apiURL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.data && response.data.user) {
            this.tokenService.setToken(response.message);
            this.currentUser.set(response.data.user);
            this.isLogged.set(true);
          }
        }),
        catchError(error => {
          throw error;
        })
      );
  }

  register(userData: UserRegisterRequest): Observable<HttpResponse<{ user: User }>> {
    return this.http.post<HttpResponse<{ user: User }>>(`${this.apiURL}/register`, userData)
      .pipe(
        catchError(error => {
          throw error;
        })
      );
  }

  logout(): void {
    this.http.post(`${this.apiURL}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.tokenService.destroyToken();
        this.currentUser.set(null);
        this.isLogged.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        // Nawet jeśli backend nie odpowie, wyczyść stan lokalnie
        this.tokenService.destroyToken();
        this.currentUser.set(null);
        this.isLogged.set(false);
        this.router.navigate(['/login']);
      }
    });
  }

  getUserInfo(): Observable<HttpResponse<{ user: User }>> {
    return this.http.get<HttpResponse<{ user: User }>>(`${this.apiURL}/me`, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response.data && response.data.user) {
            this.currentUser.set(response.data.user);
            this.isLogged.set(true);
          }
        }),
        catchError(error => {
          // Tylko dla błędów 401/403 wywołaj logout - token jest nieważny
          // Backend zwraca teraz HttpResponse JSON z komunikatem błędu (zamiast pustej odpowiedzi)
          // Komunikat jest dostępny w error.error.message dla komponentów, które go potrzebują
          if (error.status === 401 || error.status === 403) {
            this.tokenService.destroyToken();
            this.currentUser.set(null);
            this.isLogged.set(false);
          }
          throw error;
        })
      );
  }

  checkAuthStatus(): void {
    const token = this.tokenService.getToken();

    if (token) {
      // Sprawdź czy token nie wygasł
      if (this.tokenService.isTokenExpired()) {
        this.tokenService.destroyToken();
        this.currentUser.set(null);
        this.isLogged.set(false);
        return;
      }

      // Jeśli token jest ważny, pobierz informacje o użytkowniku
      this.getUserInfo().subscribe({
        next: () => {
          // Stan użytkownika został ustawiony w tap() w getUserInfo()
        },
        error: (error) => {
          // Tylko dla błędów 401/403 wyczyść stan - token jest nieważny
          if (error.status === 401 || error.status === 403) {
            this.currentUser.set(null);
            this.isLogged.set(false);
          }
          // Dla innych błędów (np. sieciowych) nie wyczyść stanu - token może być nadal ważny
        }
      });
    } else {
      this.currentUser.set(null);
      this.isLogged.set(false);
    }
  }

  changePassword(oldPassword: string, newPassword: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${this.apiURL}/change-password`, {
      oldPassword,
      newPassword
    });
  }

  // Metoda do inicjalizacji autentykacji przy starcie aplikacji
  initializeAuth(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Nie sprawdzaj tokenu z cookies (może być HttpOnly i nie być dostępny dla JS)
      // Zamiast tego po prostu spróbuj pobrać informacje o użytkowniku
      // Jeśli cookie jest HttpOnly, zostanie automatycznie wysłane z żądaniem
      this.getUserInfo().subscribe({
        next: () => {
          resolve();
        },
        error: (error) => {
          // Tylko dla błędów 401/403 wyczyść stan - token jest nieważny
          if (error.status === 401 || error.status === 403) {
            this.currentUser.set(null);
            this.isLogged.set(false);
          }
          // Dla innych błędów (np. sieciowych) nie wyczyść stanu
          resolve(); // Nawet jeśli błąd, kontynuuj inicjalizację
        }
      });
    });
  }

  // Weryfikacja emaila - wywołana przez backend, który przekierowuje na frontend
  // Frontend tylko obsługuje parametry URL i pokazuje odpowiednie komunikaty
  verifyEmail(token: string): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${this.apiURL}/verify-email`, {
      params: { token }
    }).pipe(
      tap(() => {
        // Po weryfikacji odśwież dane użytkownika jeśli jest zalogowany
        if (this.isLogged()) {
          this.getUserInfo().subscribe();
        }
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // Ponowne wysłanie emaila weryfikacyjnego
  resendVerificationEmail(email: string): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${this.apiURL}/resend-verification`, null, {
      params: { email }
    }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

}
