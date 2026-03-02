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

      if (isLogged && user) {
        setTimeout(() => {
          this.initUserMenuDropdown();
        }, 200);
      }
    });
  }

  ngOnInit() {
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
    this.initUserMenuDropdown();
  }

  private initUserMenuDropdown(): void {
    setTimeout(() => {
      const userMenuButton = document.getElementById('user-menu-button');
      const dropdown = document.getElementById('dropdown');

      if (userMenuButton && dropdown) {
        initDropdowns();
      }
    }, 100);
  }

  ngAfterViewChecked(): void {
    if (this.previousLoginState !== this.authService.isLogged()) {
      this.previousLoginState = this.authService.isLogged();

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

  isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.userType === 'ADMIN';
  }

  isModerator(): boolean {
    const user = this.authService.currentUser();
    return user?.userType === 'MODERATOR' || user?.userType === 'ADMIN';
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  performSearch(searchTerm: string) {
    this.toolService.setSearchTerm(searchTerm);

    if (this.router.url !== '/tools') {
      this.router.navigate(['/tools'], { queryParams: { search: searchTerm } });
    }
  }

  onSearchSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.querySelector('input[type="text"]') as HTMLInputElement;
    this.performSearch(input.value);
  }

  clearSearch() {
    this.searchInputValue = '';
    this.performSearch('');
  }

  toggleMobileSearch() {
    this.showMobileSearch = !this.showMobileSearch;
  }

  getInitials(firstName?: string | null, lastName?: string | null): string {
    if (!firstName || !lastName) return '?';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}
