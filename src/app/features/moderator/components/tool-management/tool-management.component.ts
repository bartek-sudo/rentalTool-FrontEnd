import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToolService } from '../../../tool/services/tool.service';
import { Tool } from '../../../tool/models/tool.model';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/enviroment';
import { AuthService } from '../../../../core/services/auth.service';
import { TokenService } from '../../../../core/services/token.service';

@Component({
  selector: 'app-tool-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tool-management.component.html',
  styleUrl: './tool-management.component.css'
})
export class ToolManagementComponent implements OnInit, OnDestroy {
  tools: Tool[] = [];
  isLoading = false;
  searchTerm = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  showDeleteModal = false;
  showModerationModal = false;
  selectedTool: Tool | null = null;
  moderationAction: 'approve' | 'reject' | 'remoderation' = 'approve';
  moderationComment = '';

  showSuccessMessage = false;
  showErrorMessage = false;
  successMessage = '';
  errorMessage = '';

  activeStatusFilter = 'pending';
  statusFilters = [
    { value: 'pending', label: 'Oczekujące na moderację' },
    { value: 'approved', label: 'Zatwierdzone' },
    { value: 'rejected', label: 'Odrzucone' }
  ];

  Math = Math;

  userRole = '';
  isModerator = false;

  private destroy$ = new Subject<void>();

  constructor(
    private toolService: ToolService,
    private router: Router,
    private http: HttpClient,
    public authService: AuthService,
    public tokenService: TokenService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.loadTools();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkUserRole() {
    const roles = this.tokenService.getRoles();
    this.isModerator = roles.includes('MODERATOR') || roles.includes('ROLE_MODERATOR') || this.isAdmin();
  }

  isAdmin(): boolean {
    const roles = this.tokenService.getRoles();
    return roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  }

  getPageTitle(): string {
    if (this.isAdmin()) {
      return 'Zarządzanie narzędziami';
    } else if (this.isModerator) {
      return 'Moderacja narzędzi';
    }
    return 'Narzędzia';
  }

  loadTools() {
    this.isLoading = true;

    const url = `${environment.apiUrl}/api/v1/moderation/status/${this.activeStatusFilter}?page=${this.currentPage}&size=${this.pageSize}`;

    this.http.get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.tools = response.data.tools;
            this.totalPages = response.data.totalPages;
            this.totalItems = response.data.totalItems;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tools:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.currentPage = 0;
    this.loadTools();
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadTools();
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

  approveTool(tool: Tool) {
    if (!tool.id) return;

    this.selectedTool = tool;
    this.moderationAction = 'approve';
    this.showModerationModal = true;
  }

  rejectTool(tool: Tool) {
    if (!tool.id) return;

    this.selectedTool = tool;
    this.moderationAction = 'reject';
    this.showModerationModal = true;
  }

  submitModeration(action: 'approve' | 'reject' | 'remoderation'): void {
    if (!this.selectedTool) return;

    if (action === 'reject' && !this.moderationComment.trim()) {
      return; // Walidacja już w template
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    this.toolService.updateModerationStatus(this.selectedTool.id, status, this.moderationComment).subscribe({
      next: () => {
        this.displaySuccessMessage(`Narzędzie zostało ${action === 'approve' ? 'zatwierdzone' : 'odrzucone'}`);
        this.closeModals();
        this.loadTools();
      },
      error: (error) => {
        console.error('Błąd podczas moderacji:', error);
        this.displayErrorMessage(`Błąd podczas ${action === 'approve' ? 'zatwierdzania' : 'odrzucania'} narzędzia`);
      }
    });
  }

  showToolDetailsModal(tool: Tool) {
    this.router.navigate(['/tool', tool.id]);
  }

  showDeleteToolModal(tool: Tool) {
    this.selectedTool = tool;
    this.showDeleteModal = true;
  }

  deleteTool() {
    if (!this.selectedTool?.id) return;

    console.log('Deleting tool:', this.selectedTool.id);
    this.closeModals();
  }

  closeModals(): void {
    this.showModerationModal = false;
    this.selectedTool = null;
    this.moderationComment = '';
  }

  displaySuccessMessage(message: string) {
    this.successMessage = message;
    this.showSuccessMessage = true;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  displayErrorMessage(message: string) {
    this.errorMessage = message;
    this.showErrorMessage = true;
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  filterTools(): Tool[] {
    return this.tools;
  }

  setStatusFilter(status: string) {
    this.activeStatusFilter = status;
    this.currentPage = 0;
    this.loadTools();
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

  getStatusColor(status?: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'PENDING': return 'Oczekujące';
      case 'APPROVED': return 'Zatwierdzone';
      case 'REJECTED': return 'Odrzucone';
      default: return status || 'Nieznany';
    }
  }
}
