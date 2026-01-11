import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TermsService } from '../../../reservation/services/terms.service';
import { TermsDto } from '../../../reservation/model/terms.model';
import { Category } from '../../../tool/models/category.model';

interface TermFormData {
  title: string;
  categoryId: number | null; // null tylko przed wyborem
  content: string;
}

@Component({
  selector: 'app-terms-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terms-management.component.html',
  styleUrl: './terms-management.component.css'
})
export class TermsManagementComponent implements OnInit {
  private termsService = inject(TermsService);

  terms: TermsDto[] = [];
  loading = false;
  error: string | null = null;
  selectedTerm: TermsDto | null = null;

  // Form state
  showForm = false;
  editingTermId: number | null = null;
  formData: TermFormData = {
    title: '',
    categoryId: null,
    content: ''
  };
  formError: string | null = null;

  // Dostępne kategorie
  availableCategories: Category[] = [];
  categoriesWithoutTerms: Category[] = [];

  ngOnInit(): void {
    this.loadAllTerms();
    this.loadCategoriesWithoutTerms();
  }

  loadCategoriesWithoutTerms(): void {
    this.termsService.getAllCategories().subscribe({
      next: (response) => {
        if (response.data) {
          this.categoriesWithoutTerms = response.data.categories;
        }
      },
      error: (err) => {
        console.error('Error loading categories without terms:', err);
      }
    });
  }

  updateAvailableCategories(editingTermCategoryId: number | null = null): void {
    // Backend zwraca kategorie bez regulaminu + zawsze kategorię OTHER
    // Dla edycji dodajemy także obecną kategorię edytowanego regulaminu (jeśli nie jest już na liście)
    if (editingTermCategoryId) {
      // Znajdź aktualną kategorię w wszystkich terms
      const currentTerm = this.terms.find(t => t.id === this.editingTermId);
      if (currentTerm) {
        const currentCategory: Category = {
          id: currentTerm.categoryId,
          name: currentTerm.categoryName,
          displayName: currentTerm.categoryName // będzie nadpisane przy ładowaniu z backendu
        };
        // Dodaj obecną kategorię, jeśli nie ma jej już w liście
        const hasCurrent = this.categoriesWithoutTerms.some(c => c.id === currentTerm.categoryId);
        if (!hasCurrent && currentTerm.categoryName !== 'OTHER') {
          // Dodaj obecną kategorię tylko jeśli to nie jest OTHER (OTHER jest już zawsze na liście)
          this.availableCategories = [...this.categoriesWithoutTerms, currentCategory];
        } else {
          this.availableCategories = [...this.categoriesWithoutTerms];
        }
      }
    } else {
      this.availableCategories = [...this.categoriesWithoutTerms];
    }
  }

  loadAllTerms(): void {
    this.loading = true;
    this.error = null;

    this.termsService.getAllTerms().subscribe({
      next: (response) => {
        if (response.data) {
          this.terms = response.data.terms;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Nie udało się załadować regulaminów';
        console.error('Error loading terms:', err);
        this.loading = false;
      }
    });
  }

  viewTermDetails(term: TermsDto): void {
    this.selectedTerm = term;
  }

  closeDetails(): void {
    this.selectedTerm = null;
  }

  getCategoryDisplay(categoryName: string | null): string {
    if (!categoryName || categoryName === 'OTHER') {
      return 'Regulamin ogólny';
    }
    // Znajdź kategorię po nazwie i zwróć displayName
    const category = this.availableCategories.find(c => c.name === categoryName);
    return category ? `Kategoria: ${category.displayName}` : `Kategoria: ${categoryName}`;
  }

  openCreateForm(): void {
    this.editingTermId = null;
    this.formData = {
      title: '',
      categoryId: null,
      content: ''
    };
    this.formError = null;
    this.updateAvailableCategories(); // Tylko kategorie bez regulaminu
    this.showForm = true;
  }

  openEditForm(term: TermsDto): void {
    this.editingTermId = term.id;
    this.formData = {
      title: term.title,
      categoryId: term.categoryId,
      content: term.content
    };
    this.formError = null;
    this.updateAvailableCategories(term.categoryId); // Kategorie bez regulaminu + obecna
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTermId = null;
    this.formError = null;
  }

  saveTerm(): void {
    // Validation
    if (!this.formData.title.trim()) {
      this.formError = 'Tytuł jest wymagany';
      return;
    }

    if (!this.formData.categoryId) {
      this.formError = 'Kategoria jest wymagana';
      return;
    }

    if (!this.formData.content.trim()) {
      this.formError = 'Treść jest wymagana';
      return;
    }

    this.loading = true;
    this.formError = null;

    const termData = {
      title: this.formData.title,
      categoryId: this.formData.categoryId!,
      content: this.formData.content
    };

    const request = this.editingTermId
      ? this.termsService.updateTerm(this.editingTermId, termData)
      : this.termsService.createTerm(termData);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.closeForm();
        this.loadAllTerms();
        this.loadCategoriesWithoutTerms(); // Odśwież listę kategorii bez regulaminu
      },
      error: (err) => {
        this.loading = false;
        this.formError = err.error?.message || 'Nie udało się zapisać regulaminu';
        console.error('Error saving term:', err);
      }
    });
  }

  deleteTerm(term: TermsDto): void {
    if (!confirm(`Czy na pewno chcesz usunąć regulamin "${term.title}"?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.termsService.deleteTerm(term.id).subscribe({
      next: () => {
        this.loading = false;
        this.loadAllTerms();
        this.loadCategoriesWithoutTerms(); // Odśwież listę kategorii bez regulaminu
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Nie udało się usunąć regulaminu';
        console.error('Error deleting term:', err);
      }
    });
  }
}
