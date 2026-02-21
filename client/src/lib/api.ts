import api from './axios';

export interface User {
  user_id: string;
  username?: string;
  email?: string;
  logged_in: boolean;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
}

export interface SignupResponse {
  message: string;
  user_id: string;
}

export const authApi = {
  login: async (credentials: any) => {
    const { data } = await api.post<LoginResponse>('/auth/signin', credentials);
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  register: async (credentials: any) => {
    const { data } = await api.post<SignupResponse>('/auth/signup', credentials);
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    }
  },

  getCurrentUser: async () => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  }
};
