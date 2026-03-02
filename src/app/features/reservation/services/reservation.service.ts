import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { Observable } from 'rxjs';
import { RegulationsAcceptRequest } from '../model/terms.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/reservations`;

  constructor() { }

  createReservation(reservationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, reservationData);
  }

  getMyRentals(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-rentals`);
  }

    // Pobierz rezerwacje moich narzędzi (jako właściciel)
  getMyToolsReservations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-tools-reservations`);
  }

  // Potwierdź rezerwację (jako właściciel)
  confirmReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/confirm`, {});
  }

  // Zaakceptuj regulamin rezerwacji (jako najemca)
  acceptRegulations(id: number, request: RegulationsAcceptRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/accept-regulations`, request);
  }

  // Anuluj rezerwację (jako najemca)
  cancelReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getAllReservations(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all?page=${page}&size=${size}`);
  }

  // Metody dla moderacji
  getReservationsForModeration(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/moderation?page=${page}&size=${size}`);
  }

  updateReservationModeration(id: number, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/moderation`, updateData);
  }
}
