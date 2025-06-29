import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/reservations`;

  constructor() { }

  createReservation(reservationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, reservationData);
  }

  getMyRentals(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-rentals`);
  }

    // Pobierz rezerwacje moich narzędzi (jako właściciel)
  getMyToolsReservations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my-tools-reservations`);
  }

  // Pobierz szczegóły rezerwacji po ID
  // getReservationById(id: number): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}/${id}`);
  // }

  // Potwierdź rezerwację (jako właściciel)
  confirmReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/confirm`, {});
  }

  // Oznacz rezerwację jako opłaconą (jako najemca)
  payReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/pay`, {});
  }

  // Zakończ rezerwację (jako najemca)
  finishReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/finish`, {});
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
