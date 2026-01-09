import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TermsService } from '../../../reservation/services/terms.service';
import { TermsDto } from '../../../reservation/model/terms.model';

interface TermFormData {
  title: string;
  category: string | null;
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
    category: null,
    content: ''
  };
  formError: string | null = null;
  isGeneralTerm = false;

  ngOnInit(): void {
    this.loadAllTerms();
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

  getCategoryDisplay(category: string | null): string {
    if (!category) {
      return 'Regulamin ogólny';
    }
    return `Kategoria: ${category}`;
  }

  openCreateForm(): void {
    this.editingTermId = null;
    this.formData = {
      title: '',
      category: null,
      content: ''
    };
    this.isGeneralTerm = false;
    this.formError = null;
    this.showForm = true;
  }

  openEditForm(term: TermsDto): void {
    this.editingTermId = term.id;
    this.formData = {
      title: term.title,
      category: term.category,
      content: term.content
    };
    this.isGeneralTerm = !term.category;
    this.formError = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingTermId = null;
    this.formError = null;
  }

  toggleGeneralTerm(): void {
    if (this.isGeneralTerm) {
      this.formData.category = null;
    } else if (this.formData.category === null) {
      this.formData.category = '';
    }
  }

  saveTerm(): void {
    // Validation
    if (!this.formData.title.trim()) {
      this.formError = 'Tytuł jest wymagany';
      return;
    }

    if (!this.isGeneralTerm && !this.formData.category?.trim()) {
      this.formError = 'Kategoria jest wymagana dla regulaminu kategorii';
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
      category: this.isGeneralTerm ? null : this.formData.category,
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
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Nie udało się usunąć regulaminu';
        console.error('Error deleting term:', err);
      }
    });
  }
}
