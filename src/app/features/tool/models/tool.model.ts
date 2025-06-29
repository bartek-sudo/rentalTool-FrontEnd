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
  mainImageUrl: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  moderationStatus?: string;
  moderationComment?: string;
}
