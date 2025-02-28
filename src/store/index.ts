
// Simple store implementation using React's useState
import { create } from 'zustand';
import { Breakdown } from '@/types/project';

interface StoreState {
  breakdown: Breakdown | null;
  projectDescription: string;
  setBreakdown: (breakdown: Breakdown | null) => void;
  setProjectDescription: (description: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  breakdown: null,
  projectDescription: '',
  setBreakdown: (breakdown) => set({ breakdown }),
  setProjectDescription: (projectDescription) => set({ projectDescription }),
}));
