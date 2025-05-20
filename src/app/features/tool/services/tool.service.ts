import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Tool } from '../models/tool.model';
import { DailyAvailability } from '../models/daily-availability.model';
import { ToolApiResponse } from '../models/tool-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/tools`;

  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  constructor() { }

  getToolById(toolId: number): Observable<Tool> {
    return this.http.get<{ data: { Tool: Tool } }>(`${this.apiUrl}/${toolId}`).pipe(
      map(response => response.data.Tool) // Wyciągamy obiekt Tool z odpowiedzi
    );
  }

  createTool(toolData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, toolData);
  }

  getToolImages(toolId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${toolId}/images`);
  }

  getToolAvailability(toolId: number, startDate: string, endDate: string): Observable<DailyAvailability[]> {
    return this.http.get<DailyAvailability[]>(
      `${this.apiUrl}/${toolId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
  }

  searchTools(
    searchTerm: string,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    sortDirection: string = 'asc'
  ): Observable<ToolApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.http.get<ToolApiResponse>(`${this.apiUrl}/search`, { params });
  }

  // Opcjonalnie: metoda aktualizacji terminu wyszukiwania
  setSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }

  getMyTools(page: number = 0, size: number = 10, sortBy: string = 'id', sortDirection: string = 'desc'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-tools`, {
      params: {
        page: page.toString(),
        size: size.toString(),
        sortBy: sortBy,
        sortDirection: sortDirection
      }
    });
  }


}
