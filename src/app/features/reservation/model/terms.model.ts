import { Reservation } from './reservation.model';

export interface TermsDto {
  id: number;
  category: string | null; // null = regulamin ogólny
  title: string;
  content: string;
}

export interface RegulationsAcceptRequest {
  termsAccepted: boolean;
}

export interface ContactInfo {
  renterEmail: string;
  renterName: string;
  renterPhoneNumber: string; // "Nie podano" jeśli null
  ownerEmail: string;
  ownerName: string;
  ownerPhoneNumber: string; // "Nie podano" jeśli null
}

export interface RegulationsAcceptResponse {
  reservation?: Reservation;
  contactInfo: ContactInfo;
}


