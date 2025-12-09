import { Component, inject, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { initDropdowns, initFlowbite } from 'flowbite';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ToolService } from '../../tool/services/tool.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  isDarkMode = false;
  private previousLoginState = false;

  private searchSubject = new Subject<string>();
  searchInputValue = '';
  showMobileSearch = false;

  protected authService = inject(AuthService);
  protected tokenService = inject(TokenService);
  protected toolService = inject(ToolService);
  protected router = inject(Router);

  constructor() {
    // Obserwuj zmiany stanu użytkownika i reinicjalizuj dropdowny
    effect(() => {
      const isLogged = this.authService.isLogged();
      const user = this.authService.currentUser();

      // Jeśli użytkownik się zmienił (został załadowany lub zmieniony), reinicjalizuj dropdowny
      if (isLogged && user) {
        // Poczekaj na następny cykl renderowania, aby menu było w DOM
        setTimeout(() => {
          this.initUserMenuDropdown();
        }, 200);
      }
    });
  }

  ngOnInit() {
    // Sprawdź aktualny stan przy inicjalizacji
    this.isDarkMode = localStorage['theme'] === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    this.previousLoginState = this.authService.isLogged();

    // Debounce wyszukiwania
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngAfterViewInit() {
    // Inicjalizuj dropdowny po renderowaniu DOM
    // initFlowbite() jest już wywoływane w app.component.ts
    this.initUserMenuDropdown();
  }

  private initUserMenuDropdown(): void {
    // Poczekaj na następny cykl, aby upewnić się że DOM jest gotowy
    setTimeout(() => {
      // Sprawdź czy menu użytkownika istnieje w DOM
      const userMenuButton = document.getElementById('user-menu-button');
      const dropdown = document.getElementById('dropdown');

      if (userMenuButton && dropdown) {
        // Inicjalizuj tylko dropdowny (nie cały Flowbite, bo jest już zainicjalizowany)
        initDropdowns();
      }
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Sprawdź, czy stan logowania się zmienił
    if (this.previousLoginState !== this.authService.isLogged()) {
      this.previousLoginState = this.authService.isLogged();

      // Reinicjalizuj dropdowny po zmianie stanu logowania
      if (this.authService.isLogged()) {
        setTimeout(() => {
          this.initUserMenuDropdown();
        }, 200);
      }
    }
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage['theme'] = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage['theme'] = 'light';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  // Sprawdź czy użytkownik ma rolę admin
  isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.userType === 'ADMIN';
  }

  // Sprawdź czy użytkownik ma rolę moderatora
  isModerator(): boolean {
    const user = this.authService.currentUser();
    return user?.userType === 'MODERATOR' || user?.userType === 'ADMIN';
  }

  // Obsługa wpisywania w pasku wyszukiwania
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  // Wykonaj wyszukiwanie
  performSearch(searchTerm: string) {
    this.toolService.setSearchTerm(searchTerm);

    // Przekieruj do strony wyników wyszukiwania
    if (this.router.url !== '/tools') {
      this.router.navigate(['/tools'], { queryParams: { search: searchTerm } });
    }
  }

  // Obsługa formularza wyszukiwania
  onSearchSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input[type="text"]') as HTMLInputElement;
    this.performSearch(input.value);
  }

  // Reset wyszukiwania
  clearSearch() {
    this.searchInputValue = '';
    this.performSearch('');
  }

  // Toggle mobilne wyszukiwanie
  toggleMobileSearch() {
    this.showMobileSearch = !this.showMobileSearch;
  }

  getInitials(firstName?: string | null, lastName?: string | null): string {
    if (!firstName || !lastName) return '?';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}
