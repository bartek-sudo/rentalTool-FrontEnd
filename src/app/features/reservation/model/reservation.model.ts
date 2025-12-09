import { User } from "../../../core/models/user.model";
import { Tool } from "../../tool/models/tool.model";

export interface Reservation {
  id: number;
  toolId: number;
  renterId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: ReservationStatus;
  termsId?: number | null;
  tool?: Tool; // Szczegóły narzędzia, jeśli są dostępne
  renter?: User; // Szczegóły najemcy, jeśli są dostępne
  owner?: User; // Szczegóły najemcy, jeśli są dostępne
  createdAt?: string;
  updatedAt?: string;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REGULATIONS_ACCEPTED = 'REGULATIONS_ACCEPTED',
  CANCELED = 'CANCELED'
}

// Funkcja pomocnicza do normalizacji statusów - zamienia stare statusy na nowe
export function normalizeReservationStatus(status: string): ReservationStatus {
  // Mapowanie starych statusów na nowe
  if (status === 'PAID' || status === 'FINISHED') {
    return ReservationStatus.REGULATIONS_ACCEPTED;
  }
  // Sprawdź czy status jest w enumie
  if (Object.values(ReservationStatus).includes(status as ReservationStatus)) {
    return status as ReservationStatus;
  }
  // Domyślnie zwróć PENDING jeśli status jest nieznany
  return ReservationStatus.PENDING;
}
