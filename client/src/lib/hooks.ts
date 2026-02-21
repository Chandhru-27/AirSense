import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginResponse, type SignupResponse, type User } from './api';

export const useUser = () => {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: authApi.getCurrentUser,
    retry: false, // Don't retry if not logged in
    staleTime: 5 * 60 * 1000, // Check again after 5 minutes
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, any>({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: () => {
      // Invalidate the user query to refetch data after successful login
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  return useMutation<SignupResponse, Error, any>({
    mutationFn: (credentials) => authApi.register(credentials),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached queries when user logs out
      queryClient.clear();
    },
  });
};
