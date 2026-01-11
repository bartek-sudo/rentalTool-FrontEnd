import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { Observable } from 'rxjs';
import { HttpResponse } from '../../../core/models/http-response.model';
import { Category } from '../models/category.model';

export interface CategoryRequest {
  name: string;
  displayName: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/categories`;

  constructor() { }

  // Pobierz wszystkie kategorie
  getAllCategories(): Observable<HttpResponse<{ categories: Category[] }>> {
    return this.http.get<HttpResponse<{ categories: Category[] }>>(`${this.apiUrl}`);
  }

  // Pobierz szczegóły konkretnej kategorii
  getCategoryById(id: number): Observable<HttpResponse<{ category: Category }>> {
    return this.http.get<HttpResponse<{ category: Category }>>(`${this.apiUrl}/${id}`);
  }

  // ADMIN - Utwórz nową kategorię
  createCategory(categoryData: CategoryRequest): Observable<HttpResponse<{ category: Category }>> {
    return this.http.post<HttpResponse<{ category: Category }>>(`${this.apiUrl}`, categoryData);
  }

  // ADMIN - Aktualizuj kategorię
  updateCategory(id: number, categoryData: CategoryRequest): Observable<HttpResponse<{ category: Category }>> {
    return this.http.put<HttpResponse<{ category: Category }>>(`${this.apiUrl}/${id}`, categoryData);
  }

  // ADMIN - Usuń kategorię
  deleteCategory(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<HttpResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
