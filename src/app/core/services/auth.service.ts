import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { environment } from '../../../environments/enviroment';
import { User } from '../models/user.model';
import { UserLoginRequest } from '../../features/auth/models/auth.model';
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

  constructor() { }

  login(credentials: UserLoginRequest): Observable<HttpResponse> {
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
          console.error('Login error', error);
          throw error;
        })
      );
  }

}
