import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // Dodaj CurrencyPipe
import { RouterLink } from '@angular/router'; // Dodaj RouterLink
import { FormsModule } from '@angular/forms'; // Dodaj FormsModule dla ngModel
import { ActivatedRoute, Router } from '@angular/router';
import { ToolService } from '../../services/tool.service';
import { Subject, takeUntil } from 'rxjs';
import { Tool } from '../../models/tool.model';

@Component({
  selector: 'app-tools-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule 
  ],
  templateUrl: './tools-list.component.html',
  styles: []
})
export class ToolsListComponent implements OnInit, OnDestroy {
  tools: Tool[] = [];
  isLoading = false;
  searchTerm = '';
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  selectedSort = 'newest';
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private toolService: ToolService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Subskrypcja na zmiany parametrów zapytania
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.searchTerm = params['search'] || '';
      this.currentPage = parseInt(params['page']) || 0;
      this.loadTools();
    });

    // Subskrypcja na zmiany wyszukiwania
    this.toolService.searchTerm$.pipe(takeUntil(this.destroy$)).subscribe(term => {
      if (term !== this.searchTerm) {
        this.searchTerm = term;
        this.currentPage = 0;
        this.loadTools();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTools() {
    this.isLoading = true;
    const [sortBy, sortDirection] = this.getSortParams();

    this.toolService.searchTools(
      this.searchTerm,
      this.currentPage,
      this.pageSize,
      sortBy,
      sortDirection
    ).subscribe({
      next: (response) => {
        this.tools = response.data.tools;
        this.totalPages = response.data.totalPages;
        this.totalItems = response.data.totalItems;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tools:', error);
        this.isLoading = false;
      }
    });
  }

  updateSort() {
    this.currentPage = 0;
    this.loadTools();
  }

  getSortParams(): [string, string] {
    switch (this.selectedSort) {
      case 'oldest':
        return ['id', 'asc'];
      case 'name_asc':
        return ['name', 'asc'];
      case 'name_desc':
        return ['name', 'desc'];
      case 'newest':
      default:
        return ['id', 'desc'];
    }
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: page, search: this.searchTerm || null },
        queryParamsHandling: 'merge'
      });
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
}
