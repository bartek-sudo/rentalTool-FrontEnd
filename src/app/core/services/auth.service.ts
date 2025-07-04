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
    return this.http.get<HttpResponse<{ user: User }>>(`${this.apiURL}/me`)
      .pipe(
        tap(response => {
          if (response.data && response.data.user) {
            this.currentUser.set(response.data.user);
            this.isLogged.set(true);
          }
        }),
        catchError(error => {
          this.logout();
          throw error;
        })
      );
  }

  checkAuthStatus(): void {
    if (this.tokenService.getToken()) {
      this.getUserInfo().subscribe();
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

}
