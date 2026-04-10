import axios from 'axios';

const BASE_URL = 'https://athena-backend-d45f.onrender.com';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      error.message = 'Groq rate limit aşıldı. 1 dakika bekleyip tekrar deneyin.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'İstek zaman aşımına uğradı. Backend uyanıyor olabilir, lütfen bekleyin.';
    }
    return Promise.reject(error);
  }
);

// Bütçe
export const olusturButce = (data) => client.post('/api/monitor/butce/olustur/', data);
export const pozisyonAlindi = (id, data = {}) => client.post(`/api/monitor/butce/pozisyon/${id}/alindi/`, data);
export const butceDurum = () => client.get('/api/monitor/butce/durum/');
export const pozisyonKapat = (id, data = {}) => client.post(`/api/monitor/butce/pozisyon/${id}/kapat/`, data);
export const yeniFirsat = (data) => client.post('/api/monitor/butce/yeni-firsat/', data);
export const butceGecmis = () => client.get('/api/monitor/butce/gecmis/');

// Market
export const getMarket = () => client.get('/api/monitor/market/');
export const getScanResults = (limit = 20, minScore = 0) =>
  client.get(`/api/monitor/scan/results/?limit=${limit}&min_score=${minScore}`);

// Advisor
export const getSignal = (sembol) => client.get(`/api/advisor/signal/${sembol}/`);
export const analyzePortfolio = () => client.get('/api/advisor/analyze/');
export const askAthena = (data) => client.post('/api/advisor/ask/', data);

// Diğer
export const getPlans = () => client.get('/api/monitor/plans/');
export const getAlerts = (params = {}) => client.get('/api/monitor/alerts/', { params });
export const getCommodities = () => client.get('/api/monitor/commodities/');
export const getPortfolio = () => client.get('/api/portfolio/');
export const addPortfolio = (data) => client.post('/api/portfolio/add/', data);
export const sellPortfolio = (data) => client.post('/api/portfolio/sell/', data);
export const getStockDetail = (sembol) => client.get(`/api/stocks/${sembol}/`);
export const getNews = (params = {}) => client.get('/api/news/', { params });

export default client;