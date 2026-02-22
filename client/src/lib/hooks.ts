import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  reportApi,
  type LoginResponse,
  type SignupResponse,
  type User,
  type SubmitReportPayload,
} from "./api";

export const useUser = () => {
  return useQuery<User>({
    queryKey: ["user"],
    queryFn: authApi.getCurrentUser,
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, any>({
    mutationFn: (credentials) => authApi.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
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
      queryClient.clear();
    },
  });
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: (data: {
      full_name?: string;
      email?: string;
      message: string;
    }) => authApi.sendUserMessage(data),
  });
};

export const useSubmitReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReportPayload) => reportApi.submit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
  });
};

export const useMyReports = () => {
  return useQuery({
    queryKey: ["my-reports"],
    queryFn: () => reportApi.list(),
    staleTime: 2 * 60 * 1000,
  });
};
