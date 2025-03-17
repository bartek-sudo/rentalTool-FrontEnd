import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

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
  private readonly TOKEN_KEY = 'auth_token';

  constructor() { }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  destroyToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
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
