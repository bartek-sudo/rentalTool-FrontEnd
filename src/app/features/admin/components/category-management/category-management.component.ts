import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, CategoryRequest } from '../../../tool/services/category.service';
import { Category } from '../../../tool/models/category.model';
import { TermsService } from '../../../reservation/services/terms.service';
import { TermsDto } from '../../../reservation/model/terms.model';

interface CategoryFormData {
  name: string;
  displayName: string;
  description: string;
}

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.css'
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private termsService = inject(TermsService);

  categories: Category[] = [];
  terms: TermsDto[] = [];
  loading = false;
  error: string | null = null;
  selectedCategory: Category | null = null;

  // Form state
  showForm = false;
  editingCategoryId: number | null = null;
  formData: CategoryFormData = {
    name: '',
    displayName: '',
    description: ''
  };
  formError: string | null = null;

  ngOnInit(): void {
    this.loadAllCategories();
    this.loadAllTerms();
  }

  loadAllTerms(): void {
    this.termsService.getAllTerms().subscribe({
      next: (response) => {
        if (response.data) {
          this.terms = response.data.terms;
        }
      },
      error: (err) => {
        console.error('Error loading terms:', err);
      }
    });
  }

  getTermsForCategory(categoryId: number): TermsDto | undefined {
    return this.terms.find(t => t.categoryId === categoryId);
  }

  loadAllCategories(): void {
    this.loading = true;
    this.error = null;

    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (response.data) {
          this.categories = response.data.categories;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Nie udało się załadować kategorii';
        console.error('Error loading categories:', err);
        this.loading = false;
      }
    });
  }

  viewCategoryDetails(category: Category): void {
    this.selectedCategory = category;
  }

  closeDetails(): void {
    this.selectedCategory = null;
  }

  openCreateForm(): void {
    this.editingCategoryId = null;
    this.formData = {
      name: '',
      displayName: '',
      description: ''
    };
    this.formError = null;
    this.showForm = true;
  }

  openEditForm(category: Category): void {
    this.editingCategoryId = category.id;
    this.formData = {
      name: category.name,
      displayName: category.displayName,
      description: category.description || ''
    };
    this.formError = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCategoryId = null;
    this.formError = null;
  }

  saveCategory(): void {
    // Validation
    if (!this.formData.displayName.trim()) {
      this.formError = 'Nazwa wyświetlana jest wymagana';
      return;
    }

    if (!this.editingCategoryId && !this.formData.name.trim()) {
      this.formError = 'Nazwa techniczna jest wymagana przy tworzeniu kategorii';
      return;
    }

    this.loading = true;
    this.formError = null;

    const request = this.editingCategoryId
      ? this.categoryService.updateCategory(this.editingCategoryId, {
          name: this.formData.name, // Backend wymaga tego pola, choć go nie użyje przy update
          displayName: this.formData.displayName,
          description: this.formData.description || undefined
        })
      : this.categoryService.createCategory({
          name: this.formData.name,
          displayName: this.formData.displayName,
          description: this.formData.description || undefined
        });

    request.subscribe({
      next: () => {
        this.loading = false;
        this.closeForm();
        this.loadAllCategories();
      },
      error: (err) => {
        this.loading = false;
        this.formError = err.error?.message || 'Nie udało się zapisać kategorii';
        console.error('Error saving category:', err);
      }
    });
  }

  deleteCategory(category: Category): void {
    // Zabezpieczenie przed usunięciem kategorii OTHER (używana jako domyślna)
    if (category.name === 'OTHER') {
      this.error = 'Nie można usunąć kategorii "Inne" - jest ona używana jako domyślna kategoria systemu.';
      return;
    }

    if (!confirm(`Czy na pewno chcesz usunąć kategorię "${category.displayName}"?\n\nUWAGA:\n- Wszystkie regulaminy przypisane do tej kategorii zostaną USUNIĘTE\n- Wszystkie narzędzia z tej kategorii zostaną PRZENIESIONE do kategorii "Inne"\n\nTa operacja jest nieodwracalna!`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.loading = false;
        this.loadAllCategories();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Nie udało się usunąć kategorii';
        console.error('Error deleting category:', err);
      }
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
