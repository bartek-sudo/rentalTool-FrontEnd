import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';
import { TermsService } from '../../services/terms.service';
import { ToolService } from '../../../tool/services/tool.service';
import { TermsDto, ContactInfo } from '../../model/terms.model';
import { Reservation, ReservationStatus, normalizeReservationStatus } from '../../model/reservation.model';
import { CategoryService } from '../../../tool/services/category.service';
import { Category } from '../../../tool/models/category.model';

@Component({
  selector: 'app-accept-regulations',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './accept-regulations.component.html',
  styleUrl: './accept-regulations.component.css'
})
export class AcceptRegulationsComponent implements OnInit {
  reservationId!: number;
  reservation: Reservation | null = null;
  assignedTerms: TermsDto | null = null;
  termsAccepted: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  contactInfo: ContactInfo | null = null;
  showContactInfo: boolean = false;
  availableCategories: Category[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private termsService: TermsService,
    private toolService: ToolService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.reservationId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.reservationId) {
      this.loadReservation();
      this.loadCategories();
    }
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

  loadReservation(): void {
    this.isLoading = true;
    this.reservationService.getMyRentals().subscribe({
      next: (response) => {
        const reservation = response.data?.rentals?.find((r: Reservation) => r.id === this.reservationId);

        if (!reservation) {
          this.errorMessage = 'Nie znaleziono wskazanej rezerwacji.';
          this.isLoading = false;
          return;
        }

        reservation.status = normalizeReservationStatus(reservation.status);
        this.reservation = reservation;

        this.toolService.getToolById(reservation.toolId).subscribe({
          next: (tool) => {
            this.reservation!.tool = tool;
            const termsId = reservation.termsId ?? tool.termsId ?? null;
            if (termsId) {
              this.reservation!.termsId = termsId;
              this.loadAssignedTerms(termsId);
            } else {
              this.errorMessage = 'Właściciel nie przypisał regulaminu do tego narzędzia. Skontaktuj się z nim, aby mógł to zrobić.';
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('Błąd podczas ładowania narzędzia:', error);
            this.errorMessage = 'Nie udało się załadować danych narzędzia.';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Błąd podczas ładowania rezerwacji:', error);
        this.errorMessage = 'Nie udało się załadować rezerwacji.';
        this.isLoading = false;
      }
    });
  }

  private loadAssignedTerms(termsId: number): void {
    this.termsService.getTermsById(termsId).subscribe({
      next: (response) => {
        this.assignedTerms = response.data?.terms || null;
        if (!this.assignedTerms) {
          this.errorMessage = 'Nie udało się pobrać treści przypisanego regulaminu.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas ładowania regulaminu:', error);
        this.errorMessage = 'Nie udało się załadować treści regulaminu.';
        this.assignedTerms = null;
        this.isLoading = false;
      }
    });
  }

  acceptRegulations(): void {
    if (!this.termsAccepted) {
      this.errorMessage = 'Musisz potwierdzić zapoznanie się z regulaminem.';
      return;
    }

    if (!this.reservation?.termsId || !this.assignedTerms) {
      this.errorMessage = 'Brak przypisanego regulaminu. Skontaktuj się z właścicielem narzędzia.';
      return;
    }

    if (this.reservation.status !== ReservationStatus.CONFIRMED) {
      this.errorMessage = 'Rezerwację można sfinalizować dopiero po jej potwierdzeniu przez właściciela.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.reservationService.acceptRegulations(this.reservationId, {
      termsAccepted: true
    }).subscribe({
      next: (response) => {
        if (response.data) {
          this.contactInfo = response.data.contactInfo;
          this.showContactInfo = true;
          if (response.data.reservation) {
            response.data.reservation.status = normalizeReservationStatus(response.data.reservation.status);
            this.reservation = response.data.reservation;
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Błąd podczas akceptacji regulaminu:', error);
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Nie udało się zaakceptować regulaminu. Spróbuj ponownie.';
        }
        this.isLoading = false;
      }
    });
  }

  closeContactInfo(): void {
    this.router.navigate(['/my-rentals']);
  }

  getCategoryDisplayName(categoryName: string | null): string {
    if (!categoryName || categoryName === 'OTHER') {
      return 'Regulamin ogólny';
    }
    const category = this.availableCategories.find(c => c.name === categoryName);
    return category ? category.displayName : categoryName;
  }
}

