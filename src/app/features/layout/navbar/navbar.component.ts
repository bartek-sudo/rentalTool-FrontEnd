import { Component, inject, OnInit, AfterViewChecked } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { initDropdowns, initFlowbite } from 'flowbite';
import { AuthService } from '../../../core/services/auth.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { ToolService } from '../../tool/services/tool.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, AfterViewChecked {
  isDarkMode = false;
  private previousLoginState = false;

  private searchSubject = new Subject<string>();
  searchInputValue = '';
  showMobileSearch = false;

  protected authService = inject(AuthService);
  protected toolService = inject(ToolService);
  protected router = inject(Router);

  ngOnInit() {
    // Sprawdź aktualny stan przy inicjalizacji
    this.isDarkMode = localStorage['theme'] === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    initFlowbite();
    this.previousLoginState = this.authService.isLogged();

    // Debounce wyszukiwania
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngAfterViewChecked(): void {
    // Sprawdź, czy stan logowania się zmienił
    if (this.previousLoginState !== this.authService.isLogged()) {
      this.previousLoginState = this.authService.isLogged();

      // Reinicjalizuj wszystkie dropdowny po zmianie stanu logowania
      initDropdowns();
    }
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
}
