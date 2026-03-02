import { Component } from '@angular/core';
import { Tool } from '../../models/tool.model';
import { ToolService } from '../../services/tool.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-tools',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-tools.component.html',
  styleUrl: './my-tools.component.css'
})
export class MyToolsComponent {
  tools: Tool[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  selectedSort: string = 'created_desc';
  sortOptions = [
    { value: 'created_desc', label: 'Najnowsze' },
    { value: 'created_asc', label: 'Najstarsze' },
    { value: 'name_asc', label: 'Nazwa (A-Z)' },
    { value: 'name_desc', label: 'Nazwa (Z-A)' },
    { value: 'price_asc', label: 'Cena (rosnąco)' },
    { value: 'price_desc', label: 'Cena (malejąco)' }
  ];

  constructor(private toolService: ToolService) { }

  ngOnInit(): void {
    this.loadMyTools();
  }

  loadMyTools(): void {
    this.isLoading = true;

    let sortBy = 'createdAt';
    let sortDirection = 'desc';

    switch (this.selectedSort) {
      case 'created_desc':
        sortBy = 'createdAt';
        sortDirection = 'desc';
        break;
      case 'created_asc':
        sortBy = 'createdAt';
        sortDirection = 'asc';
        break;
      case 'name_asc':
        sortBy = 'name';
        sortDirection = 'asc';
        break;
      case 'name_desc':
        sortBy = 'name';
        sortDirection = 'desc';
        break;
      case 'price_asc':
        sortBy = 'pricePerDay';
        sortDirection = 'asc';
        break;
      case 'price_desc':
        sortBy = 'pricePerDay';
        sortDirection = 'desc';
        break;
    }

    this.toolService.getMyTools(this.currentPage, this.pageSize, sortBy, sortDirection)
      .subscribe({
        next: (response) => {
          this.tools = response.data.tools;
          this.currentPage = response.data.currentPage;
          this.totalItems = response.data.totalItems;
          this.totalPages = response.data.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Błąd podczas ładowania narzędzi:', error);
          this.errorMessage = 'Nie udało się załadować narzędzi. Spróbuj ponownie.';
          this.isLoading = false;
        }
      });
  }

  onSortChange(): void {
    this.currentPage = 0;
    this.loadMyTools();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadMyTools();
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
