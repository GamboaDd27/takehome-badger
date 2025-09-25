export interface CsvResult {
  id: number;
  stock_code: string;
  number_quotes_found: number;
  total_price: number;
  created_at: string;
  file_uploaded?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total?: number;
}

export type StatusType = 'success' | 'error' | 'info' | '';

export interface UploadStatus {
  type: StatusType;
  message: string;
}