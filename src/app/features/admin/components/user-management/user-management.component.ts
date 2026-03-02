import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../user/services/user.service';
import { User } from '../../../../core/models/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  isLoading = false;
  searchTerm = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  Math = Math;

  showUserDetails = false;
  showRoleModal = false;
  selectedUser: User | null = null;
  newRole = '';

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getAllUsers(this.currentPage, this.pageSize, this.searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.users = response.data.users;
            this.totalPages = response.data.totalPages;
            this.totalItems = response.data.totalItems;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.currentPage = 0;
    this.loadUsers();
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  getPageNumbers(): number[] {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  }

  blockUser(user: User) {
    if (!user.id) return;

    this.userService.blockUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            const index = this.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
              this.users[index] = response.data.user;
            }
          }
        },
        error: (error) => {
          console.error('Error blocking user:', error);
        }
      });
  }

  unblockUser(user: User) {
    if (!user.id) return;

    this.userService.unblockUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            const index = this.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
              this.users[index] = response.data.user;
            }
          }
        },
        error: (error) => {
          console.error('Error unblocking user:', error);
        }
      });
  }

  showRoleChangeModal(user: User) {
    this.selectedUser = user;
    this.newRole = user.userType || '';
    this.showRoleModal = true;
  }

  changeUserRole() {
    if (!this.selectedUser?.id) return;

    this.userService.changeUserRole(this.selectedUser.id, this.newRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
            if (index !== -1) {
              this.users[index] = response.data.user;
            }
          }
          this.showRoleModal = false;
          this.selectedUser = null;
        },
        error: (error) => {
          console.error('Error changing user role:', error);
        }
      });
  }

  showUserDetailsModal(user: User) {
    this.selectedUser = user;
    this.showUserDetails = true;
  }

  closeModals() {
    this.showUserDetails = false;
    this.showRoleModal = false;
    this.selectedUser = null;
  }

  getUserStatus(user: User): string {
    if (user.blocked) return 'Zablokowany';
    if (!user.verified) return 'Niezweryfikowany';
    return 'Aktywny';
  }

  getUserStatusColor(user: User): string {
    if (user.blocked) return 'text-red-600 bg-red-100';
    if (!user.verified) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  }

  getUserRole(user: User): string {
    if (user.userType === 'ADMIN') return 'Administrator';
    if (user.userType === 'MODERATOR') return 'Moderator';
    return 'Użytkownik';
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'Brak daty';
    }

    try {
      const parts = dateString.split(' ');
      if (parts.length === 2) {
        const datePart = parts[0];
        const timePart = parts[1];

        const dateParts = datePart.split('-');
        if (dateParts.length === 3) {
          const day = dateParts[0];
          const month = dateParts[1];
          const year = dateParts[2];

          // Utwórz datę w formacie ISO
          const isoDate = `${year}-${month}-${day}T${timePart}`;
          const date = new Date(isoDate);

          if (isNaN(date.getTime())) {
            return 'Nieprawidłowa data';
          }

          return date.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Nieprawidłowa data';
      }

      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Błąd formatowania daty:', error, 'dla daty:', dateString);
      return 'Błąd daty';
    }
  }
}
