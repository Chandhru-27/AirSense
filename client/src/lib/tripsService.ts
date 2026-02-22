import api from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

interface PlanTripRequest {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  horizon?: "6h" | "12h" | "24h";
  health_profile?: {
    asthma?: boolean;
    elderly?: boolean;
    child?: boolean;
  };
}

export const usePlanTrip = () => {
  return useMutation({
    mutationFn: async (payload: PlanTripRequest) => {
      const response = await api.post("/trips/plan-safe-route", payload);
      return response.data;
    },
  });
};
