import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Reservation, ReservationStatus, normalizeReservationStatus } from '../../../reservation/model/reservation.model';
import { ReservationService } from '../../../reservation/services/reservation.service';
import { UserService } from '../../../user/services/user.service';
import { ToolService } from '../../../tool/services/tool.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-management.component.html',
  styleUrl: './reservation-management.component.css'
})
export class ReservationManagementComponent implements OnInit {
  reservations: Reservation[] = [];
  isLoading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  userRole = '';
  isAdmin = false;
  isModerator = false;

  constructor(
    private reservationService: ReservationService,
    private userService: UserService,
    private toolService: ToolService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadReservations();
  }

  checkUserRole() {
    const user = this.authService.currentUser();
    if (user) {
      this.userRole = user.role || '';
      this.isAdmin = user.role === 'ADMIN';
      this.isModerator = user.role === 'MODERATOR';
    }
  }

  getPageTitle(): string {
    if (this.isAdmin) {
      return 'Zarządzanie rezerwacjami';
    } else if (this.isModerator) {
      return 'Moderacja rezerwacji';
    }
    return 'Rezerwacje';
  }

  loadReservations() {
    this.isLoading = true;
    this.reservationService.getAllReservations(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.reservations = response.data.reservations;
        this.reservations.forEach(reservation => {
          reservation.status = normalizeReservationStatus(reservation.status);
        });
        this.totalPages = response.data.totalPages;
        this.totalItems = response.data.totalItems;
        this.currentPage = response.data.currentPage;

        this.reservations.forEach(reservation => {
          if (reservation.toolId) {
            this.toolService.getToolById(reservation.toolId).subscribe({
              next: (tool) => {
                reservation.tool = tool;
                if (tool && tool.ownerId) {
                  this.userService.getUserById(tool.ownerId).subscribe({
                    next: (ownerResp) => {
                      if (ownerResp.data?.user) {
                        reservation.owner = ownerResp.data.user;
                      }
                    }
                  });
                }
              }
            });
          }
          if (reservation.renterId && !reservation.renter) {
            this.userService.getUserById(reservation.renterId).subscribe({
              next: (userResp) => {
                if (userResp.data?.user) {
                  reservation.renter = userResp.data.user;
                }
              }
            });
          }
        });

        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Błąd podczas ładowania rezerwacji';
        this.isLoading = false;
      }
    });
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadReservations();
    }
  }

  getPageNumbers(): number[] {
    const visiblePages = 5;
    const pageNumbers: number[] = [];
    let startPage = Math.max(0, this.currentPage - Math.floor(visiblePages / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + visiblePages - 1);
    if (endPage - startPage + 1 < visiblePages) {
      startPage = Math.max(0, endPage - visiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }
}
