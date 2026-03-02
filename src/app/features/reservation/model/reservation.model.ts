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
  tool?: Tool;
  renter?: User;
  owner?: User;
  createdAt?: string;
  updatedAt?: string;
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REGULATIONS_ACCEPTED = 'REGULATIONS_ACCEPTED',
  CANCELED = 'CANCELED'
}

export function normalizeReservationStatus(status: string): ReservationStatus {
  if (status === 'PAID' || status === 'FINISHED') {
    return ReservationStatus.REGULATIONS_ACCEPTED;
  }
  if (Object.values(ReservationStatus).includes(status as ReservationStatus)) {
    return status as ReservationStatus;
  }
  return ReservationStatus.PENDING;
}
