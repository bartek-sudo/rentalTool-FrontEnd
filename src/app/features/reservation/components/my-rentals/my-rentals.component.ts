import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Reservation, ReservationStatus, normalizeReservationStatus } from '../../model/reservation.model';
import { ToolService } from '../../../tool/services/tool.service';
import { ReservationService } from '../../services/reservation.service';
import { UserService } from '../../../user/services/user.service';
import { TermsService } from '../../services/terms.service';
import { TermsDto } from '../../model/terms.model';
import { CategoryService } from '../../../tool/services/category.service';
import { Category } from '../../../tool/models/category.model';

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
  successMessage: string = '';
  selectedContactUser: any = null; // Przechowuje dane użytkownika do wyświetlenia w modalu
  showContactModal: boolean = false; // Steruje widocznością modalu
  // Terms modal
  selectedTerms: TermsDto | null = null;
  showTermsModal: boolean = false;
  isLoadingTerms: boolean = false;
  availableCategories: Category[] = [];

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
    private router: Router,
    private termsService: TermsService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.loadRentals();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        this.availableCategories = response.data?.categories || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadRentals(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.getMyRentals().subscribe({
      next: (response) => {
        this.rentals = response.data.rentals;
        this.rentals.forEach(rental => {
          rental.status = normalizeReservationStatus(rental.status);
        });

        this.rentals.forEach(rental => {
          this.toolService.getToolById(rental.toolId).subscribe({
            next: (tool) => {
              rental.tool = tool;

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

  openAcceptRegulationsModal(reservationId: number): void {
    this.router.navigate(['/accept-regulations', reservationId]);
  }

  openTermsModal(rental: Reservation): void {
    const termsId = rental.termsId ?? rental.tool?.termsId ?? null;
    if (!termsId) {
      this.errorMessage = 'Brak przypisanego regulaminu do tej rezerwacji.';
      return;
    }

    this.isLoadingTerms = true;
    this.selectedTerms = null;
    this.termsService.getTermsById(termsId).subscribe({
      next: (response) => {
        this.selectedTerms = response.data?.terms || null;
        this.showTermsModal = true;
        this.isLoadingTerms = false;
      },
      error: (error) => {
        console.error('Błąd podczas ładowania regulaminu:', error);
        this.errorMessage = 'Nie udało się pobrać treści regulaminu.';
        this.isLoadingTerms = false;
      }
    });
  }

  closeTermsModal(): void {
    this.showTermsModal = false;
    this.selectedTerms = null;
  }

  openContactModal(user: any): void {
    this.selectedContactUser = user;
    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.selectedContactUser = null;
  }

cancelReservation(reservationId: number): void {
  if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) {
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';
  this.successMessage = '';

  this.reservationService.cancelReservation(reservationId).subscribe({
    next: (response) => {
      const index = this.rentals.findIndex(r => r.id === reservationId);

      if (index !== -1) {
        const toolRef = this.rentals[index].tool;
        const ownerRef = this.rentals[index].owner;

        this.rentals[index] = response.data.reservation;
        this.rentals[index].status = normalizeReservationStatus(this.rentals[index].status);

        this.rentals[index].tool = toolRef;
        this.rentals[index].owner = ownerRef;
      }

      this.successMessage = 'Rezerwacja została pomyślnie anulowana.';
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Błąd podczas anulowania rezerwacji:', error);

      if (error.status === 400) {
        this.errorMessage = 'Nie można anulować tej rezerwacji. Rezerwacja nie jest w odpowiednim statusie.';
      } else if (error.status === 403) {
        this.errorMessage = 'Nie masz uprawnień do anulowania tej rezerwacji.';
      } else if (error.status === 404) {
        this.errorMessage = 'Rezerwacja nie została znaleziona.';
      } else if (error.error?.message) {
        this.errorMessage = error.error.message;
      } else {
        this.errorMessage = 'Nie udało się anulować rezerwacji. Spróbuj ponownie.';
      }

      this.isLoading = false;
    }
  });
}

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'Brak daty';
    }

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Nieprawidłowa data';
      }

      return date.toLocaleDateString('pl-PL');
    } catch (error) {
      console.error('Błąd formatowania daty:', error, 'dla daty:', dateString);
      return 'Błąd daty';
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'Oczekująca';
      case ReservationStatus.CONFIRMED: return 'Potwierdzona';
      case ReservationStatus.REGULATIONS_ACCEPTED: return 'Regulamin zaakceptowany';
      case ReservationStatus.CANCELED: return 'Anulowana';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case ReservationStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case ReservationStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case ReservationStatus.REGULATIONS_ACCEPTED: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case ReservationStatus.CANCELED: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getCategoryDisplay(categoryName: string | null): string {
    if (!categoryName || categoryName === 'OTHER') {
      return 'Regulamin ogólny';
    }
    const category = this.availableCategories.find(c => c.name === categoryName);
    return category ? category.displayName : categoryName;
  }
}
