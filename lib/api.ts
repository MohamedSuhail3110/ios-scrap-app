import axios, { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL: prefer Expo env, fallback to deployed server
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://scv2.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Avoid CORS/session issues on mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

async function getToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch {
    return null;
  }
}

// Attach Authorization token + debug logs
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getToken();
      if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      if (config.method && config.url) {
        console.log('API Request:', config.method.toUpperCase(), config.url);
      }
      return config;
    } catch (error) {
      console.error('API Request Interceptor Error:', error);
      return config;
    }
  },
  (error: any) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config?.url);
    return response;
  },
  (error: any) => {
    console.error('API Response Error:', error?.response?.status, error?.response?.data, error?.config?.url);
    return Promise.reject(error);
  }
);

// -----------------------
// Auth
// -----------------------
export const signup = async (payload: { fullName: string; email: string; password: string; phone?: string; city?: string; governorate?: string }) => {
  const { data } = await api.post('/api/auth/signup', payload);
  return data;
};

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await api.post('/api/auth/login', payload);
  return data;
};



// -----------------------
// Parts (Public + Seller)
// -----------------------
export const fetchApprovedParts = async (params: Record<string, any> = {}) => {
  try {
    const { data } = await api.get('/api/parts', { params });
    return data; // { success, data, pagination }
  } catch (err: any) {
    console.log('❌ /api/parts endpoint not available, falling back to /api/sell/all');
    const { data } = await api.get('/api/sell/all');
    const sells = data?.sells || [];
    let filtered = sells;
    if (params.limit) filtered = filtered.slice(0, Number(params.limit));
    return {
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: params.limit || filtered.length,
        total: filtered.length,
        pages: 1,
      },
    };
  }
};

export const fetchFeaturedParts = async (limit = 8) => {
  try {
    const { data } = await api.get('/api/parts/featured', { params: { limit } });
    return data; // { success, data }
  } catch (err) {
    console.log('❌ /api/parts/featured endpoint not available, falling back to /api/sell/all');
    const { data } = await api.get('/api/sell/all');
    return { success: true, data: (data?.sells || []).slice(0, limit) };
  }
};

export const fetchPartById = async (partId: string) => {
  const { data } = await api.get(`/api/parts/${partId}`);
  return data; // { success, data, relatedParts? }
};

export const fetchMyAds = async (params: Record<string, any> = {}) => {
  const { data } = await api.get('/api/parts/user/my-parts', { params });
  return data; // { success, data, pagination }
};

// Strict parts-only fetch that tries multiple parts endpoints (no sell in primary path)
export const fetchAllPartsStrict = async (params: Record<string, any> = {}) => {
  const endpoints: Array<{ url: string; allowParams?: boolean }> = [
    { url: '/api/admin/parts', allowParams: true },
    { url: '/api/parts/admin/parts', allowParams: true },
    { url: '/api/parts', allowParams: true },
    { url: '/api/parts/all', allowParams: true }, // may not exist; kept for compatibility
  ];
  for (const ep of endpoints) {
    try {
      const { data } = await api.get(ep.url, ep.allowParams ? { params } : undefined);
      return data;
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.warn(`Parts endpoint ${ep.url} failed with status ${err?.response?.status}`);
      }
    }
  }
  throw new Error('All parts endpoints unavailable');
};

// General parts data fetch with graceful fallbacks
export const fetchAllPartsData = async (params: Record<string, any> = {}) => {
  try {
    console.log('Fetching all parts data...');
    const endpoints = ['/api/parts/all', '/api/parts', '/api/sell/parts', '/api/admin/parts'];
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const { data } = await api.get(endpoint, { params });
        console.log(`Success with ${endpoint}:`, data);
        return data;
      } catch (error: any) {
        console.log(`Failed with ${endpoint}:`, error?.response?.status);
        continue;
      }
    }
    console.log('Trying fallback to user parts...');
    const { data } = await api.get('/api/parts/user/my-parts', { params });
    return data;
  } catch (error) {
    console.error('All parts endpoints failed:', error);
    throw error;
  }
};

// -----------------------
// Legacy Sell compatibility
// -----------------------
export const createSellItem = async (formData: FormData) => {
  const { data } = await api.post('/api/sell', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updatePartById = async (partId: string, payload: any) => {
  const { data } = await api.put(`/api/sell/${partId}`, payload);
  return data;
};

export const fetchAllSell = async () => {
  try {
    console.log('Fetching all sell items...');
    const { data } = await api.get('/api/sell/all');
    console.log('Sell items response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching sell items:', error);
    throw error;
  }
};

export const fetchUserSellItems = async (userId: string) => {
  try {
    console.log('Fetching sell items for user:', userId);
    const { data } = await api.get(`/api/sell/user/${userId}`);
    console.log('User sell items response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user sell items:', error);
    throw error;
  }
};

// -----------------------
// Additions
// -----------------------
export const createAddition = async (formData: FormData) => {
  const { data } = await api.post('/api/addition', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const fetchUserAdditions = async (userId: string) => {
  const { data } = await api.get(`/api/addition/user/${userId}`);
  return data;
};

export const fetchAllAdditions = async () => {
  const { data } = await api.get('/api/addition/all');
  return data;
};

// -----------------------
// Chat
// -----------------------
export const fetchChatMessages = async (sellId: string) => {
  const { data } = await api.get(`/api/chat/${sellId}`);
  return data;
};

export const sendChatMessage = async (payload: {
  sellId: string;
  userId: string;
  sellerId: string;
  message: string;
  sender: 'user' | 'seller';
}) => {
  const { data } = await api.post('/api/chat', payload);
  return data;
};

export const getUnreadCountForSeller = async (sellerId: string) => {
  const { data } = await api.get(`/api/chat/unread/${sellerId}`);
  return data as { unread: number };
};

export const markChatRead = async (sellId: string, sellerId: string) => {
  const { data } = await api.patch('/api/chat/mark-read', { sellId, sellerId });
  return data;
};

// -----------------------
// Admin
// -----------------------
export const fetchAllUsers = async (params: { page?: number; limit?: number } = {}) => {
  const { data } = await api.get('/api/admin/users', { params });
  return data;
};

export const updateUserById = async (userId: string, payload: { name?: string; phone?: string; city?: string }) => {
  const { data } = await api.put(`/api/admin/users/${userId}`, payload);
  return data;
};

export const deleteUserById = async (userId: string) => {
  const { data } = await api.delete(`/api/admin/users/${userId}`);
  return data;
};

export const fetchAllParts = async () => {
  const { data } = await api.get('/api/sell/all');
  return data; // { sells: [...] }
};

export const fetchAllPartsAdmin = async (params: { page?: number; limit?: number; isApproved?: boolean; isActive?: boolean; search?: string; category?: string; carBrand?: string } = {}) => {
  try {
    const { data } = await api.get('/api/admin/parts', { params });
    return data;
  } catch (err: any) {
    console.log(`❌ Primary admin endpoint failed, trying alternate:`, err?.response?.status);
    try {
      const { data } = await api.get('/api/parts/admin/parts', { params });
      return data;
    } catch (fallbackErr: any) {
      console.error(`❌ Both admin endpoints failed:`, fallbackErr?.response?.status);
      throw fallbackErr;
    }
  }
};

export const updatePartAdminById = async (partId: string, payload: any) => {
  console.log(`🔄 Attempting to update part ${partId} in database with:`, payload);
  try {
    console.log(`📡 Trying primary admin endpoint: /api/admin/parts/${partId}`);
    const { data } = await api.put(`/api/admin/parts/${partId}`, payload);
    console.log(`✅ Primary admin endpoint successful:`, data);
    return data;
  } catch (err: any) {
    console.log(`❌ Primary admin endpoint failed (${err?.response?.status}), trying alternate admin endpoint`);
    try {
      console.log(`📡 Trying alternate admin endpoint: /api/parts/admin/parts/${partId}`);
      const { data } = await api.put(`/api/parts/admin/parts/${partId}`, payload);
      console.log(`✅ Alternate admin endpoint successful:`, data);
      return data;
    } catch (fallbackErr: any) {
      console.log(`❌ Alternate admin endpoint failed (${fallbackErr?.response?.status}), trying workaround approach`);
      try {
        const current = await api.get(`/api/sell/user/${partId}`).catch(() => null);
        const currentPart = (current as any)?.data?.sells?.find?.((p: any) => p._id === partId);
        if (!currentPart) throw new Error('Part not found for admin update');
        const completePayload = {
          userId: currentPart.userId || currentPart.seller,
          partName: payload.partName || currentPart.partName,
          brand: currentPart.carBrand || currentPart.brand,
          model: currentPart.carModel || currentPart.model,
          year: currentPart.year,
          price: payload.price || payload.salePrice || currentPart.salePrice || currentPart.price,
          state: currentPart.governorate || 'Baghdad', // Default state
          city: payload.city || currentPart.city,
          category: currentPart.category,
          condition: currentPart.condition || 'used',
          description: currentPart.description || '',
          stockCount: payload.stockCount || currentPart.stockCount || 1,
          adminUpdate: true,
          isApproved: payload.isApproved,
          isActive: payload.isActive,
        };
        console.log(`📡 Trying sell endpoint with complete payload:`, completePayload);
        const { data } = await api.put(`/api/sell/${partId}`, completePayload);
        console.log(`✅ Sell endpoint successful, now applying admin overrides:`, data);
        return { success: true, message: 'Part updated via workaround method', data };
      } catch (workaroundErr: any) {
        console.error(`❌ All update methods failed for part ${partId}:`, workaroundErr?.response?.status, workaroundErr?.response?.data);
        throw workaroundErr;
      }
    }
  }
};

export const deletePartById = async (partId: string, hardDelete: boolean = false) => {
  console.log(`🗑️ Attempting to delete part ${partId} (hard delete: ${hardDelete})`);
  try {
    if (hardDelete) {
      try {
        console.log(`📡 Trying admin delete endpoint: /api/admin/parts/${partId}?hardDelete=true`);
        const { data } = await api.delete(`/api/admin/parts/${partId}?hardDelete=true`);
        console.log(`✅ Admin hard delete successful:`, data);
        return data;
      } catch (adminErr: any) {
        console.log(`❌ Admin delete failed (${adminErr?.response?.status}), trying alternate admin endpoint`);
        try {
          const { data } = await api.delete(`/api/parts/admin/parts/${partId}?hardDelete=true`);
          console.log(`✅ Alternate admin hard delete successful:`, data);
          return data;
        } catch (altErr: any) {
          console.log(`❌ Alternate admin delete failed, falling back to sell endpoint`);
        }
      }
    }
    console.log(`📡 Using sell endpoint for delete: /api/sell/${partId}`);
    const { data } = await api.delete(`/api/sell/${partId}`);
    console.log(`✅ Sell delete successful:`, data);
    return data;
  } catch (err: any) {
    console.error(`❌ Delete failed for part ${partId}:`, err?.response?.status, err?.response?.data);
    throw err;
  }
};

// -----------------------
// Health
// -----------------------
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const { data } = await api.get('/api/sell/health');
    console.log('Backend health check response:', data);
    return data;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    throw error;
  }
};

export default api;


