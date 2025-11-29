import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Get API base URL based on environment
const getApiBaseUrl = (): string => {
  // In production, use the same host as the frontend
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, use relative path (Vite proxy will handle it)
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const channelsApi = {
  getAll: (params?: any) => api.get('/channels', { params }),
  getById: (id: string) => api.get(`/channels/${id}`),
  getInputs: (id: string) => api.get(`/channels/${id}/inputs`),
  getOutputs: (id: string) => api.get(`/channels/${id}/outputs`),
  create: (data: any) => api.post('/channels', data),
  update: (id: string, data: any) => api.put(`/channels/${id}`, data),
  delete: (id: string) => api.delete(`/channels/${id}`),
};

export const schedulesApi = {
  getAll: (params?: any) => api.get('/schedules', { params }),
  getById: (id: string) => api.get(`/schedules/${id}`),
  create: (data: any) => api.post('/schedules', data),
  update: (id: string, data: any) => api.put(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
};

export const scte35Api = {
  getAll: (params?: any) => api.get('/scte35', { params }),
  getById: (id: string) => api.get(`/scte35/${id}`),
  create: (data: any) => api.post('/scte35', data),
  update: (id: string, data: any) => api.put(`/scte35/${id}`, data),
  delete: (id: string) => api.delete(`/scte35/${id}`),
  createPrerollTemplate: (data: { name: string; duration?: number; programId?: number; spliceId?: number }) =>
    api.post('/scte35/templates/preroll', data),
};

export const streamsApi = {
  getAll: () => api.get('/streams'),
  getById: (streamName: string) => api.get(`/streams/${streamName}`),
  getOutputs: (streamName: string) => api.get(`/streams/${streamName}/outputs`),
  getStats: (streamName: string) => api.get(`/streams/${streamName}/stats`),
  getTracks: (streamName: string) => api.get(`/streams/${streamName}/tracks`),
  getHealth: (streamName: string) => api.get(`/streams/${streamName}/health`),
  getViewers: (streamName: string) => api.get(`/streams/${streamName}/viewers`),
  getDvr: (streamName: string) => api.get(`/streams/${streamName}/dvr`),
  getDvrConfig: (appName: string) => api.get(`/streams/dvr/config/${appName}`),
  createSignedPolicy: (streamName: string, expiresIn?: number) =>
    api.post(`/streams/${streamName}/signed-policy`, { expiresIn }),
  start: (channelId: string) => api.post(`/streams/${channelId}/start`),
  stop: (channelId: string) => api.post(`/streams/${channelId}/stop`),
  insertScte35: (channelId: string, markerId: string) =>
    api.post(`/streams/${channelId}/scte35`, { markerId }),
};

export const securityApi = {
  getAdmissionWebhooks: (vhostName?: string) =>
    api.get('/streams/security/admission-webhooks', { params: { vhostName } }),
};

export const omeApi = {
  getStats: () => api.get('/ome/stats'),
  getVirtualHosts: () => api.get('/ome/vhosts'),
  getVirtualHost: (vhostName: string) => api.get(`/ome/vhosts/${vhostName}`),
  getApplications: (vhostName: string) => api.get(`/ome/vhosts/${vhostName}/apps`),
  getApplication: (vhostName: string, appName: string) => 
    api.get(`/ome/vhosts/${vhostName}/apps/${appName}`),
  getOutputProfiles: (vhostName: string, appName: string) =>
    api.get(`/ome/vhosts/${vhostName}/apps/${appName}/outputProfiles`),
  getThumbnail: (streamName: string) => api.get(`/ome/streams/${streamName}/thumbnail`),
  getEvents: (params?: { vhostName?: string; limit?: number; offset?: number }) =>
    api.get('/ome/events', { params }),
  getEventWebhooks: (vhostName?: string) =>
    api.get('/ome/events/webhooks', { params: { vhostName } }),
};

export const tasksApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  updateProgress: (id: string, data: any) =>
    api.patch(`/tasks/${id}/progress`, data),
  cancel: (id: string) => api.post(`/tasks/${id}/cancel`),
};

export const chatApi = {
  getAll: (params?: any) => api.get('/chat', { params }),
  getById: (id: string) => api.get(`/chat/${id}`),
  create: (data: any) => api.post('/chat', data),
  updateResponse: (id: string, data: any) =>
    api.patch(`/chat/${id}/response`, data),
};

export const metricsApi = {
  getStreamMetrics: (channelId: string, params?: any) =>
    api.get(`/metrics/streams/${channelId}`, { params }),
  getDashboard: () => api.get('/metrics/dashboard'),
};

export const recordingsApi = {
  start: (streamName: string, data: { filePath: string; infoPath?: string }) =>
    api.post(`/recordings/${streamName}/start`, data),
  stop: (streamName: string) => api.post(`/recordings/${streamName}/stop`),
  getStatus: (streamName: string) => api.get(`/recordings/${streamName}/status`),
};

export const pushPublishingApi = {
  start: (streamName: string, data: { protocol: string; url: string; streamKey?: string }) =>
    api.post(`/push-publishing/${streamName}/start`, data),
  stop: (streamName: string, id: string) => api.post(`/push-publishing/${streamName}/stop/${id}`),
  getStatus: (streamName: string) => api.get(`/push-publishing/${streamName}/status`),
};

export const scheduledChannelsApi = {
  getAll: () => api.get('/scheduled-channels'),
  getById: (channelName: string) => api.get(`/scheduled-channels/${channelName}`),
  create: (data: { name: string; schedule: any[] }) => api.post('/scheduled-channels', data),
  update: (channelName: string, data: { schedule: any[] }) =>
    api.put(`/scheduled-channels/${channelName}`, data),
  delete: (channelName: string) => api.delete(`/scheduled-channels/${channelName}`),
};

export const omeApi = {
  getStats: () => api.get('/ome/stats'),
  getVirtualHosts: () => api.get('/ome/vhosts'),
  getVirtualHost: (vhostName: string) => api.get(`/ome/vhosts/${vhostName}`),
  getApplications: (vhostName: string) => api.get(`/ome/vhosts/${vhostName}/apps`),
  getApplication: (vhostName: string, appName: string) =>
    api.get(`/ome/vhosts/${vhostName}/apps/${appName}`),
  getOutputProfiles: (vhostName: string, appName: string) =>
    api.get(`/ome/vhosts/${vhostName}/apps/${appName}/outputProfiles`),
  getThumbnail: (streamName: string) => api.get(`/ome/streams/${streamName}/thumbnail`),
};

export const distributorsApi = {
  getByChannel: (channelId: string) => api.get(`/distributors/channel/${channelId}`),
  getById: (id: string) => api.get(`/distributors/${id}`),
  create: (data: any) => api.post('/distributors', data),
  update: (id: string, data: any) => api.put(`/distributors/${id}`, data),
  delete: (id: string) => api.delete(`/distributors/${id}`),
  insertPreroll: (id: string) => api.post(`/distributors/${id}/insert-preroll`),
};


