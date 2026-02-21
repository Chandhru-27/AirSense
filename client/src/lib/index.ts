// Shared Types

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface PersonalizationData {
    medicalCategory: string;
    asthma: boolean;
    pregnancy: boolean;
    ageGroup: string;
    fitnessLevel: string;
    customNotes?: string;
}

export interface AQIData {
    value: number;
    label: string;
    color: string;
}

export type TimeFrame = '6hr' | '12hr' | '24hr' | '2d';

export interface WeatherData {
    condition: 'Sunny' | 'Windy' | 'Rainy' | 'Cloudy';
    temp: number;
    icon: string;
}
