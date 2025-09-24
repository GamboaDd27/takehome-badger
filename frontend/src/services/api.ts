import axios from 'axios';
import { CsvResult, PaginatedResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/upload-csv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getResults = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<CsvResult>> => {
  const response = await api.get('/results/', { params });
  return response.data;
};

export default api;