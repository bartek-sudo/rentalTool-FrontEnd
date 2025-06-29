import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Reservation, ReservationStatus } from '../../model/reservation.model';
import { ReservationService } from '../../services/reservation.service';
import { ToolService } from '../../../tool/services/tool.service';
import { UserService } from '../../../user/services/user.service';

@Component({
  selector: 'app-my-tool-reservations',
  imports: [CommonModule, RouterModule],
  templateUrl: './my-tool-reservations.component.html',
  styleUrl: './my-tool-reservations.component.css'
})
export class MyToolReservationsComponent {
  reservations: Reservation[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Dla filtrowania według statusu
  activeStatusFilter: string = 'all';
  statusFilters = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'PENDING', label: 'Oczekujące' },
    { value: 'CONFIRMED', label: 'Potwierdzone' },
    { value: 'PAID', label: 'Opłacone' },
    { value: 'FINISHED', label: 'Zakończone' },
    { value: 'CANCELED', label: 'Anulowane' }
  ];

  ReservationStatus = ReservationStatus; // dla dostępu w template

  constructor(
    private reservationService: ReservationService,
    private toolService: ToolService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reservationService.getMyToolsReservations().subscribe({
      next: (response) => {
        this.reservations = response.data.reservations;

        // Pobierz informacje o narzędziach i najemcach
        this.reservations.forEach(reservation => {
          // Pobierz dane narzędzia
          this.toolService.getToolById(reservation.toolId).subscribe({
            next: (tool) => {
              reservation.tool = tool;
            },
            error: (error) => {
              console.error(`Nie udało się pobrać informacji o narzędziu ID: ${reservation.toolId}`, error);
            }
          });

          // Pobierz dane najemcy
          this.userService.getUserById(reservation.renterId).subscribe({
            next: (renterResponse) => {
              if (renterResponse.data?.user) {
                reservation.renter = renterResponse.data.user;
              }
            },
            error: (error) => {
              console.error(`Nie udało się pobrać informacji o najemcy ID: ${reservation.renterId}`, error);
            }
          });
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas ładowania rezerwacji:', error);
        this.errorMessage = 'Nie udało się załadować rezerwacji Twoich narzędzi. Spróbuj ponownie.';
        this.isLoading = false;
      }
    });
  }

  filterReservations(): Reservation[] {
    if (this.activeStatusFilter === 'all') {
      return this.reservations;
    }
    return this.reservations.filter(reservation => reservation.status === this.activeStatusFilter);
  }

  setStatusFilter(status: string): void {
    this.activeStatusFilter = status;
  }

  confirmReservation(reservationId: number): void {
    this.isLoading = true;

    this.reservationService.confirmReservation(reservationId).subscribe({
      next: (response) => {
        // Znajdź indeks rezerwacji w tablicy
        const index = this.reservations.findIndex(r => r.id === reservationId);

        if (index !== -1) {
          // Zachowaj referencje do tool i renter przed aktualizacją
          const toolRef = this.reservations[index].tool;
          const renterRef = this.reservations[index].renter;

          // Aktualizuj rezerwację z odpowiedzi API
          this.reservations[index] = response.data.reservation;

          // Przywróć zachowane referencje
          this.reservations[index].tool = toolRef;
          this.reservations[index].renter = renterRef;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas potwierdzania rezerwacji:', error);
        this.errorMessage = 'Nie udało się potwierdzić rezerwacji. Spróbuj ponownie.';
        this.isLoading = false;
      }
    });
  }

  finishReservation(reservationId: number): void {
    this.isLoading = true;

    this.reservationService.finishReservation(reservationId).subscribe({
      next: (response) => {
        // Znajdź indeks rezerwacji w tablicy
        const index = this.reservations.findIndex(r => r.id === reservationId);

        if (index !== -1) {
          // Zachowaj referencje do tool i renter przed aktualizacją
          const toolRef = this.reservations[index].tool;
          const renterRef = this.reservations[index].renter;

          // Aktualizuj rezerwację z odpowiedzi API
          this.reservations[index] = response.data.reservation;

          // Przywróć zachowane referencje
          this.reservations[index].tool = toolRef;
          this.reservations[index].renter = renterRef;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas kończenia rezerwacji:', error);
        this.errorMessage = 'Nie udało się zakończyć rezerwacji. Spróbuj ponownie.';
        this.isLoading = false;
      }
    });
  }

  // Helper do formatowania daty
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'Brak daty';
    }

    try {
      const date = new Date(dateString);

      // Sprawdź czy data jest poprawna
      if (isNaN(date.getTime())) {
        return 'Nieprawidłowa data';
      }

      return date.toLocaleDateString('pl-PL');
    } catch (error) {
      console.error('Błąd formatowania daty:', error, 'dla daty:', dateString);
      return 'Błąd daty';
    }
  }

  // Helper do tłumaczenia statusu
  translateStatus(status: string): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'Oczekująca';
      case ReservationStatus.CONFIRMED: return 'Potwierdzona';
      case ReservationStatus.PAID: return 'Opłacona';
      case ReservationStatus.FINISHED: return 'Zakończona';
      case ReservationStatus.CANCELED: return 'Anulowana';
      default: return status;
    }
  }

  // Helper do określania kolorów statusu
  getStatusColor(status: string): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case ReservationStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case ReservationStatus.PAID: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case ReservationStatus.FINISHED: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case ReservationStatus.CANCELED: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}
