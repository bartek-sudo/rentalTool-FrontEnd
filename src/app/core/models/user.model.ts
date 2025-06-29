export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  verified: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  blockedAt: string;
  verifiedAt: string;
  userType?: string;
  role?: string;
}
