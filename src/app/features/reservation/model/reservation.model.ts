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
  tool?: Tool; // Szczegóły narzędzia, jeśli są dostępne
  renter?: User; // Szczegóły najemcy, jeśli są dostępne
  owner?: User; // Szczegóły najemcy, jeśli są dostępne
  createdAt?: string;
  updatedAt?: string;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED'
}
