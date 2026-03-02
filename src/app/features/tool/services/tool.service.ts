import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Tool } from '../models/tool.model';
import { DailyAvailability } from '../models/daily-availability.model';
import { ToolApiResponse } from '../models/tool-api-response.model';
import { ToolUpdateRequest } from '../models/tool-update-request.model';
import { ToolCreateRequest } from '../models/tool-create-request.model';

export interface ApiResponse<T> {
  timeStamp: string;
  statusCode: number;
  httpStatus: string;
  reason: string;
  message: string;
  data: T;
}

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
      map(response => response.data.Tool)
    );
  }

  createTool(toolData: ToolCreateRequest): Observable<ApiResponse<{ Tool: Tool }>> {
    return this.http.post<ApiResponse<{ Tool: Tool }>>(`${this.apiUrl}`, toolData);
  }

  updateTool(toolId: number, toolData: ToolUpdateRequest): Observable<ApiResponse<{ Tool: Tool }>> {
    return this.http.put<ApiResponse<{ Tool: Tool }>>(`${this.apiUrl}/${toolId}`, toolData);
  }

  updateToolTerms(toolId: number, termsId: number | null): Observable<ApiResponse<{ Tool: Tool }>> {
    return this.http.put<ApiResponse<{ Tool: Tool }>>(`${this.apiUrl}/${toolId}/terms`, { termsId });
  }

  setToolStatus(toolId: number, active: boolean): Observable<ApiResponse<{ Tool: Tool }>> {
    return this.http.patch<ApiResponse<{ Tool: Tool }>>(
      `${this.apiUrl}/${toolId}/status`,
      {},
      { params: { active: active.toString() } }
    );
  }

  getToolImages(toolId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${toolId}/images`);
  }

  uploadToolImage(toolId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${toolId}/images`, formData);
  }

  deleteToolImage(toolId: number, imageId: number): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/${toolId}/images/${imageId}`);
}

setMainImage(toolId: number, imageId: number): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/${toolId}/images/${imageId}/main`, {});
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
    sortDirection: string = 'asc',
    category?: string,
    latitude?: number,
    longitude?: number,
    radius?: number | null
  ): Observable<ToolApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    if (category) {
      params = params.set('category', category);
    }

    if (latitude !== undefined && longitude !== undefined) {
      params = params.set('latitude', latitude.toString());
      params = params.set('longitude', longitude.toString());

      if (radius !== undefined && radius !== null) {
        params = params.set('radius', radius.toString());
      }
    }

    return this.http.get<ToolApiResponse>(`${this.apiUrl}/search`, { params });
  }

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

  updateModerationStatus(toolId: number, status: string, comment: string): Observable<any> {
    const action = status === 'APPROVED' ? 'approve' : 'reject';
    const url = `${environment.apiUrl}/api/v1/moderation/${toolId}/${action}`;
    const body = { comment: comment };
    return this.http.post<any>(url, body);
  }

  getToolsForModeration(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/moderation?page=${page}&size=${size}`);
  }

  updateToolModeration(toolId: number, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${toolId}/moderation`, updateData);
  }
}
