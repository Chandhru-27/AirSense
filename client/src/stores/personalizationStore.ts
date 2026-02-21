import { create } from 'zustand';

export interface PersonalizationData {
    medicalCategory: string;
    asthma: boolean;
    pregnancy: boolean;
    ageGroup: string;
    fitnessLevel: string;
    customNotes?: string;
}

interface PersonalizationState extends PersonalizationData {
    setAnswers: (data: Partial<PersonalizationData>) => void;
}

export const usePersonalizationStore = create<PersonalizationState>((set) => ({
    medicalCategory: '',
    asthma: false,
    pregnancy: false,
    ageGroup: '',
    fitnessLevel: '',
    customNotes: '',
    setAnswers: (data) => set((state) => ({ ...state, ...data })),
}));
