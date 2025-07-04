import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';

interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
  authorities: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'jwt';

  constructor(private cookieService: CookieService) { }

  getToken(): string | null {
    // return localStorage.getItem(this.TOKEN_KEY);
    return this.cookieService.get(this.TOKEN_KEY) || null;
  }

  setToken(token: string): void {
    // localStorage.setItem(this.TOKEN_KEY, token);
    const expirationDate = this.getExpirationDateFromToken(token);
    this.cookieService.set(
      this.TOKEN_KEY,
      token,
      expirationDate,
      '/',
      undefined,
      false,  // zmień na true dla połączeń HTTPS
      'Strict'
    );
  }

  private getExpirationDateFromToken(token: string): Date {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return new Date(decoded.exp * 1000);
    } catch (e) {
      // W przypadku błędu ustawmy domyślny czas ważności na 1 dzień
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    }
  }

  destroyToken(): void {
    // Nie usuwaj ciasteczka po stronie frontu, backend ustawia wygasłe cookie przy wylogowaniu
  }

  getDecodedToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<TokenPayload>(token);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  isTokenExpired(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return true;
    }

    return Date.now() >= decoded.exp * 1000;
  }

  getRoles(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded) {
      return [];
    }

    return decoded.authorities;
  }

}
