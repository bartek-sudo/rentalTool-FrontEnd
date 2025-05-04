import { Tool } from "./tool.model";

export interface ToolApiResponse {
  data: {
    tools: Tool[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  }
}
