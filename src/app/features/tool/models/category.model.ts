export interface Category {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum CategoryName {
  GARDENING = 'GARDENING',
  CONSTRUCTION = 'CONSTRUCTION',
  ELECTRIC = 'ELECTRIC',
  PLUMBING = 'PLUMBING',
  AUTOMOTIVE = 'AUTOMOTIVE',
  PAINTING = 'PAINTING',
  CLEANING = 'CLEANING',
  WOODWORKING = 'WOODWORKING',
  METALWORKING = 'METALWORKING',
  OUTDOOR = 'OUTDOOR',
  OTHER = 'OTHER'
}
