import { Reservation } from './reservation.model';

export interface TermsDto {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  content: string;
}

export interface TermsRequest {
  categoryId: number;
  title: string;
  content: string;
}

export interface RegulationsAcceptRequest {
  termsAccepted: boolean;
}

export interface ContactInfo {
  renterEmail: string;
  renterName: string;
  renterPhoneNumber: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhoneNumber: string; 
}

export interface RegulationsAcceptResponse {
  reservation?: Reservation;
  contactInfo: ContactInfo;
}


