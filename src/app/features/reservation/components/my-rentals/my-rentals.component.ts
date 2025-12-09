import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Reservation, ReservationStatus, normalizeReservationStatus } from '../../model/reservation.model';
import { ToolService } from '../../../tool/services/tool.service';
import { ReservationService } from '../../services/reservation.service';
import { UserService } from '../../../user/services/user.service';

@Component({
  selector: 'app-my-rentals',
  imports: [CommonModule, RouterModule],
  templateUrl: './my-rentals.component.html',
  styleUrl: './my-rentals.component.css'
})
export class MyRentalsComponent {
  rentals: Reservation[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Dla filtrowania według statusu
  activeStatusFilter: string = 'all';
  statusFilters = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'PENDING', label: 'Oczekujące' },
    { value: 'CONFIRMED', label: 'Potwierdzone' },
    { value: 'REGULATIONS_ACCEPTED', label: 'Regulamin zaakceptowany' },
    { value: 'CANCELED', label: 'Anulowane' }
  ];

  ReservationStatus = ReservationStatus; // dla dostępu w template

  constructor(
    private reservationService: ReservationService,
    private toolService: ToolService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRentals();
  }

  loadRentals(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reservationService.getMyRentals().subscribe({
      next: (response) => {
        this.rentals = response.data.rentals;
        // Normalizuj statusy - zamień stare statusy PAID/FINISHED na nowe
        this.rentals.forEach(rental => {
          rental.status = normalizeReservationStatus(rental.status);
        });

        // Pobierz informacje o narzędziach i właścicielach
        this.rentals.forEach(rental => {
          // Pobierz dane narzędzia
          this.toolService.getToolById(rental.toolId).subscribe({
            next: (tool) => {
              rental.tool = tool;

              // Pobierz dane właściciela narzędzia
              if (rental.tool && rental.tool.ownerId) {
                this.userService.getUserById(rental.tool.ownerId).subscribe({
                  next: (ownerResponse) => {
                    if (ownerResponse.data?.user) {
                      rental.owner = ownerResponse.data.user;
                    }
                  },
                  error: (error) => {
                    console.error(`Nie udało się pobrać informacji o właścicielu ID: ${rental.tool?.ownerId}`, error);
                  }
                });
              }
            },
            error: (error) => {
              console.error(`Nie udało się pobrać informacji o narzędziu ID: ${rental.toolId}`, error);
            }
          });
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas ładowania wypożyczeń:', error);
        this.errorMessage = 'Nie udało się załadować Twoich wypożyczeń. Spróbuj ponownie.';
        this.isLoading = false;
      }
    });
  }

  filterRentals(): Reservation[] {
    if (this.activeStatusFilter === 'all') {
      return this.rentals;
    }
    return this.rentals.filter(rental => rental.status === this.activeStatusFilter);
  }

  setStatusFilter(status: string): void {
    this.activeStatusFilter = status;
  }

  // Metoda do otwarcia modala akceptacji regulaminu
  openAcceptRegulationsModal(reservationId: number): void {
    // Przekieruj do komponentu akceptacji regulaminu
    this.router.navigate(['/accept-regulations', reservationId]);
  }

cancelReservation(reservationId: number): void {
  if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) {
    return;
  }

  this.isLoading = true;

  this.reservationService.cancelReservation(reservationId).subscribe({
    next: (response) => {
      const index = this.rentals.findIndex(r => r.id === reservationId);

      if (index !== -1) {
        // Zachowaj referencje przed aktualizacją
        const toolRef = this.rentals[index].tool;
        const ownerRef = this.rentals[index].owner;

        // Aktualizuj rezerwację
        this.rentals[index] = response.data.reservation;
        // Normalizuj status - zamień stare statusy PAID/FINISHED na nowe
        this.rentals[index].status = normalizeReservationStatus(this.rentals[index].status);

        // Przywróć referencje
        this.rentals[index].tool = toolRef;
        this.rentals[index].owner = ownerRef;
      }

      this.isLoading = false;
    },
    error: (error) => {
      console.error('Błąd podczas anulowania rezerwacji:', error);
      this.errorMessage = 'Nie udało się anulować rezerwacji. Spróbuj ponownie.';
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
      case ReservationStatus.REGULATIONS_ACCEPTED: return 'Regulamin zaakceptowany';
      case ReservationStatus.CANCELED: return 'Anulowana';
      default: return status;
    }
  }

  // Helper do określania kolorów statusu
  getStatusColor(status: string): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case ReservationStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case ReservationStatus.REGULATIONS_ACCEPTED: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case ReservationStatus.CANCELED: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}
