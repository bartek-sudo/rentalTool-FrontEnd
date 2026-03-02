import { User } from "../../../core/models/user.model";

export interface Tool {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  category: string;
  displayName: string;
  ownerId: number;
  owner?: User;
  address: string;
  latitude?: number;
  longitude?: number;
  termsId?: number | null;
  mainImageUrl: string;
  createdAt: string;
  isActive: boolean;
  moderationStatus?: string;
  moderationComment?: string;
  distance?: number | null;
}
