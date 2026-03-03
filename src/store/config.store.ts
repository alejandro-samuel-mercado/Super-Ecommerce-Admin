import { ConfigAPI } from '@/services/api';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { StoreConfig } from '../types/extended';

interface ConfigState {
  config: Partial<StoreConfig> | null;
  isLoading: boolean;
  
  setConfig: (config: Partial<StoreConfig>) => void;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<StoreConfig>) => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: null,
      isLoading: false,

      setConfig: (config) => set({ config }),
      
      fetchConfig: async () => {
        set({ isLoading: true });
        try {
          const data = await ConfigAPI.get({ t: Date.now() });
          set({ config: data, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      updateConfig: async (newConfig) => {
        try {
            
            const current = get().config;
            set({ config: { ...current, ...newConfig } });
            
            await ConfigAPI.update(newConfig);
           
        } catch (error) {
           
            get().fetchConfig(); 
            throw error;
        }
      }
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
      })),
    }
  )
);
