import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/user`;

  constructor() { }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
