import { User } from "../../../core/models/user.model";
import { Category } from "./category.model";

export interface Tool {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  category: Category;
  ownerId: number;
  owner?: User;
  address: string;
  latitude?: number;
  longitude?: number;
  termsId?: number | null;
  mainImageUrl: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  moderationStatus?: string;
  moderationComment?: string;
  distance?: number | null; // Odległość w km od lokalizacji użytkownika
}
