import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpResponse } from '../../../core/models/http-response.model';
import { User } from '../../../core/models/user.model';

export interface UserListResponse {
  users: User[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface UpdateUserRequest {
  blocked?: boolean;
  userType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/user`;

  constructor() { }

  getUserById(id: number): Observable<HttpResponse<{ user: User }>> {
    return this.http.get<HttpResponse<{ user: User }>>(`${this.apiUrl}/${id}`);
  }

  getAllUsers(page: number = 0, size: number = 10, search?: string): Observable<HttpResponse<UserListResponse>> {
    let url = `${this.apiUrl}/admin?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<HttpResponse<UserListResponse>>(url);
  }

  updateUser(id: number, updateData: UpdateUserRequest): Observable<HttpResponse<{ user: User }>> {
    return this.http.patch<HttpResponse<{ user: User }>>(`${this.apiUrl}/admin/${id}`, updateData);
  }

  blockUser(id: number): Observable<HttpResponse<{ user: User }>> {
    return this.http.patch<HttpResponse<{ user: User }>>(`${this.apiUrl}/admin/${id}/block`, {});
  }

  unblockUser(id: number): Observable<HttpResponse<{ user: User }>> {
    return this.http.patch<HttpResponse<{ user: User }>>(`${this.apiUrl}/admin/${id}/unblock`, {});
  }

  changeUserRole(id: number, role: string): Observable<HttpResponse<{ user: User }>> {
    return this.http.patch<HttpResponse<{ user: User }>>(`${this.apiUrl}/admin/${id}/role`, { role });
  }

  updateOwnUser(updateData: Partial<User>): Observable<HttpResponse<{ user: User }>> {
    return this.http.put<HttpResponse<{ user: User }>>(`${this.apiUrl}/me`, updateData);
  }
}
