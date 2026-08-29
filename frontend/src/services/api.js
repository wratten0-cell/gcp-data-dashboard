import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// GCP & Status APIs
export const getGcpStatus = async () => {
  const response = await apiClient.get('/api/gcp/status');
  return response.data;
};

export const updateGcpConfig = async (config) => {
  const response = await apiClient.post('/api/gcp/config', config);
  return response.data;
};

// Data & Query APIs
export const getDashboardSummary = async () => {
  const response = await apiClient.get('/api/data/summary');
  return response.data;
};

export const executeSqlQuery = async (sql, limit = 100) => {
  const response = await apiClient.post('/api/data/query', { sql, limit });
  return response.data;
};

export const getDatasetTables = async () => {
  const response = await apiClient.get('/api/data/tables');
  return response.data;
};

// AI/ML Model Execution APIs
export const listMLModels = async () => {
  const response = await apiClient.get('/api/models/list');
  return response.data;
};

export const runMLModel = async (modelId, parameters = {}) => {
  const response = await apiClient.post('/api/models/run', {
    model_id: modelId,
    parameters,
  });
  return response.data;
};

// Dynamic Dashboard APIs
export const listDashboards = async () => {
  const response = await apiClient.get('/api/dashboards');
  return response.data;
};

export const getDashboard = async (id) => {
  const response = await apiClient.get(`/api/dashboards/${id}`);
  return response.data;
};

export const generateDashboardFromText = async (prompt) => {
  const response = await apiClient.post('/api/dashboards/generate', { prompt });
  return response.data;
};

export const deleteDashboard = async (id) => {
  const response = await apiClient.delete(`/api/dashboards/${id}`);
  return response.data;
};
