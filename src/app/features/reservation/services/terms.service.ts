import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { Observable } from 'rxjs';
import { HttpResponse } from '../../../core/models/http-response.model';
import { TermsDto, TermsRequest } from '../model/terms.model';
import { Category } from '../../tool/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class TermsService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/terms`;

  constructor() { }

  // Pobierz wszystkie regulaminy
  getAllTerms(): Observable<HttpResponse<{ terms: TermsDto[] }>> {
    return this.http.get<HttpResponse<{ terms: TermsDto[] }>>(`${this.apiUrl}`);
  }

  // Pobierz szczegóły konkretnego regulaminu
  getTermsById(id: number): Observable<HttpResponse<{ terms: TermsDto }>> {
    return this.http.get<HttpResponse<{ terms: TermsDto }>>(`${this.apiUrl}/${id}`);
  }

  // Pobierz regulaminy dla konkretnej kategorii narzędzia
  getTermsByCategory(category: string): Observable<HttpResponse<{ terms: TermsDto[] }>> {
    return this.http.get<HttpResponse<{ terms: TermsDto[] }>>(`${this.apiUrl}/category/${category}`);
  }

  // ADMIN - Utwórz nowy regulamin
  createTerm(termData: TermsRequest): Observable<HttpResponse<{ terms: TermsDto }>> {
    return this.http.post<HttpResponse<{ terms: TermsDto }>>(`${this.apiUrl}`, termData);
  }

  // ADMIN - Aktualizuj regulamin
  updateTerm(id: number, termData: TermsRequest): Observable<HttpResponse<{ terms: TermsDto }>> {
    return this.http.put<HttpResponse<{ terms: TermsDto }>>(`${this.apiUrl}/${id}`, termData);
  }

  // ADMIN - Usuń regulamin
  deleteTerm(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<HttpResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Pobierz wszystkie unikalne kategorie
  getAllCategories(): Observable<HttpResponse<{ categories: Category[] }>> {
    return this.http.get<HttpResponse<{ categories: Category[] }>>(`${this.apiUrl}/categories`);
  }
}




