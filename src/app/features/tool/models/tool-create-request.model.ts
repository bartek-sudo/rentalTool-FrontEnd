export interface ToolCreateRequest {
  name: string;
  description: string;
  pricePerDay: number;
  category: string;
  address: string;
  latitude?: number;
  longitude?: number;
  termsId?: number | null;
}
