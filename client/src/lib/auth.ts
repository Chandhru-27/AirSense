import api from './axios';

export const authService = {
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always remove tokens on logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      
      // Redirect to login page
      window.location.href = '/login';
    }
  },
};
