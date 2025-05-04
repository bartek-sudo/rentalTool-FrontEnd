import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { initDropdowns, initFlowbite } from 'flowbite';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isDarkMode = false;
  private previousLoginState = false;


  protected authService = inject(AuthService);

  ngOnInit() {
    initFlowbite();
    // Sprawdź aktualny stan przy inicjalizacji
    this.isDarkMode = localStorage['theme'] === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    initFlowbite();
    this.previousLoginState = this.authService.isLogged();
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

}
