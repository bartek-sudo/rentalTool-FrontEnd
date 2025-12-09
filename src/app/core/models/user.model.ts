export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string; // Wymagane pole
  verified: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  blockedAt: string;
  verifiedAt: string;
  userType?: string;
  role?: string;
}
