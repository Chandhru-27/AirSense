import { create } from 'zustand';

export interface AQIData {
    value: number;
    label: string;
    color: string;
}

export type TimeFrame = '6hr' | '12hr' | '24hr' | '2d';

interface AQIState {
    currentAQI: AQIData | null;
    forecastAQI: Record<TimeFrame, AQIData>;
    selectedTimeFrame: TimeFrame;
    setTimeFrame: (timeFrame: TimeFrame) => void;
    setCurrentAQI: (aqi: AQIData) => void;
}

export const useAQIStore = create<AQIState>((set) => ({
    currentAQI: { value: 45, label: 'Good', color: 'green' }, // Default mock data
    forecastAQI: {
        '6hr': { value: 50, label: 'Good', color: 'green' },
        '12hr': { value: 75, label: 'Moderate', color: 'yellow' },
        '24hr': { value: 110, label: 'Unhealthy for Sensitive Groups', color: 'orange' },
        '2d': { value: 155, label: 'Unhealthy', color: 'red' },
    },
    selectedTimeFrame: '6hr',
    setTimeFrame: (timeFrame) => set({ selectedTimeFrame: timeFrame }),
    setCurrentAQI: (aqi) => set({ currentAQI: aqi }),
}));
