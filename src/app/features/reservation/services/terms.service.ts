import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { Observable } from 'rxjs';
import { HttpResponse } from '../../../core/models/http-response.model';
import { TermsDto } from '../model/terms.model';

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
}




