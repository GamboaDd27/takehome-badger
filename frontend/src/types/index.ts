export interface CsvResult {
  id: number;
  stock_code: string;
  number_quotes_found: number;
  total_price: number;
  created_at: string;
  file_uploaded?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type StatusType = 'success' | 'error' | 'info' | '';

export interface UploadStatus {
  type: StatusType;
  message: string;
}