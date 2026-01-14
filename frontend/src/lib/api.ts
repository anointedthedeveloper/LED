import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Bot management
  createBot: (data: any) => apiClient.post('/api/bots', data),
  getBots: () => apiClient.get('/api/bots'),
  getBot: (botId: string) => apiClient.get(`/api/bots/${botId}`),
  startBot: (botId: string) => apiClient.post(`/api/bots/${botId}/start`),
  stopBot: (botId: string) => apiClient.post(`/api/bots/${botId}/stop`),
  redeployBot: (botId: string) => apiClient.post(`/api/bots/${botId}/redeploy`),
  pairBot: (botId: string, phoneNumber: string) => 
    apiClient.post(`/api/bots/${botId}/pair`, { phoneNumber }),
  getQRCode: (botId: string) => apiClient.get(`/api/bots/${botId}/qr`),
  updateBotConfig: (botId: string, config: any) => 
    apiClient.put(`/api/bots/${botId}/config`, config),
  getBotLogs: (botId: string) => apiClient.get(`/api/bots/${botId}/logs`),
  
  // Commands
  getCommands: () => apiClient.get('/api/commands'),
};

export default apiClient;
