import api from "./axios";

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
    const { data } = await api.post<LoginResponse>("/auth/signin", credentials);
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data;
  },

  register: async (credentials: any) => {
    const { data } = await api.post<SignupResponse>(
      "/auth/signup",
      credentials,
    );
    return data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  },

  sendUserMessage: async (data: {
    full_name?: string;
    email?: string;
    message: string;
  }) => {
    const response = await api.post("/user/message", data);
    return response.data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },
};

export interface NearestAQIData {
  id: string;
  node_id: number;
  timestamp: string;
  lat: number;
  lon: number;
  pm25: number | null;
  no2: number | null;
  o3: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  temperature: number | null;
  humidity: number | null;
  traffic_density: number | null;
  traffic_current_speed: number | null;
  traffic_free_flow_speed: number | null;
  traffic_confidence: number | null;
  risk_score: number | null;
  risk_level: string | null;
}

export const mapsApi = {
  getNearestAQI: async (lat: number, lon: number): Promise<NearestAQIData> => {
    const { data } = await api.get<{ status: string; data: NearestAQIData }>(
      `/maps/air-quality/nearest?lat=${lat}&lon=${lon}`,
    );
    return data.data;
  },
};

// ─── Pollution Reports ─────────────────────────────────────────────────────────

export interface PollutionReport {
  id: number;
  user_id: number;
  description: string;
  lat: number;
  lon: number;
  image_url: string | null;
  image_key: string | null;
  image_size: number | null;
  mime_type: string | null;
  status: string;
  created_at: string;
}

export interface SubmitReportPayload {
  description: string;
  lat: number;
  lon: number;
  image?: File | null;
}

export const reportApi = {
  submit: async (payload: SubmitReportPayload): Promise<PollutionReport> => {
    const form = new FormData();
    form.append("description", payload.description);
    form.append("lat", String(payload.lat));
    form.append("lon", String(payload.lon));
    if (payload.image) {
      form.append("image", payload.image);
    }
    const { data } = await api.post<{
      status: string;
      report: PollutionReport;
    }>("/user/reports", form);
    return data.report;
  },

  list: async (limit = 20, offset = 0): Promise<PollutionReport[]> => {
    const { data } = await api.get<{
      status: string;
      reports: PollutionReport[];
    }>(`/user/reports?limit=${limit}&offset=${offset}`);
    return data.reports;
  },

  delete: async (reportId: number): Promise<void> => {
    await api.delete(`/user/reports/${reportId}`);
  },
};
